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