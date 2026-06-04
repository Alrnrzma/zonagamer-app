from fastapi import FastAPI

app = FastAPI(
    title="ZonaGamer API",
    description="Servicio base para arquitectura offline-first y despliegue en la nube",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "ZonaGamer API funcionando correctamente"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "zonagamer-api"
    }

@app.get("/version")
def version():
    return {
        "version": "1.0.0",
        "sprint": "Sprint 4",
        "module": "Despliegue en la Nube"
    }