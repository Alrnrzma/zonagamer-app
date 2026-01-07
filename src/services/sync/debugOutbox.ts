import { listOutbox } from "./outbox";

export async function debugPrintOutbox(tag = "") {
  const items = await listOutbox();
  console.log(`📦 OUTBOX PENDIENTE ${tag} -> ${items.length}`);
  if (items.length <= 20) console.log(items);
}