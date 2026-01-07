// src/services/games.local.ts
import { all, first, run } from "../data/local/db";
import { enqueueOutbox } from "./sync/outbox";

export type Game = {
  id: number;
  title: string;
  coverUri?: string;
  availableAt?: number[]; // ids de establecimientos

  createdAt?: number | string;
  updatedAt?: number | string;

  deleted?: boolean;
};

type DbRow = {
  id: string;        // guardado como TEXT pero es número serializado
  data: string;      // JSON del objeto
  updatedAt: number;
  deleted: number;
  syncStatus: string;
};

const now = () => Date.now();

function parseRow(row: DbRow): Game {
  const obj = JSON.parse(row.data) as Game;

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
  const row = await first<{ c: number }>(`SELECT COUNT(*) as c FROM games WHERE deleted = 0`, []);
  const count = row?.c ?? 0;
  if (count > 0) return;

  // Seeds básicos
  await create({ title: "Street Fighter 6", availableAt: [], coverUri: undefined });
  await create({ title: "Tekken 8", availableAt: [], coverUri: undefined });
  await create({ title: "Super Smash Bros. Ultimate", availableAt: [], coverUri: undefined });
}

export async function list(): Promise<Game[]> {
  const rows = await all<DbRow>(`SELECT * FROM games WHERE deleted = 0 ORDER BY updatedAt DESC`, []);
  return rows.map(parseRow);
}

export async function getById(id: number): Promise<Game | null> {
  const row = await first<DbRow>(`SELECT * FROM games WHERE id = ? LIMIT 1`, [String(id)]);
  return row ? parseRow(row) : null;
}

export async function create(input: Omit<Game, "id">): Promise<Game> {
  const id = await nextId("games_seq");
  const ts = now();

  const payload: Game = {
    ...input,
    id,
    availableAt: input.availableAt ?? [],
    createdAt: ts,
    updatedAt: ts,
  };

  await run(
    `INSERT INTO games (id, data, updatedAt, deleted, syncStatus)
     VALUES (?, ?, ?, 0, 'dirty')`,
    [String(id), JSON.stringify(payload), ts]
  );

  await enqueueOutbox("games", "upsert", String(id), payload);

  return payload;
}

export async function update(id: number, patch: Partial<Omit<Game, "id">>): Promise<Game> {
  const existing = await getById(id);
  if (!existing) throw new Error(`Game ${id} no existe`);

  const ts = now();
  const payload: Game = {
    ...existing,
    ...patch,
    id,
    updatedAt: ts,
  };

  await run(
    `UPDATE games
     SET data = ?, updatedAt = ?, deleted = 0, syncStatus = 'dirty'
     WHERE id = ?`,
    [JSON.stringify(payload), ts, String(id)]
  );

  await enqueueOutbox("games", "upsert", String(id), payload);

  return payload;
}

export async function remove(id: number): Promise<void> {
  const ts = now();
  await run(
    `UPDATE games
     SET deleted = 1, updatedAt = ?, syncStatus = 'pending_delete'
     WHERE id = ?`,
    [ts, String(id)]
  );

  await enqueueOutbox("games", "delete", String(id));

}
