from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Transaction(Base):

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)

    from_addr = Column(String)

    to_addr = Column(String)

    amount = Column(Float)

    note = Column(String)

    risk_score = Column(Integer)