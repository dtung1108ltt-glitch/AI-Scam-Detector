from API.celery_app import celery

@celery.task
def analyze_async(data):
    print("Running AI analysis...")
    return {"risk_score": 0.25}