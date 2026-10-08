from datetime import datetime, date
from sqlalchemy import Column, Integer, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    report_date = Column(Date, nullable=False, index=True)
    reported_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    group = relationship("Group", back_populates="reports")
    member = relationship("Member", back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, group_id={self.group_id}, member_id={self.member_id}, date={self.report_date})>"
