"use client";

import { useAppStore } from "@/store";
import { CartEntry } from "@/types";
import {
  History, CheckCircle, Clock, Search, RefreshCw,
  Archive, ChevronDown, ChevronUp, CalendarDays,
  TrendingUp, AlertCircle, Trash2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Cart Entry row (collapsible) ──────────────────────────────────────
function CartEntryRow({ entry, books }: { entry: CartEntry; books: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  const revenue = entry.salesHistory
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.total_price, 0);
  const debt = entry.salesHistory
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.total_price, 0);

  const dateLabel = entry.date
    ? new Date(entry.date).toLocaleDateString("en-GB", {
        weekday: "short", day: "2-digit", month: "short",
      })
    : "—";

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="font-semibold text-slate-800 text-sm">{dateLabel}</span>
          <span className="text-xs text-slate-400">{entry.salesHistory.length} sale{entry.salesHistory.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-3">
          {revenue > 0 && (
            <span className="text-xs font-bold text-emerald-600">{revenue.toLocaleString()} UZS</span>
          )}
          {debt > 0 && (
            <span className="text-xs font-bold text-amber-600">{debt.toLocaleString()} UZS debt</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden bg-white"
          >
            <div className="px-4 py-3 space-y-2">
              {/* Wallet snapshot */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <p className="text-xxs text-emerald-600 font-medium">Balance</p>
                  <p className="font-bold text-emerald-700 text-xs">{entry.walletSnapshot.balance.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2 text-center">
                  <p className="text-xxs text-amber-600 font-medium">Debt</p>
                  <p className="font-bold text-amber-700 text-xs">{entry.walletSnapshot.total_debt.toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2 text-center">
                  <p className="text-xxs text-indigo-600 font-medium">Book Cost</p>
                  <p className="font-bold text-indigo-700 text-xs">{entry.walletSnapshot.purchase_cost.toLocaleString()}</p>
                </div>
              </div>

              {entry.salesHistory.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No sales that day.</p>
              )}
              {entry.salesHistory.map((s) => {
                const book = books.find((b) => b.id === s.book_id);
                return (
                  <div key={s.id} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{s.customer_name}</p>
                      <p className="text-xs text-slate-400">{book?.name || "Unknown"} × {s.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-slate-800">{s.total_price.toLocaleString()} UZS</p>
                      <span className={`text-xxs font-bold px-1.5 py-0.5 rounded-full ${
                        s.status === "paid" ? "bg-emerald-100 text-emerald-700"
                        : s.status === "cash_out" ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function SalesHistoryPage() {
  const salesHistory = useAppStore(state => state.salesHistory);
  const books = useAppStore(state => state.books);
  const users = useAppStore(state => state.users);
  const currentUser = useAppStore(state => state.currentUser);
  const clearSalesHistory = useAppStore(state => state.clearSalesHistory);
  const clearCart = useAppStore(state => state.clearCart);
  const cart = useAppStore(state => state.cart);

  const isRealAdmin = currentUser?.role === "admin" && !currentUser?.isPromotedAdmin;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "cash_out">("all");
  const [cartOpen, setCartOpen] = useState(false);

  const handleClearHistory = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear all sales history?")) {
      clearSalesHistory();
    }
  };

  const sortedSales = [...salesHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(sale => {
      const book = books.find(b => b.id === sale.book_id);
      const matchesSearch =
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const totalPaid = salesHistory.filter(s => s.status === "paid" || s.status === "cash_out").reduce((sum, s) => sum + s.total_price, 0);
  const totalPending = salesHistory.filter(s => s.status === "pending").reduce((sum, s) => sum + s.total_price, 0);

  const cartEntries = cart?.entries || [];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-md">
            <History className="text-white w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sales History</h1>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
                1 Month
              </span>
            </div>
            <p className="text-slate-500 mt-1">Record of sales transactions for the past 1 month</p>
          </div>
        </div>

        {isRealAdmin && salesHistory.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="bg-white border border-slate-200 hover:border-stark-200 text-slate-500 hover:text-stark-600 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 w-fit"
            title="Clear Sales History"
          >
            <RefreshCw className="w-4 h-4" /> Clear History
          </button>
        )}
      </div>

      {/* Summary Cards — with Cart accordion above Pending Amount */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 items-start">
        {/* Total Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-1">Total Sales (1 Month)</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{salesHistory.length}</p>
        </div>

        {/* Paid Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs sm:text-sm text-emerald-600 font-medium mb-1">Paid Revenue</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600">{totalPaid.toLocaleString()}</p>
        </div>

        {/* Cart accordion — top-right corner, above Pending Amount */}
        <div className="col-span-2 sm:col-span-1 space-y-3">
          {/* Cart toggle button — above Pending Amount */}
          <button
            onClick={() => setCartOpen((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-semibold text-sm transition-all cursor-pointer ${
              cartOpen
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <span>Cart (1 Year Archive)</span>
              {cartEntries.length > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  cartOpen ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                }`}>
                  {cartEntries.length}d
                </span>
              )}
            </div>
            {cartOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Pending Amount card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs sm:text-sm text-amber-600 font-medium mb-1">Pending Amount</p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600">{totalPending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Cart expanded panel */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6 bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-800 text-sm">Cart Archive (1 Year)</h2>
              </div>
              <div className="flex items-center gap-4">
                {cartEntries.length > 0 && (
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      {cartEntries.flatMap(e => e.salesHistory).filter(s => s.status === "paid").reduce((sum, s) => sum + s.total_price, 0).toLocaleString()} UZS
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      {cartEntries.flatMap(e => e.salesHistory).filter(s => s.status === "pending").reduce((sum, s) => sum + s.total_price, 0).toLocaleString()} UZS
                    </span>
                  </div>
                )}
                {isRealAdmin && cartEntries.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all cart archive records?")) {
                        clearCart();
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Clear Cart Archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {cartEntries.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">
                  No archived data yet. Records appear here after each daily reset.
                </p>
              ) : (
                [...cartEntries].reverse().map((entry, idx) => (
                  <CartEntryRow key={entry.date + idx} entry={entry} books={books} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer or book..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-stark-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "paid", "pending", "cash_out"] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? status === "paid" ? "bg-emerald-600 text-white"
                  : status === "pending" ? "bg-amber-600 text-white"
                  : status === "cash_out" ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status === "cash_out" ? "Cash Outs" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-sm">Date</th>
                <th className="p-4 font-semibold text-sm">Customer</th>
                <th className="p-4 font-semibold text-sm">Book</th>
                <th className="p-4 font-semibold text-sm">Qty</th>
                <th className="p-4 font-semibold text-sm">Total</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Seller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No sales found.</td>
                </tr>
              ) : (
                sortedSales.map((sale) => {
                  const book = books.find(b => b.id === sale.book_id);
                  const seller = users.find(u => u.id === sale.seller_id);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-600 whitespace-nowrap text-sm">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(sale.date))}
                      </td>
                      <td className="p-4 font-semibold text-slate-900 text-sm">{sale.customer_name}</td>
                      <td className="p-4 text-slate-700 text-sm">{sale.book_id === "cash_out" ? "Wallet Withdrawal" : book?.name || "Unknown"}</td>
                      <td className="p-4 text-slate-700 text-sm">{sale.quantity === 0 ? "-" : sale.quantity}</td>
                      <td className={`p-4 font-bold text-sm ${sale.total_price < 0 ? "text-blue-600" : "text-slate-900"}`}>{sale.total_price.toLocaleString()} UZS</td>
                      <td className="p-4">
                        {sale.status === "paid" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                          </div>
                        ) : sale.status === "cash_out" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            <RefreshCw className="w-3.5 h-3.5" /> Cash Out
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{seller?.name || "Unknown"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {sortedSales.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
            No sales found.
          </div>
        ) : (
          sortedSales.map((sale) => {
            const book = books.find(b => b.id === sale.book_id);
            const seller = users.find(u => u.id === sale.seller_id);
            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{sale.customer_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sale.book_id === "cash_out" ? "Wallet Withdrawal" : book?.name || "Unknown"}
                      {sale.quantity > 0 ? ` × ${sale.quantity}` : ""}
                    </p>
                  </div>
                  {sale.status === "paid" ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex-shrink-0">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </div>
                  ) : sale.status === "cash_out" ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">
                      <RefreshCw className="w-3 h-3" /> Cash Out
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">
                      <Clock className="w-3 h-3" /> Pending
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(sale.date))}
                    {seller && <span> · {seller.name}</span>}
                  </div>
                  <p className={`font-bold text-sm ${sale.total_price < 0 ? "text-blue-600" : "text-slate-900"}`}>
                    {sale.total_price.toLocaleString()} UZS
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
