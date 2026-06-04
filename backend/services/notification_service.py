from typing import Optional
from sqlalchemy.orm import Session
from .. import models


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: models.NotificationType,
    metadata_json: Optional[str] = None,
) -> models.Notification:
    n = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        metadata_json=metadata_json,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
