"""
AI Scam Detector — Backend API
================================
Chạy:  uvicorn api:app --host 0.0.0.0 --port 8080 --reload
Hoặc:  python api.py

Endpoints:
  GET  /                          → health check
  POST /check                     → kiểm tra scam nhanh (text)
  POST /analyze                   → phân tích đầy đủ (note + amount + addresses)
  POST /daa/proxy                 → proxy DAA Crypto API (giải quyết CORS/whitelist)
  GET  /daa/ticker                → giá BTC/USDT từ DAA
  GET  /daa/currencies            → danh sách currency từ DAA
  GET  /daa/orderbook             → orderbook từ DAA
  GET  /blacklist                 → danh sách địa chỉ blacklist
  GET  /reports                   → lịch sử báo cáo
"""

import os
import sys
import httpx
import uvicorn
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─── Import ML modules từ thư mục dự án gốc ──────────────────────────
# Nếu chạy từ thư mục gốc dự án, Python sẽ tìm được ml/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend", "API"))

try:
    from ml.nlp_analyzer import analyze_text
    from ml.fraud_detector import detect_fraud
    from ml.trust_score import calculate_trust
    ML_AVAILABLE = True
    print("✅ ML modules loaded")
except ImportError as e:
    print(f"⚠️  ML modules không tìm thấy ({e}) — dùng fallback rules")
    ML_AVAILABLE = False

# ─── App setup ────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Scam Detector API",
    description="Backend API cho ScamShield — chạy port 8080",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Production: thay bằng domain cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DAA_BASE = "https://api.daathena.com/api/v2"

# ─── Models ───────────────────────────────────────────────────────────
class MessageRequest(BaseModel):
    message: str

class AnalyzeRequest(BaseModel):
    note: Optional[str] = ""
    amount: Optional[float] = 0.0
    sender: Optional[str] = ""
    receiver: Optional[str] = ""

class DaaProxyRequest(BaseModel):
    path: str                       # VD: "/public/trade-spot/ticker/24h"
    params: Optional[dict] = {}
    apiKey: Optional[str] = ""


# ═══════════════════════════════════════════════════════════════════════
# SCAM DETECTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/")
def home():
    return {
        "status": "AI Scam Detector running",
        "port": 8080,
        "ml_available": ML_AVAILABLE,
        "endpoints": ["/check", "/analyze", "/daa/proxy", "/daa/ticker", "/daa/currencies", "/daa/orderbook"]
    }


@app.post("/check")
def check_scam_quick(data: MessageRequest):
    """Kiểm tra nhanh — trả về result đơn giản"""
    text = data.message.lower()

    # Dùng ML nếu có
    if ML_AVAILABLE:
        try:
            result = analyze_text(data.message)
            risk = result.get("risk_score", 0) * 100
            if risk > 50 or result.get("flagged"):
                return {"result": f"⚠️ Scam detected (risk: {risk:.0f}%)"}
            return {"result": f"✅ Safe (risk: {risk:.0f}%)"}
        except Exception:
            pass

    # Fallback: rule-based
    SCAM_KEYWORDS = [
        "send eth", "double your money", "crypto giveaway", "free token",
        "claim reward", "seed phrase", "private key", "guaranteed profit",
        "send money", "urgent transfer", "limited time offer",
        "chuyển tiền", "đầu tư đảm bảo", "lãi suất cao", "trúng thưởng"
    ]
    hits = [kw for kw in SCAM_KEYWORDS if kw in text]
    if hits:
        return {"result": f"⚠️ Scam detected — Từ khóa: {', '.join(hits[:3])}"}
    return {"result": "✅ Safe"}


