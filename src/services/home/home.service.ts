import { listOutbox } from "../sync/outbox";

export type SyncResult = {
  push: {
    total: number;
    ok: number;
    fail: number;
  };
  pull: {
    total: number;
    lastPull: number;
  };
};

export async function fetchOutboxCount() {
  const items = await listOutbox();
  return { count: items.length };
}

export async function syncNowService(): Promise<SyncResult> {
  const { syncNow } = await import("../sync/syncEngine");
  return await syncNow();
}