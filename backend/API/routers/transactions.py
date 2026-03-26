import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ml.nlp_analyzer import analyze_text
from ml.fraud_detector import detect_fraud
from ml.trust_score import calculate_trust

router = APIRouter(prefix="/transactions", tags=["Transactions"])


class Transaction(BaseModel):
    note: Optional[str] = ""
    amount: Optional[float] = 0.0
    sender: Optional[str] = ""
    receiver: Optional[str] = ""

@router.post("/analyze")
def analyze_transaction(tx: Transaction):
    try:
        nlp_score = analyze_text(tx.note or "")
        ml_score = detect_fraud(tx.dict())
        risk_score = min(100, nlp_score + ml_score)
        trust_score = calculate_trust(risk_score)

        if risk_score > 80:
            level = "CRITICAL"
        elif risk_score > 60:
            level = "HIGH"
        elif risk_score > 30:
            level = "MEDIUM"
        else:
            level = "SAFE"

        return {
            "risk_score": risk_score,
            "trust_score": trust_score,
            "risk_level": level
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phân tích thất bại: {str(e)}")