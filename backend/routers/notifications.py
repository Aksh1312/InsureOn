from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .. import models
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    metadata_json: Optional[str] = None

    model_config = {"from_attributes": True}


class UnreadCountOut(BaseModel):
    count: int


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user.id)
        .order_by(models.Notification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    count = (
        db.query(func.count(models.Notification.id))
        .filter(
            models.Notification.user_id == user.id,
            models.Notification.is_read == False,
        )
        .scalar()
    )
    return UnreadCountOut(count=count or 0)


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    n = (
        db.query(models.Notification)
        .filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == user.id,
        )
        .first()
    )
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"ok": True}
