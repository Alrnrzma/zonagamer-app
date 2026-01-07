// src/services/establecimientos.local.ts
import { all, first, run } from "../data/local/db";
import { enqueueOutbox } from "./sync/outbox";

export type Establecimiento = {
  id: number;
  nombre: string;
  direccion?: string;

  // extras usados en Details/List
  photoUri?: string;
  rating?: number;
  games?: string[];
  openTime?: string;
  closeTime?: string;
  location?: { lat: number; lng: number };
  address?: string;

  createdAt?: number | string;
  updatedAt?: number | string;

  deleted?: boolean;
};

type DbRow = {
  id: string;
  data: string;
  updatedAt: number;
  deleted: number;
  syncStatus: string;
};

const now = () => Date.now();

function parseRow(row: DbRow): Establecimiento {
  const obj = JSON.parse(row.data) as Establecimiento;

  const createdAt =
    typeof obj.createdAt === "string" ? Date.parse(obj.createdAt) : obj.createdAt;

  const updatedAt =
    typeof obj.updatedAt === "string" ? Date.parse(obj.updatedAt) : obj.updatedAt;

  return {
    ...obj,
    id: Number(row.id),
    createdAt,
    updatedAt: row.updatedAt ?? updatedAt,
    deleted: row.deleted === 1,
  };
}

// --- meta helpers (secuencia de IDs) ---
async function getMeta(key: string): Promise<string | null> {
  const row = await first<{ value: string }>(`SELECT value FROM meta WHERE key = ? LIMIT 1`, [key]);
  return row?.value ?? null;
}

async function setMeta(key: string, value: string): Promise<void> {
  await run(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

async function nextId(seqKey: string): Promise<number> {
  const cur = await getMeta(seqKey);
  const n = (cur ? Number(cur) : 0) + 1;
  await setMeta(seqKey, String(n));
  return n;
}

// --- API usada por tus pantallas ---

export async function seedIfEmpty(): Promise<void> {
  const row = await first<{ c: number }>(
    `SELECT COUNT(*) as c FROM establecimientos WHERE deleted = 0`,
    []
  );
  const count = row?.c ?? 0;
  if (count > 0) return;

  await create({
    nombre: "ZonaGamer Centro",
    direccion: "CDMX",
  });

  await create({
    nombre: "ZonaGamer Norte",
    direccion: "CDMX",
  });
}

export async function list(): Promise<Establecimiento[]> {
  const rows = await all<DbRow>(
    `SELECT * FROM establecimientos WHERE deleted = 0 ORDER BY updatedAt DESC`,
    []
  );
  return rows.map(parseRow);
}

export async function getById(id: number): Promise<Establecimiento | null> {
  // id=0 lo usas como “crear”; devolvemos null y tu pantalla ya lo soporta
  if (!id) return null;
  const row = await first<DbRow>(
    `SELECT * FROM establecimientos WHERE id = ? LIMIT 1`,
    [String(id)]
  );
  return row ? parseRow(row) : null;
}

export async function create(
  input: Pick<Establecimiento, "nombre" | "direccion"> & Partial<Establecimiento>
): Promise<Establecimiento> {
  const id = await nextId("establecimientos_seq");
  const ts = now();

  const payload: Establecimiento = {
    id,
    nombre: input.nombre?.trim(),
    direccion: input.direccion?.trim() || undefined,
    photoUri: input.photoUri,
    rating: input.rating ?? 0,
    games: input.games ?? [],
    openTime: input.openTime,
    closeTime: input.closeTime,
    location: input.location,
    address: input.address,
    createdAt: ts,
    updatedAt: ts,
  };

  if (!payload.nombre) throw new Error("Nombre requerido");

  await run(
    `INSERT INTO establecimientos (id, data, updatedAt, deleted, syncStatus)
     VALUES (?, ?, ?, 0, 'dirty')`,
    [String(id), JSON.stringify(payload), ts]
  );

  await enqueueOutbox("establecimientos", "upsert", String(id), payload);

  return payload;
}

export async function update(
  id: number,
  patch: Partial<Omit<Establecimiento, "id">>
): Promise<Establecimiento | null> {
  const existing = await getById(id);
  if (!existing) return null;

  const ts = now();
  const payload: Establecimiento = {
    ...existing,
    ...patch,
    id,
    nombre: (patch.nombre ?? existing.nombre)?.trim(),
    direccion: (patch.direccion ?? existing.direccion)?.trim() || undefined,
    games: patch.games ?? existing.games ?? [],
    rating: patch.rating ?? existing.rating ?? 0,
    updatedAt: ts,
  };

  await run(
    `UPDATE establecimientos
     SET data = ?, updatedAt = ?, deleted = 0, syncStatus = 'dirty'
     WHERE id = ?`,
    [JSON.stringify(payload), ts, String(id)]
  );
  
  await enqueueOutbox("establecimientos", "upsert", String(id), payload);

  return payload;
}

export async function remove(id: number): Promise<void> {
  const ts = now();
  await run(
    `UPDATE establecimientos
     SET deleted = 1, updatedAt = ?, syncStatus = 'pending_delete'
     WHERE id = ?`,
    [ts, String(id)]
  );

  await enqueueOutbox("establecimientos", "delete", String(id));
  
}
