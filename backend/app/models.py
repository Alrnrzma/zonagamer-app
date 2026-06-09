from sqlalchemy import Column, String, Integer, BigInteger, Text
from app.database import Base

class CloudEntity(Base):
    __tablename__ = "cloud_entities"

    id = Column(String, primary_key=True, index=True)
    entity = Column(String, index=True, nullable=False)
    doc_id = Column(String, index=True, nullable=False)
    data = Column(Text, nullable=True)
    deleted = Column(Integer, default=0)
    updated_at = Column(BigInteger, nullable=False)

class AppUser(Base):
    __tablename__ = "app_users"

    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    telefono = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    status = Column(String, nullable=False, default="active")
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)