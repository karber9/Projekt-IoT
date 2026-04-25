from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String

from models.task_model import Base


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String, primary_key=True)
    last_seen = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
