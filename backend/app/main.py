from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, sync
from app.database import init_db

app = FastAPI(
    title="ZonaGamer API",
    description="Backend para sincronización offline-first con Supabase PostgreSQL",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(health.router)
app.include_router(sync.router)