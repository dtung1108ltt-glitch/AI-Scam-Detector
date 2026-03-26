

def detect_fraud(transaction):

    amount = transaction.get("amount", 0)

    if amount > 10000:
        return {
            "fraud": True,
            "risk_score": 0.8
        }

    return {
        "fraud": False,
        "risk_score": 0.1
    }