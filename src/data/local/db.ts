import * as SQLite from "expo-sqlite";

const DB_NAME = "zonagamer.db";

let _db: SQLite.SQLiteDatabase | null = null;

// Obtiene la instancia ya abierta
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

// Ejecuta SQL sin retornar filas (CREATE/INSERT/UPDATE/DELETE)
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  await db.execAsync(sql);
}

// Ejecuta SQL con parámetros (INSERT/UPDATE/DELETE) y regresa info
export async function run(sql: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
  const db = await getDb();
  return await db.runAsync(sql, params);
}

// Trae todas las filas
export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return await db.getAllAsync<T>(sql, params);
}

// Trae la primera fila
export async function first<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await all<T>(sql, params);
  return rows.length ? rows[0] : null;
}

export async function initDb(): Promise<void> {
  // Nota: en execAsync puedes ejecutar múltiples statements separados por ;
  await exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS event_attendees (
      id TEXT PRIMARY KEY NOT NULL,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'going',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_event_attendees_unique
    ON event_attendees(eventId, userId);

    CREATE INDEX IF NOT EXISTS idx_event_attendees_eventId
    ON event_attendees(eventId);

    CREATE INDEX IF NOT EXISTS idx_event_attendees_userId
    ON event_attendees(userId);

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS establecimientos (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0,
      syncStatus TEXT NOT NULL DEFAULT 'synced'
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      op TEXT NOT NULL,
      docId TEXT NOT NULL,
      payload TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_events_updatedAt ON events(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_games_updatedAt ON games(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_tournaments_updatedAt ON tournaments(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_establecimientos_updatedAt ON establecimientos(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_outbox_createdAt ON outbox(createdAt);
  `);

  console.log("✅ SQLite: tablas listas en", DB_NAME);
}
