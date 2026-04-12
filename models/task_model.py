from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import DeclarativeBase

#Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass

#Database table model for tasks
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    status = Column(String, nullable=False, default="PENDING")
    payload = Column(String, nullable=False)
    result = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True),
                                  nullable=False,
                                  default=lambda: datetime.now(timezone.utc))
