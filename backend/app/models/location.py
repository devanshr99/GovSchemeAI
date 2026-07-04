"""
Location ORM models — Indian states and districts.
"""

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class State(Base):
    __tablename__ = "states"

    code = Column(String(5), primary_key=True)
    name = Column(String(100), nullable=False)
    name_hi = Column(String(100))

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<State {self.code}: {self.name}>"


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    state_code = Column(String(5), ForeignKey("states.code"), nullable=False)
    name = Column(String(100), nullable=False)
    name_hi = Column(String(100))

    state = relationship("State", back_populates="districts")

    def __repr__(self):
        return f"<District {self.name} ({self.state_code})>"
