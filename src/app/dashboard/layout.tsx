"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import PageTransition from "@/components/PageTransition";
import { useCrossDeviceSync } from "@/hooks/useCrossDeviceSync";
import MiniMessageWidget from "@/components/MiniMessageWidget";
import RevokedAccessModal from "@/components/RevokedAccessModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useAppStore(state => state.currentUser);
  const isAccessRevoked = useAppStore(state => state.isAccessRevoked);
  const setAccessRevoked = useAppStore(state => state.setAccessRevoked);
  const _hasHydrated = useAppStore(state => state._hasHydrated);
  const performDailyReset = useAppStore(state => state.performDailyReset);
  const router = useRouter();

  // Enable live cross-device polling (every 2.5s)
  useCrossDeviceSync();

  useEffect(() => {
    if (_hasHydrated && !currentUser && !isAccessRevoked) {
      router.push("/login");
    }
  }, [currentUser, _hasHydrated, isAccessRevoked, router]);

  // ── Daily auto-reset ────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated) return;
    performDailyReset();

    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    const timer = setTimeout(() => {
      performDailyReset();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [_hasHydrated, performDailyReset]);

  if (isAccessRevoked) {
    return (
      <RevokedAccessModal
        onDismiss={() => {
          setAccessRevoked(false);
          router.push("/login");
        }}
      />
    );
  }

  if (!_hasHydrated || !currentUser) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Spacer for mobile top bar */}
        <div className="lg:hidden h-14" />
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Bottom-Right Mini Message Widget */}
      <MiniMessageWidget />
    </div>
  );
}

