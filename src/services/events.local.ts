// src/services/events.local.ts
import { all, first, run } from "../data/local/db";
import { enqueueOutbox } from "./sync/outbox";


export type EventType =
  | "ThemeNight"
  | "Launch"
  | "WatchParty"
  | "Promo"
  | "Workshop"
  | "CasualBracket"
  | "Community";

export type Event = {
  id: number;
  title: string;
  coverUri?: string;
  type: EventType;
  description?: string;
  

  date?: string;     // "YYYY-MM-DD"
  time?: string;     // "HH:mm"
  endTime?: string;  // "HH:mm"

  gameId?: number;
  venues?: number[];

  price?: string;
  promo?: string;
  capacity?: number;

  status?: "active" | "blocked";

  createdAt?: number;
  updatedAt?: number;

  // control interno
  deleted?: boolean;
};

type DbRow = {
  id: string;        // en SQLite lo guardamos como TEXT (pero es número serializado)
  data: string;      // JSON
  updatedAt: number;
  deleted: number;
  syncStatus: string;
};

type AttendanceRow = {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

const now = () => Date.now();

function parseRow(row: DbRow): Event {
  const obj = JSON.parse(row.data) as Event;
  return {
    ...obj,
    id: Number(row.id),
    updatedAt: row.updatedAt,
    deleted: row.deleted === 1,
  };
}

function attendanceId(eventId: number, userId: string): string {
  return `${eventId}_${userId.trim().toLowerCase()}`;
}

// --- meta helpers (para secuencias) ---
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

// --- API que ya usan tus pantallas ---

export async function seedIfEmpty(): Promise<void> {
  const row = await first<{ c: number }>(`SELECT COUNT(*) as c FROM events WHERE deleted = 0`, []);
  const count = row?.c ?? 0;
  if (count > 0) return;

  // seeds simples (puedes cambiarlos cuando quieras)
  await create({
    title: "Torneo casual Smash",
    type: "CasualBracket",
    price: "Gratis",
    date: "2025-12-23",
    time: "18:00",
    venues: [],
  });

  await create({
    title: "Noche temática Retro",
    type: "ThemeNight",
    price: "$50 MXN",
    promo: "2x1 en snacks",
    date: "2025-12-28",
    time: "20:00",
    venues: [],
  });
}

export async function list(): Promise<Event[]> {
  const rows = await all<DbRow>(
    `SELECT * FROM events WHERE deleted = 0 ORDER BY updatedAt DESC`,
    []
  );
  return rows.map(parseRow);
}

export async function getById(id: number): Promise<Event | null> {
  const row = await first<DbRow>(`SELECT * FROM events WHERE id = ? LIMIT 1`, [String(id)]);
  return row ? parseRow(row) : null;
}

export async function create(input: Omit<Event, "id">): Promise<Event> {
  const id = await nextId("events_seq");
  const ts = now();

  const payload: Event = {
    ...input,
    id,
    venues: input.venues ?? [],
    status: input.status ?? "active",
    createdAt: ts,
    updatedAt: ts,
  };

  await run(
    `INSERT INTO events (id, data, updatedAt, deleted, syncStatus)
     VALUES (?, ?, ?, 0, 'dirty')`,
    [String(id), JSON.stringify(payload), ts]
  );

  await enqueueOutbox("events", "upsert", String(id), payload);

  return payload;
}

export async function update(id: number, patch: Partial<Omit<Event, "id">>): Promise<Event> {
  const existing = await getById(id);
  if (!existing) throw new Error(`Event ${id} no existe`);

  const ts = now();
  const payload: Event = {
    ...existing,
    ...patch,
    id,
    updatedAt: ts,
  };

  await run(
    `UPDATE events
     SET data = ?, updatedAt = ?, deleted = 0, syncStatus = 'dirty'
     WHERE id = ?`,
    [JSON.stringify(payload), ts, String(id)]
  );

  await enqueueOutbox("events", "upsert", String(id), payload);

  return payload;
}

export async function remove(id: number): Promise<void> {
  const ts = now();
  await run(
    `UPDATE events
     SET deleted = 1, updatedAt = ?, syncStatus = 'pending_delete'
     WHERE id = ?`,
    [ts, String(id)]
  );

  await enqueueOutbox("events", "delete", String(id));

}

export async function block(id: number): Promise<Event> {
  return await update(id, { status: "blocked" });
}

export async function unblock(id: number): Promise<Event> {
  return await update(id, { status: "active" });
}

export async function isUserAttending(eventId: number, userId: string): Promise<boolean> {
  const normalizedUserId = userId.trim().toLowerCase();
  if (!normalizedUserId) return false;

  const row = await first<AttendanceRow>(
    `SELECT * FROM event_attendees
     WHERE eventId = ? AND userId = ? AND status = 'going'
     LIMIT 1`,
    [String(eventId), normalizedUserId]
  );

  return !!row;
}

export async function countAttendance(eventId: number): Promise<number> {
  const row = await first<{ c: number }>(
    `SELECT COUNT(*) as c
     FROM event_attendees
     WHERE eventId = ? AND status = 'going'`,
    [String(eventId)]
  );

  return row?.c ?? 0;
}

export async function confirmAttendance(eventId: number, userId: string): Promise<void> {
  const ev = await getById(eventId);
  if (!ev) throw new Error("Evento no encontrado");

  const normalizedUserId = userId.trim().toLowerCase();
  if (!normalizedUserId) throw new Error("Usuario inválido");

  const alreadyGoing = await isUserAttending(eventId, normalizedUserId);
  if (alreadyGoing) return;

  if (ev.capacity) {
    const currentCount = await countAttendance(eventId);
    if (currentCount >= ev.capacity) {
      throw new Error("Evento lleno");
    }
  }

  const ts = now();
  const id = attendanceId(eventId, normalizedUserId);

  await run(
    `INSERT INTO event_attendees (id, eventId, userId, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'going', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = 'going',
       updatedAt = excluded.updatedAt`,
    [id, String(eventId), normalizedUserId, ts, ts]
  );
}

export async function cancelAttendance(eventId: number, userId: string): Promise<void> {
  const normalizedUserId = userId.trim().toLowerCase();
  if (!normalizedUserId) throw new Error("Usuario inválido");

  const existing = await first<AttendanceRow>(
    `SELECT * FROM event_attendees
     WHERE eventId = ? AND userId = ?
     LIMIT 1`,
    [String(eventId), normalizedUserId]
  );

  if (!existing) return;

  await run(
    `UPDATE event_attendees
     SET status = 'cancelled', updatedAt = ?
     WHERE eventId = ? AND userId = ?`,
    [now(), String(eventId), normalizedUserId]
  );
}

export async function register(id: number, nickOrEmail: string): Promise<Event> {
  await confirmAttendance(id, nickOrEmail);

  const ev = await getById(id);
  if (!ev) throw new Error("Evento no encontrado");

  return ev;
}

 // --- funciones internas para sync (no las exportamos) ---


