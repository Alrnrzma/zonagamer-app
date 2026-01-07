import { all, run } from "../../data/local/db";

export type OutboxEntity = "events" | "games" | "tournaments" | "establecimientos";
export type OutboxOp = "upsert" | "delete";

export type OutboxItem = {
  id: string;
  entity: OutboxEntity;
  op: OutboxOp;
  docId: string;
  payload?: any;
  createdAt: number;
};

function uid() {
  // simple y suficiente para outbox local
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function enqueueOutbox(
  entity: OutboxEntity,
  op: OutboxOp,
  docId: string,
  payload?: any
) {
  const item: OutboxItem = {
    id: uid(),
    entity,
    op,
    docId,
    payload,
    createdAt: Date.now(),
  };

  await run(
    `INSERT INTO outbox (id, entity, op, docId, payload, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.entity, item.op, item.docId, item.payload ? JSON.stringify(item.payload) : null, item.createdAt]
  );

  return item;
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const rows = await all<any>(`SELECT * FROM outbox ORDER BY createdAt ASC`, []);
  return rows.map((r) => ({
    id: r.id,
    entity: r.entity,
    op: r.op,
    docId: r.docId,
    payload: r.payload ? JSON.parse(r.payload) : undefined,
    createdAt: r.createdAt,
  }));
}

export async function removeOutboxItem(id: string) {
  await run(`DELETE FROM outbox WHERE id = ?`, [id]);
}
