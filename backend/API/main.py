import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model dữ liệu
class Message(BaseModel):
    message: str


# API test
@app.get("/")
def home():
    return {"status": "AI Scam Detector running"}


# API kiểm tra scam
@app.post("/check")
def check_scam(data: Message):

    text = data.message.lower()

    if "send eth" in text or "double your money" in text:
        return {"result": "⚠️ Scam detected"}

    return {"result": "✅ Safe"}


# API gửi transaction bằng thirdweb
@app.post("/send-transaction")
def send_transaction():

    url = "https://api.thirdweb.com/v1/transactions"

    headers = {
        "Content-Type": "application/json",
        "x-secret-key": "tSq...Plsw"
    }

    payload = {
        "chainId": 421614,
        "transactions": [
            {
                "data": "0x",
                "to": "vitalik.eth",
                "value": "0"
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    return response.json()