@app.post("/analyze")
def analyze_transaction(tx: AnalyzeRequest):
    """Phân tích đầy đủ — trả về risk_score, trust_score, risk_level"""
    try:
        note_text = tx.note or ""

        if ML_AVAILABLE:
            # ── Dùng ML modules thật ──
            nlp_result  = analyze_text(note_text)
            fraud_result = detect_fraud(tx.dict())

            nlp_risk   = nlp_result.get("risk_score", 0) * 100
            fraud_risk = 80.0 if fraud_result.get("fraud") else (fraud_result.get("risk_score", 0) * 100)
            risk_score = min(100.0, (nlp_risk * 0.6 + fraud_risk * 0.4))
        else:
            # ── Fallback rule-based ──
            risk_score = _fallback_analyze(note_text, tx.amount or 0)

        trust_score = max(0.0, 100.0 - risk_score)

        if risk_score >= 80:
            level = "CRITICAL"
        elif risk_score >= 60:
            level = "HIGH"
        elif risk_score >= 30:
            level = "MEDIUM"
        else:
            level = "SAFE"

        return {
            "risk_score": round(risk_score, 2),
            "trust_score": round(trust_score, 2),
            "risk_level": level,
            "ml_used": ML_AVAILABLE
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phân tích thất bại: {str(e)}")


def _fallback_analyze(text: str, amount: float) -> float:
    """Rule-based khi ML không có"""
    KEYWORDS = [
        "urgent", "send money", "investment", "guaranteed profit",
        "crypto giveaway", "transfer now", "limited time", "claim now",
        "chuyển tiền", "đầu tư", "trúng thưởng", "miễn phí", "gấp"
    ]
    ltext = text.lower()
    hits = sum(1 for kw in KEYWORDS if kw in ltext)
    score = (hits / len(KEYWORDS)) * 100

    # Cộng thêm điểm rủi ro theo số tiền
    if amount > 100_000_000:   # > 100 triệu VND
        score += 20
    elif amount > 10_000_000:  # > 10 triệu VND
        score += 10

    return min(100.0, score)


# ═══════════════════════════════════════════════════════════════════════
# DAA CRYPTO API PROXY
# ═══════════════════════════════════════════════════════════════════════

@app.post("/daa/proxy")
async def daa_proxy(req: DaaProxyRequest):
    """
    Proxy chung cho DAA API — giải quyết CORS và Host whitelist.
    Frontend gọi POST /daa/proxy thay vì gọi thẳng api.daathena.com
    """
    if not req.path.startswith("/"):
        raise HTTPException(400, "path phải bắt đầu bằng /")

    url = DAA_BASE + req.path
    headers = {"Content-Type": "application/json"}
    if req.apiKey:
        headers["Authorization"] = req.apiKey

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=req.params or {}, headers=headers)
            data = resp.json()
            return data
        except httpx.RequestError as e:
            raise HTTPException(502, f"Không kết nối được DAA API: {str(e)}")
        except Exception as e:
            raise HTTPException(500, str(e))


@app.get("/daa/ticker")
async def daa_ticker(symbol: str = "btcusdt", api_key: str = ""):
    """Lấy giá ticker 24h từ DAA"""
    return await _daa_get("/public/trade-spot/ticker/24h", {"symbol": symbol}, api_key)


@app.get("/daa/currencies")
async def daa_currencies(page: str = "1", per_page: str = "50", api_key: str = ""):
    """Danh sách currencies từ DAA"""
    return await _daa_get("/public/wallet/currencies", {"page": page, "per_page": per_page}, api_key)


@app.get("/daa/orderbook")
async def daa_orderbook(symbol: str = "btcusdt", limit: str = "10", api_key: str = ""):
    """Orderbook từ DAA"""
    return await _daa_get("/public/trade-spot/oderbook", {"symbol": symbol, "limit": limit}, api_key)


@app.get("/daa/currency")
async def daa_currency_detail(symbol: str, api_key: str = ""):
    """Chi tiết một currency từ DAA"""
    return await _daa_get("/public/wallet/currency/detail", {"symbol": symbol}, api_key)


@app.get("/daa/balance")
async def daa_balance(api_key: str = ""):
    """Số dư ví từ DAA (cần API key có quyền Read)"""
    return await _daa_get("/public/wallet/balance", {}, api_key)


async def _daa_get(path: str, params: dict, api_key: str = ""):
    """Helper: gọi GET đến DAA API"""
    headers = {}
    if api_key:
        headers["Authorization"] = api_key

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(DAA_BASE + path, params=params, headers=headers)
            return resp.json()
        except httpx.RequestError as e:
            raise HTTPException(502, f"DAA API không phản hồi: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════
# OTHER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/blacklist")
def get_blacklist():
    """Danh sách địa chỉ/domain bị blacklist"""
    return {
        "items": [
            {"type": "domain", "value": "bnb-airdrop-claim.xyz", "reason": "Crypto scam"},
            {"type": "domain", "value": "vietcombank-secure.tk", "reason": "Phishing ngân hàng"},
            {"type": "phone",  "value": "0909123456", "reason": "Scam cuộc gọi"},
        ]
    }


@app.get("/reports")
def get_reports():
    """Lịch sử báo cáo scam"""
    return {"reports": [], "total": 0}


@app.post("/report")
def submit_report(data: MessageRequest):
    """Người dùng báo cáo nội dung scam mới"""
    return {"success": True, "message": "Cảm ơn! Báo cáo của bạn đã được ghi nhận."}


# ─── Chạy server ──────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 AI Scam Detector Backend")
    print("   URL: http://localhost:8080")
    print("   Docs: http://localhost:8080/docs")
    print("   ML modules:", "✅ loaded" if ML_AVAILABLE else "⚠️ fallback mode")
    print()
    uvicorn.run("api:app", host="0.0.0.0", port=8080, reload=True)