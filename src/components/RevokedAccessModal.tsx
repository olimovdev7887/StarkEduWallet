"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserX, ArrowRight, ShieldAlert } from "lucide-react";

interface RevokedAccessModalProps {
  onDismiss?: () => void;
}

export default function RevokedAccessModal({ onDismiss }: RevokedAccessModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  const handleReturnToLogin = () => {
    if (onDismiss) {
      onDismiss();
    }
    router.push("/login");
  };

  useEffect(() => {
    if (countdown <= 0) {
      handleReturnToLogin();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
        {/* Ambient subtle glow */}
        <div className="absolute w-96 h-96 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-red-100 text-center overflow-hidden"
        >
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

          {/* Icon Badge */}
          <div className="mx-auto mb-6 relative w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-2xl bg-red-50 border border-red-100"
            />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25 relative z-10">
              <UserX className="w-8 h-8" />
            </div>
            <div className="absolute -top-1 -right-1 z-20 bg-white p-1 rounded-full shadow-sm">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Your access has been revoked.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            An administrator has permanently expunged your account from this platform. Your credentials are no longer valid.
          </p>

          {/* Auto-redirect countdown notice */}
          <div className="mb-6 py-2.5 px-4 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <p className="text-xs font-semibold text-red-700">
              Redirecting to login in <span className="font-extrabold text-sm">{countdown}</span> seconds...
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleReturnToLogin}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <span>Return to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
