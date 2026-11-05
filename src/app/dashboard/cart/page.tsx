"use client";

import { useAppStore } from "@/store";
import { CartEntry } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  Receipt,
  Trash2,
} from "lucide-react";
import { useState } from "react";

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EntryCard({ entry, books }: { entry: CartEntry; books: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  const totalRevenue = entry.salesHistory
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.total_price, 0);
  const totalDebt = entry.salesHistory
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.total_price, 0);
  const totalPurchases = entry.purchaseHistory.reduce((sum, p) => sum + p.total_cost, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-xl">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm sm:text-base">{formatDate(entry.date)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {entry.salesHistory.length} sale{entry.salesHistory.length !== 1 ? "s" : ""} ·{" "}
              {entry.purchaseHistory.length} purchase{entry.purchaseHistory.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-400">Revenue</p>
            <p className="font-bold text-emerald-600 text-sm">{totalRevenue.toLocaleString()} UZS</p>
          </div>
          {totalDebt > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Debt</p>
              <p className="font-bold text-amber-600 text-sm">{totalDebt.toLocaleString()} UZS</p>
            </div>
          )}
          {totalPurchases > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Book Cost</p>
              <p className="font-bold text-stark-600 text-sm">{totalPurchases.toLocaleString()} UZS</p>
            </div>
          )}
          <div className="text-slate-400">
            {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 space-y-5 pt-4">
              {/* Wallet Snapshot */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Balance</p>
                  <p className="font-extrabold text-emerald-700 text-sm">
                    {entry.walletSnapshot.balance.toLocaleString()} UZS
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">Student Debt</p>
                  <p className="font-extrabold text-amber-700 text-sm">
                    {entry.walletSnapshot.total_debt.toLocaleString()} UZS
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Book Cost</p>
                  <p className="font-extrabold text-indigo-700 text-sm">
                    {entry.walletSnapshot.purchase_cost.toLocaleString()} UZS
                  </p>
                </div>
              </div>

              {/* Sales */}
              {entry.salesHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Sales
                  </h4>
                  <div className="space-y-2">
                    {entry.salesHistory.map((s) => {
                      const book = books.find((b) => b.id === s.book_id);
                      return (
                        <div
                          key={s.id}
                          className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{s.customer_name}</p>
                            <p className="text-xs text-slate-500">{book?.name || "Unknown"} × {s.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{s.total_price.toLocaleString()} UZS</p>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : s.status === "cash_out"
                                    ? "bg-slate-200 text-slate-600"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                            >
                              {s.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchases */}
              {entry.purchaseHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Book Purchases
                  </h4>
                  <div className="space-y-2">
                    {entry.purchaseHistory.map((p) => {
                      const book = books.find((b) => b.id === p.book_id);
                      return (
                        <div
                          key={p.id}
                          className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{book?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">Qty: {p.quantity}</p>
                          </div>
                          <p className="font-bold text-slate-900">{p.total_cost.toLocaleString()} UZS</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Debts */}
              {entry.debts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Debts
                  </h4>
                  <div className="space-y-2">
                    {entry.debts.map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm"
                      >
                        <p className="text-amber-800 font-medium">{d.description}</p>
                        <div className="text-right">
                          <p className="font-bold text-amber-900">{d.amount.toLocaleString()} UZS</p>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "cleared"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                              }`}
                          >
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CartPage() {
  const cart = useAppStore((state) => state.cart);
  const books = useAppStore((state) => state.books);
  const currentUser = useAppStore((state) => state.currentUser);
  const clearCart = useAppStore((state) => state.clearCart);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const isRealAdmin = currentUser?.role === "admin" && !currentUser?.isPromotedAdmin;
  const entries = cart?.entries || [];

  const handleClearCart = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Are you sure you want to clear all cart archive records?")) {
      clearCart();
    }
  };

  // Extract unique YYYY-MM months from entries
  const availableMonths = Array.from(
    new Set(
      entries
        .map((e) => e.date?.slice(0, 7))
        .filter(Boolean)
    )
  ).sort().reverse();

  const filteredEntries = selectedMonth === "all"
    ? entries
    : entries.filter((e) => e.date?.startsWith(selectedMonth));

  const totalRevenue = filteredEntries.flatMap((e) => e.salesHistory).filter((s) => s.status === "paid").reduce((sum, s) => sum + s.total_price, 0);
  const totalDebt = filteredEntries.flatMap((e) => e.salesHistory).filter((s) => s.status === "pending").reduce((sum, s) => sum + s.total_price, 0);
  const totalPurchases = filteredEntries.flatMap((e) => e.purchaseHistory).reduce((sum, p) => sum + p.total_cost, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-md shadow-indigo-500/20">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cart Archive</h1>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">
                1 Year
              </span>
            </div>
          </div>
          <p className="text-slate-500 mt-1 sm:ml-12">
            Archived daily records kept for up to <span className="font-semibold text-slate-700">1 year</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Filter */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Filter Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="all">All Months ({availableMonths.length})</option>
                {availableMonths.map((m) => {
                  const label = new Date(m + "-01").toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Clear Cart Button */}
          {isRealAdmin && entries.length > 0 && (
            <button
              onClick={handleClearCart}
              className="bg-white border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 px-4 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Clear Cart Archive"
            >
              <Trash2 className="w-4 h-4" /> Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* Cart Summary */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-50 p-1.5 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {selectedMonth === "all" ? "Total 1-Year Revenue" : "Month Revenue"}
              </p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-600">{totalRevenue.toLocaleString()} UZS</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-amber-50 p-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {selectedMonth === "all" ? "Total 1-Year Debts" : "Month Debts"}
              </p>
            </div>
            <p className="text-2xl font-extrabold text-amber-600">{totalDebt.toLocaleString()} UZS</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-indigo-50 p-1.5 rounded-lg">
                <Receipt className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {selectedMonth === "all" ? "Total 1-Year Book Costs" : "Month Book Costs"}
              </p>
            </div>
            <p className="text-2xl font-extrabold text-indigo-600">{totalPurchases.toLocaleString()} UZS</p>
          </div>
        </motion.div>
      )}

      {/* Daily Entries */}
      {filteredEntries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200"
        >
          <div className="bg-indigo-50 p-5 rounded-2xl mb-4">
            <ShoppingBag className="w-12 h-12 text-indigo-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1">Cart is empty</h2>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Daily records will appear here after midnight when each day&apos;s data is archived. Records are saved for 1 year.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-700">
              {filteredEntries.length} day{filteredEntries.length !== 1 ? "s" : ""} archived
              {selectedMonth !== "all" && ` in ${new Date(selectedMonth + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`}
            </h2>
          </div>
          {[...filteredEntries].reverse().map((entry, idx) => (
            <EntryCard key={entry.date + idx} entry={entry} books={books} />
          ))}
        </div>
      )}
    </div>
  );
}
