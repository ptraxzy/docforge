from fastapi import APIRouter
from datetime import datetime, timezone
from services.ai_provider import get_ai_provider

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint with AI provider status."""
    ai = get_ai_provider()
    ai_status = await ai.check_health()

    return {
        "status": "healthy",
        "service": "docforge-server",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_provider": ai_status,
    }
