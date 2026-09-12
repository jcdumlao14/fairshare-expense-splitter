from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.balances import router as balances_router
from app.api.expenses import router as expenses_router
from app.api.settlements import router as settlements_router
from app.database import Base, engine


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="FairShare API",
    description="AI-assisted expense splitting API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses_router)
app.include_router(balances_router)
app.include_router(settlements_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "fairshare-api",
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to FairShare API",
        "docs": "/docs",
    }