from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {
        "message": "ZonaGamer API funcionando correctamente"
    }

@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "zonagamer-api"
    }

@router.get("/version")
def version():
    return {
        "version": "1.0.0",
        "module": "Offline-first + Supabase PostgreSQL"
    }