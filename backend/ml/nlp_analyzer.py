

scam_keywords = [
    "urgent",
    "send money",
    "investment",
    "guaranteed profit",
    "crypto giveaway",
    "transfer now",
    "limited time"
]

def analyze_text(text: str):

    score = 0

    for keyword in scam_keywords:
        if keyword in text.lower():
            score += 1

    risk = score / len(scam_keywords)

    return {
        "text": text,
        "risk_score": risk,
        "flagged": risk > 0.2
    }