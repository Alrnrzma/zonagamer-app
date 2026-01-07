import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // 👈 usa db (NO firestore)
import { firestore } from "../firebase";


import { listOutbox, removeOutboxItem, OutboxItem } from "./outbox";

export async function syncNow() {
  const items = await listOutbox();

  let ok = 0;
  let fail = 0;

  for (const it of items) {
    try {
      const ref = doc(db, it.entity, String(it.docId));

      if (it.op === "upsert") {
        await setDoc(
          ref,
          {
            ...(it.payload ?? {}),
            _syncedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (it.op === "delete") {
        await deleteDoc(ref);
      }

      await removeOutboxItem(it.id);
      ok++;
    } catch (e) {
      console.log("❌ sync error:", it, e);
      fail++;
    }
  }

  return { total: items.length, ok, fail };
}
