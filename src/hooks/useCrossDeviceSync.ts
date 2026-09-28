"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { User } from "@/types";

export function useCrossDeviceSync(onNewPendingUsers?: (newUsers: User[]) => void) {
  const syncWithDatabase = useAppStore((state) => state.syncWithDatabase);
  const _hasHydrated = useAppStore((state) => state._hasHydrated);
  const callbackRef = useRef(onNewPendingUsers);

  useEffect(() => {
    callbackRef.current = onNewPendingUsers;
  }, [onNewPendingUsers]);

  useEffect(() => {
    if (!_hasHydrated) return;

    let isSyncing = false;
    const runSync = async () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        const result = await syncWithDatabase();
        if (result.newPendingUsers && result.newPendingUsers.length > 0) {
          if (callbackRef.current) {
            callbackRef.current(result.newPendingUsers);
          }
        }
      } catch (e) {
        console.error("Sync polling error", e);
      } finally {
        isSyncing = false;
      }
    };

    // Initial sync on mount
    runSync();

    // Poll every 2500ms
    const interval = setInterval(runSync, 2500);

    // Sync on tab visibility change (e.g. user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runSync();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [_hasHydrated, syncWithDatabase]);
}
