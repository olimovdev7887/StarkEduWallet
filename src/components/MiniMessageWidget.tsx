"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Check,
  Trash2,
  BellRing,
  Mail,
  Clock,
  Inbox,
  Sparkles,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { AppMessage } from "@/types";

export default function MiniMessageWidget() {
  const currentUser = useAppStore((state) => state.currentUser);
  const messages = useAppStore((state) => state.messages) || [];
  const approveUser = useAppStore((state) => state.approveUser);
  const rejectUser = useAppStore((state) => state.rejectUser);
  const markMessageRead = useAppStore((state) => state.markMessageRead);
  const deleteMessage = useAppStore((state) => state.deleteMessage);
  const clearAllMessages = useAppStore((state) => state.clearAllMessages);
  const fetchNotifications = useAppStore((state) => state.fetchNotifications);

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "registration">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  // When admin opens the center, fetch fresh notifications from the database
  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchNotifications();
    }
  }, [isOpen, isAdmin, fetchNotifications]);

  if (!isAdmin) return null;

  // Filter messages targeted at this admin or both superadmins
  const relevantMessages = messages.filter((m) => {
    if (!m.targetAdminIds && !m.targetEmails) return true;
    if (m.targetAdminIds && currentUser?.id && m.targetAdminIds.includes(currentUser.id)) {
      return true;
    }
    if (
      m.targetEmails &&
      (m.targetEmails.includes("admin@stark.edu") ||
        m.targetEmails.includes("creator@stark.edu") ||
        (currentUser?.email && m.targetEmails.includes(currentUser.email)))
    ) {
      return true;
    }
    return isAdmin;
  });

  const unreadCount = relevantMessages.filter((m) => !m.read && m.status !== "handled").length;

  const filteredMessages = relevantMessages.filter((m) => {
    if (activeCategory === "registration") return m.type === "registration";
    return true;
  });

  const handleAccept = async (msg: AppMessage) => {
    if (!msg.userId || processingId) return;
    setProcessingId(msg.id);
    try {
      await approveUser(msg.userId, msg.id);
    } catch (e) {
      console.error("Accept error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (msg: AppMessage) => {
    if (!msg.userId || processingId) return;
    setProcessingId(msg.id);
    try {
      await rejectUser(msg.userId, msg.id);
    } catch (e) {
      console.error("Dismiss error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Mini Messages Category Overlay Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto mb-4 w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[550px]"
          >
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-stark-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 z-10">
                <div className="w-9 h-9 rounded-xl bg-stark-600 flex items-center justify-center text-white shadow-md shadow-stark-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Messages Center
                    {unreadCount > 0 && (
                      <span className="bg-stark-500 text-white text-xxs font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount} NEW
                      </span>
                    )}
                  </h3>
                  <p className="text-xxs text-slate-400">
                    Live alerts for both admin accounts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 z-10">
                {relevantMessages.length > 0 && (
                  <button
                    onClick={clearAllMessages}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Clear All Messages"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/60"
                }`}
              >
                All Messages ({relevantMessages.length})
              </button>
              <button
                onClick={() => setActiveCategory("registration")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === "registration"
                    ? "bg-stark-600 text-white shadow-sm shadow-stark-500/20"
                    : "text-slate-500 hover:bg-slate-200/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Registrations (
                {relevantMessages.filter((m) => m.type === "registration").length})
              </button>
            </div>

            {/* Messages Content List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No Messages Yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    When someone registers an account on any device, real-time alerts appear here for both admins.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isPending = msg.type === "registration" && msg.status !== "handled";
                  const isHandled = msg.status === "handled";
                  const isBusy = processingId === msg.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending
                          ? "bg-white border-stark-200 shadow-md ring-1 ring-stark-100"
                          : isHandled
                          ? "bg-slate-50/80 border-slate-200"
                          : !msg.read
                          ? "bg-stark-50/40 border-stark-100 shadow-sm"
                          : "bg-slate-50/60 border-slate-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg font-bold ${
                              isPending
                                ? "bg-stark-100 text-stark-700"
                                : isHandled
                                ? msg.actionTaken === "accepted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <BellRing className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {msg.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(msg.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {isPending && !msg.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-stark-500 animate-ping" />
                        )}
                      </div>

                      {/* Message content: hide generic blob for registration, show structured info instead */}
                      {msg.type !== "registration" && (
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                          {msg.content}
                        </p>
                      )}

                      {msg.type === "registration" && msg.senderEmail && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-800 break-all">{msg.senderEmail}</span>
                          </div>
                          {msg.senderName && (
                            <div className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-stark-400 inline-block" />
                              </span>
                              <span className="text-xs font-semibold text-slate-700">{msg.senderName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.type !== "registration" && msg.senderEmail && (
                        <div className="flex items-center gap-1.5 text-xxs font-medium text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-100 mb-3">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{msg.senderName}</span> (
                          {msg.senderEmail})
                        </div>
                      )}

                      {/* Status & Actions Section */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                        {/* Handled Status Badge */}
                        {isHandled && (
                          <div className="flex items-center justify-between text-xs py-1">
                            {msg.actionTaken === "accepted" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> Approved
                                {msg.handledBy ? ` by ${msg.handledBy}` : ""}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                                <ShieldAlert className="w-3.5 h-3.5" /> Rejected
                                {msg.handledBy ? ` by ${msg.handledBy}` : ""}
                              </span>
                            )}
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Pending Registration Actions: Accept / Dismiss */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAccept(msg)}
                              disabled={isBusy}
                              className="flex-1 bg-stark-600 hover:bg-stark-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-stark-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDismiss(msg)}
                              disabled={isBusy}
                              className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              Reject
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Regular system messages mark read */}
                        {msg.type !== "registration" && !isHandled && (
                          <div className="flex items-center justify-between">
                            {!msg.read && (
                              <button
                                onClick={() => markMessageRead(msg.id)}
                                className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="ml-auto text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                              title="Delete Message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Corner Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-2xl border-2 border-slate-700 flex items-center justify-center transition-all cursor-pointer group"
      >
        <MessageSquare className="w-6 h-6 text-stark-400 group-hover:text-white transition-colors" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-stark-500 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce shadow-lg shadow-stark-500/50">
            {unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
