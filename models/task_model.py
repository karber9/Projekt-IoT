from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import DeclarativeBase

#Base class for all SQLAlchemy models
class Base(DeclarativeBase):
    pass

#Database table model for tasks
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    status = Column(String)
    payload = Column(String)
    result = Column(String)
