from fastapi import FastAPI
from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./complaints.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

app = FastAPI()



class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


# -------------------- Add Complaint --------------------
@app.post("/complaints")
def add_complaint(data: dict):
    db = SessionLocal()
    complaint = Complaint(**data)
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    db.close()
    return complaint



@app.get("/trends")
def get_trends(period: str = "day"):
    db = SessionLocal()

    if period == "month":
        fmt = "%Y-%m"
    elif period == "week":
        fmt = "%Y-%W"
    else:
        fmt = "%Y-%m-%d"

    trends = (
        db.query(
            func.strftime(fmt, Complaint.created_at).label("period"),
            Complaint.category,
            func.count().label("count"),
        )
        .group_by("period", Complaint.category)
        .order_by("period")
        .all()
    )

    db.close()

    return [
        {"period": t.period, "category": t.category, "count": t.count}
        for t in trends
    ]


