// src/services/tournaments.local.ts
import { all, first, run } from "../data/local/db";
import { enqueueOutbox } from "./sync/outbox";


export type Platform = "Xbox" | "PlayStation" | "PC" | "Switch" | "Otro";

export type Tournament = {
  id: number;
  title: string;
  coverUri?: string;

  gameId?: number;
  venues?: number[];

  prize?: string;
  entryFee?: string;
  platform?: Platform;
  requirements?: string;

  date?: string; // "YYYY-MM-DD"
  time?: string; // "HH:mm"

  maxParticipants?: number;
  participants?: string[];

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

function parseRow(row: DbRow): Tournament {
  const obj = JSON.parse(row.data) as Tournament;

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
  const row = await first<{ value: string }>(
    `SELECT value FROM meta WHERE key = ? LIMIT 1`,
    [key]
  );
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
    `SELECT COUNT(*) as c FROM tournaments WHERE deleted = 0`,
    []
  );
  const count = row?.c ?? 0;
  if (count > 0) return;

  await create({
    title: "Torneo de prueba",
    platform: "Otro",
    entryFee: "Gratis",
    prize: "Honor y gloria",
    venues: [],
    participants: [],
    maxParticipants: 32,
  });
}

export async function list(): Promise<Tournament[]> {
  const rows = await all<DbRow>(
    `SELECT * FROM tournaments WHERE deleted = 0 ORDER BY updatedAt DESC`,
    []
  );
  return rows.map(parseRow);
}

export async function getById(id: number): Promise<Tournament | null> {
  const row = await first<DbRow>(
    `SELECT * FROM tournaments WHERE id = ? LIMIT 1`,
    [String(id)]
  );
  return row ? parseRow(row) : null;
}

export async function create(input: Omit<Tournament, "id">): Promise<Tournament> {
  const id = await nextId("tournaments_seq");
  const ts = now();

  const payload: Tournament = {
    ...input,
    id,
    venues: input.venues ?? [],
    participants: input.participants ?? [],
    maxParticipants: input.maxParticipants ?? 32,
    createdAt: ts,
    updatedAt: ts,
  };

  await run(
    `INSERT INTO tournaments (id, data, updatedAt, deleted, syncStatus)
     VALUES (?, ?, ?, 0, 'dirty')`,
    [String(id), JSON.stringify(payload), ts]
  );

  await enqueueOutbox("tournaments", "upsert", String(id), payload);

  return payload;
}

export async function update(
  id: number,
  patch: Partial<Omit<Tournament, "id">>
): Promise<Tournament> {
  const existing = await getById(id);
  if (!existing) throw new Error(`Tournament ${id} no existe`);

  const ts = now();
  const payload: Tournament = {
    ...existing,
    ...patch,
    id,
    updatedAt: ts,
    // aseguras defaults
    venues: patch.venues ?? existing.venues ?? [],
    participants: patch.participants ?? existing.participants ?? [],
  };

  await run(
    `UPDATE tournaments
     SET data = ?, updatedAt = ?, deleted = 0, syncStatus = 'dirty'
     WHERE id = ?`,
    [JSON.stringify(payload), ts, String(id)]
  );

  await enqueueOutbox("tournaments", "upsert", String(id), payload);

  return payload;
}

export async function remove(id: number): Promise<void> {
  const ts = now();
  await run(
    `UPDATE tournaments
     SET deleted = 1, updatedAt = ?, syncStatus = 'pending_delete'
     WHERE id = ?`,
    [ts, String(id)]
  );

  await enqueueOutbox("tournaments", "delete", String(id));

}

// Registro simple (igual que en EventDetails)
export async function register(id: number, nickOrEmail: string): Promise<Tournament> {
  const t = await getById(id);
  if (!t) throw new Error("Torneo no encontrado");

  const nick = nickOrEmail.trim();
  if (!nick) throw new Error("Nick vacío");

  const participants = t.participants ?? [];
  const max = t.maxParticipants ?? undefined;

  if (max && participants.length >= max) {
    throw new Error("Torneo lleno");
  }
  if (participants.includes(nick)) {
    return t; // ya está inscrito
  }

  const updated = await update(id, {
    participants: [...participants, nick],
  });

 

  return updated;
}
