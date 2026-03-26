from fastapi import APIRouter

router = APIRouter()

@router.get("/blacklist")
def get_blacklist():
    # placeholder implementation
    return {"items": []}
