def calculate_trust(risk: float) -> float:
    trust = 100 - risk
    if trust < 0:
        trust = 0
    return trust