from sqlalchemy import Column, Integer, String
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    platform = Column(String)
    region = Column(String)
    income = Column(Integer)
    hashed_password = Column(String)