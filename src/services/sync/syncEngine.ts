import { run, first } from "../../data/local/db";
import { listOutbox, removeOutboxItem, OutboxItem } from "./outbox";

/**
 * IMPORTANTE:
 * - Si pruebas en navegador/web: usa http://localhost:8000
 * - Si pruebas en emulador Android: usa http://10.0.2.2:8000
 * - Si pruebas en celular físico: usa la IP de tu PC, ejemplo http://192.168.1.50:8000
 */
const API_BASE_URL = "https://zonagamer-app.onrender.com";

type PullItem = {
  entity: "events" | "games" | "tournaments" | "establecimientos";
  docId: string;
  data: any | null;
  deleted: number;
  updatedAt: number;
};

async function getMeta(key: string): Promise<string | null> {
  const row = await first<{ value: string }>(
    `SELECT value FROM meta WHERE key = ? LIMIT 1`,
    [key]
  );

  return row?.value ?? null;
}

async function setMeta(key: string, value: string): Promise<void> {
  await run(
    `
    INSERT INTO meta (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [key, value]
  );
}

async function pushOutboxItem(item: OutboxItem) {
  const response = await fetch(`${API_BASE_URL}/sync/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entity: item.entity,
      docId: String(item.docId),
      op: item.op,
      payload: item.payload ?? null,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error API /sync/push: ${response.status} ${text}`);
  }

  return await response.json();
}

async function applyPulledItem(item: PullItem) {
  const table = item.entity;

  if (item.deleted === 1) {
    await run(
      `
      UPDATE ${table}
      SET deleted = 1,
          updatedAt = ?,
          syncStatus = 'synced'
      WHERE id = ?
      `,
      [item.updatedAt, item.docId]
    );

    return;
  }

  if (!item.data) return;

  await run(
    `
    INSERT INTO ${table} (id, data, updatedAt, deleted, syncStatus)
    VALUES (?, ?, ?, 0, 'synced')
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updatedAt = excluded.updatedAt,
      deleted = 0,
      syncStatus = 'synced'
    `,
    [item.docId, JSON.stringify(item.data), item.updatedAt]
  );
}

export async function pushPendingChanges() {
  const items = await listOutbox();

  let ok = 0;
  let fail = 0;

  for (const item of items) {
    try {
      await pushOutboxItem(item);
      await removeOutboxItem(item.id);
      ok++;
    } catch (e) {
      console.log("❌ Error subiendo outbox a FastAPI:", item, e);
      fail++;
    }
  }

  return {
    total: items.length,
    ok,
    fail,
  };
}

export async function pullCloudData() {
  const lastPull = Number((await getMeta("cloud_last_pull")) ?? 0);

  const response = await fetch(`${API_BASE_URL}/sync/pull?since=${lastPull}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error API /sync/pull: ${response.status} ${text}`);
  }

  const items = (await response.json()) as PullItem[];

  let newest = lastPull;

  for (const item of items) {
    await applyPulledItem(item);

    if (item.updatedAt > newest) {
      newest = item.updatedAt;
    }
  }

  await setMeta("cloud_last_pull", String(newest));

  return {
    total: items.length,
    lastPull: newest,
  };
}

export async function syncNow() {
  console.log("🔄 Sincronizando con FastAPI/Supabase...");

  const pushResult = await pushPendingChanges();
  const pullResult = await pullCloudData();

  console.log("✅ Sync completa:", {
    push: pushResult,
    pull: pullResult,
  });

  return {
    push: pushResult,
    pull: pullResult,
  };
}

// Alias para compatibilidad si alguna parte de la app todavía llama pullUserData()
export async function pullUserData(_userId?: string) {
  return await pullCloudData();
}