from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..dependencies import get_db, get_current_user
from .. import models
from ..services.weather import get_weather_advisory
from ..services.notification_service import create_notification

router = APIRouter(tags=["Weather"])


@router.get("/weather/advisory")
def weather_advisory(
    city: str = Query(..., description="City name"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = get_weather_advisory(city)
    risk = result.get("risk_level")
    if risk in ("HIGH", "SEVERE"):
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id,
            models.Notification.type == models.NotificationType.WEATHER_ALERT,
            models.Notification.created_at >= datetime.utcnow() - timedelta(hours=6),
        ).first()
        if not existing:
            title = "Heavy rainfall forecast today." if risk == "HIGH" else "Severe weather expected in your city."
            create_notification(
                db, current_user.id,
                title,
                result.get("summary", ""),
                models.NotificationType.WEATHER_ALERT,
            )
    return result
