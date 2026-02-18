import React from "react";
import { fetchOutboxCount, syncNowService, SyncResult } from "../services/home/home.service";

type HomeVMState = {
  loading: boolean;
  error: string | null;
  outboxCount: number;
  lastSync: SyncResult | null;
};

export function useHomeVM() {
  const [state, setState] = React.useState<HomeVMState>({
    loading: false,
    error: null,
    outboxCount: 0,
    lastSync: null,
  });

  const loadOutbox = React.useCallback(async () => {
    try {
      setState((s) => ({ ...s, error: null }));
      const { count } = await fetchOutboxCount();
      setState((s) => ({ ...s, outboxCount: count }));
    } catch (e: any) {
      setState((s) => ({ ...s, error: e?.message ?? "No se pudo leer el outbox" }));
    }
  }, []);

  React.useEffect(() => {
    loadOutbox();
  }, [loadOutbox]);

  const doSync = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await syncNowService();
      setState((s) => ({ ...s, loading: false, lastSync: res }));
      await loadOutbox();
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message ?? "No se pudo sincronizar" }));
    }
  }, [loadOutbox]);

  return { ...state, doSync, refreshOutbox: loadOutbox };
}
