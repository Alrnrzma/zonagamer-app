from fastapi import FastAPI
from app.routers import health, sync
from app.database import init_db

app = FastAPI(
    title="ZonaGamer API",
    description="Backend para sincronización offline-first con Supabase PostgreSQL",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(health.router)
app.include_router(sync.router)