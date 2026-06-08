import json
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CloudEntity

router = APIRouter(prefix="/sync", tags=["sync"])

class SyncItem(BaseModel):
    entity: str
    docId: str
    op: str
    payload: dict | None = None

class PullResponseItem(BaseModel):
    entity: str
    docId: str
    data: dict | None
    deleted: int
    updatedAt: int

@router.post("/push")
def push_item(item: SyncItem, db: Session = Depends(get_db)):
    now = int(time.time() * 1000)
    row_id = f"{item.entity}_{item.docId}"

    existing = db.query(CloudEntity).filter(CloudEntity.id == row_id).first()

    if item.op == "delete":
        if existing:
            existing.deleted = 1
            existing.updated_at = now
        else:
            existing = CloudEntity(
                id=row_id,
                entity=item.entity,
                doc_id=item.docId,
                data=None,
                deleted=1,
                updated_at=now,
            )
            db.add(existing)

        db.commit()
        return {"ok": True, "op": "delete", "id": row_id}

    if item.op == "upsert":
        if not item.payload:
            raise HTTPException(status_code=400, detail="payload requerido para upsert")

        data_json = json.dumps(item.payload, ensure_ascii=False)

        if existing:
            existing.data = data_json
            existing.deleted = 0
            existing.updated_at = now
        else:
            existing = CloudEntity(
                id=row_id,
                entity=item.entity,
                doc_id=item.docId,
                data=data_json,
                deleted=0,
                updated_at=now,
            )
            db.add(existing)

        db.commit()
        return {"ok": True, "op": "upsert", "id": row_id}

    raise HTTPException(status_code=400, detail="Operación no soportada")

@router.get("/pull", response_model=list[PullResponseItem])
def pull_all(since: int = 0, db: Session = Depends(get_db)):
    rows = (
        db.query(CloudEntity)
        .filter(CloudEntity.updated_at > since)
        .order_by(CloudEntity.updated_at.asc())
        .all()
    )

    result = []

    for row in rows:
        result.append({
            "entity": row.entity,
            "docId": row.doc_id,
            "data": json.loads(row.data) if row.data else None,
            "deleted": row.deleted,
            "updatedAt": row.updated_at,
        })

    return result