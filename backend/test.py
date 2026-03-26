import sys, os
sys.path.insert(0, 'D:/tung/AIScamDetector/backend')

# Test từng import một
try:
    from ml.nlp_analyzer import analyze_text
    print('nlp_analyzer OK')
except Exception as e:
    print('nlp_analyzer ERROR:', e)

try:
    from ml.fraud_detector import detect_fraud
    print('fraud_detector OK')
except Exception as e:
    print('fraud_detector ERROR:', e)

try:
    from ml.trust_score import calculate_trust
    print('trust_score OK')
except Exception as e:
    print('trust_score ERROR:', e)