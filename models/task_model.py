from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    status = Column(String)
    payload = Column(String)
    result = Column(String)