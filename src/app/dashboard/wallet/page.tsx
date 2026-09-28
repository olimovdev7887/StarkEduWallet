"use client";

import { useAppStore } from "@/store";
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, ShieldCheck, CreditCard, RefreshCw, X, Receipt } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletPage() {
  const currentUser = useAppStore(state => state.currentUser);
  const wallet = useAppStore(state => state.wallet);
  const purchaseHistory = useAppStore(state => state.purchaseHistory);
  const salesHistory = useAppStore(state => state.salesHistory);
  const books = useAppStore(state => state.books);
  const cashOut = useAppStore(state => state.cashOut);
  const clearWalletBalance = useAppStore(state => state.clearWalletBalance);
  const clearPurchaseHistory = useAppStore(state => state.clearPurchaseHistory);
  const payStudentDebt = useAppStore(state => state.payStudentDebt);
  const payBookCosts = useAppStore(state => state.payBookCosts);

  const isAdmin = currentUser?.role === 'admin';
  const isRealAdmin = currentUser?.role === 'admin' && !currentUser?.isPromotedAdmin;

  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPayingDebt, setIsPayingDebt] = useState(false);
  const [isPayBookCostsModalOpen, setIsPayBookCostsModalOpen] = useState(false);
  const [payBookCostsAmount, setPayBookCostsAmount] = useState("");

  const handleClearPurchaseHistory = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear all purchase history?")) {
      clearPurchaseHistory();
    }
  };

  const sortedPurchases = [...purchaseHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Recent income from sales (paid only)
  const paidSales = salesHistory.filter(s => s.status === 'paid');
  const totalIncome = paidSales.reduce((sum, s) => sum + s.total_price, 0);
  const totalExpenses = purchaseHistory.reduce((sum, p) => sum + p.total_cost, 0);

  const handleCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(cashOutAmount) > 0 && Number(cashOutAmount) <= wallet.balance) {
      cashOut(Number(cashOutAmount), "Cash withdrawal");
      setIsCashOutModalOpen(false);
      setCashOutAmount("");
    }
  };

  const handlePayStudentDebt = () => {
    if (!isAdmin) return;
    if (wallet.total_debt <= 0) return;
    if (wallet.balance < wallet.total_debt) {
      if (!window.confirm(`Wallet balance (${wallet.balance.toLocaleString()} UZS) is less than student debt (${wallet.total_debt.toLocaleString()} UZS). Pay partial amount?`)) return;
    } else {
      if (!window.confirm(`Pay all student debt (${wallet.total_debt.toLocaleString()} UZS) from wallet balance?`)) return;
    }
    setIsPayingDebt(true);
    payStudentDebt();
    setTimeout(() => setIsPayingDebt(false), 600);
  };

  const handlePayBookCostsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payBookCostsAmount);
    if (amount > 0 && amount <= wallet.purchase_cost) {
      payBookCosts(amount);
      setIsPayBookCostsModalOpen(false);
      setPayBookCostsAmount("");
    }
  };

  const handleRefresh = () => {
    if (window.confirm("Do you agree to clear the wallet balance to 0?")) {
      setIsRefreshing(true);
      clearWalletBalance();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-stark-600 p-3 rounded-2xl shadow-md shadow-stark-500/20">
            <WalletIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Wallet</h1>
            <p className="text-slate-500 mt-1">Shared funds & expense tracking</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            {isRealAdmin && (
              <button 
                onClick={handleRefresh}
                className="bg-white border border-slate-200 hover:border-stark-200 text-slate-500 hover:text-stark-600 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Clear Wallet Balance"
              >
                <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
              </button>
            )}
            
            <button 
              onClick={() => setIsCashOutModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <CreditCard className="w-5 h-5" /> Cash Out
            </button>
          </div>
        )}
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-emerald-100">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">Available Balance</span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {wallet.balance.toLocaleString()} <span className="text-lg sm:text-2xl font-semibold text-emerald-200">UZS</span>
            </div>
          </div>
        </div>

        {/* Student Debt Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">Student Debt</span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-600">
              {wallet.total_debt.toLocaleString()} <span className="text-base sm:text-xl font-semibold text-slate-400">UZS</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">Unpaid pending sales from students.</p>
          </div>
        </div>

        {/* Book Purchase Cost Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-stark-500" />
              <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">Book Purchase Cost</span>
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold text-stark-600">
              {wallet.purchase_cost.toLocaleString()} <span className="text-base sm:text-xl font-semibold text-slate-400">UZS</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 sm:mt-3">Total spent on purchasing books for inventory.</p>
          </div>
          {isAdmin && wallet.purchase_cost > 0 && (
            <button
              onClick={() => {
                setPayBookCostsAmount("");
                setIsPayBookCostsModalOpen(true);
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-stark-600 hover:bg-stark-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Pay from Wallet
            </button>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <span className="font-medium uppercase tracking-wider text-xs sm:text-sm">Summary</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Income</span>
              <span className="font-bold text-emerald-600">+{totalIncome.toLocaleString()} UZS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Expenses</span>
              <span className="font-bold text-stark-600">-{totalExpenses.toLocaleString()} UZS</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Net</span>
              <span className={`font-extrabold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-stark-600'}`}>
                {(totalIncome - totalExpenses).toLocaleString()} UZS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-stark-500" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Purchase History (Deductions)</h2>
          </div>
          {isRealAdmin && purchaseHistory.length > 0 && (
            <button 
              onClick={handleClearPurchaseHistory}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-stark-600 transition-all flex items-center gap-1.5"
              title="Clear Purchase History"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-sm">Date</th>
                <th className="p-4 font-semibold text-sm">Book</th>
                <th className="p-4 font-semibold text-sm">Quantity</th>
                <th className="p-4 font-semibold text-sm text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No purchases recorded.</td>
                </tr>
              ) : (
                sortedPurchases.map((purchase) => {
                  const book = books.find(b => b.id === purchase.book_id);
                  return (
                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-600 whitespace-nowrap text-sm">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(purchase.date))}
                      </td>
                      <td className="p-4 font-semibold text-slate-900 text-sm">{book?.name || 'Unknown Book'}</td>
                      <td className="p-4 text-slate-700 text-sm">{purchase.quantity}</td>
                      <td className="p-4 font-bold text-stark-600 text-right text-sm">-{purchase.total_cost.toLocaleString()} UZS</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Out Modal - Admin Only */}
      <AnimatePresence>
        {isCashOutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsCashOutModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Cash Out Funds</h2>
              
              <form onSubmit={handleCashOut} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount to Withdraw</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      max={wallet.balance}
                      min="1"
                      value={cashOutAmount} 
                      onChange={e => setCashOutAmount(e.target.value)} 
                      className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-lg font-bold" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">UZS</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 flex justify-between">
                    <span>Available:</span>
                    <span className="font-bold text-slate-900">{wallet.balance.toLocaleString()} UZS</span>
                  </p>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={Number(cashOutAmount) > wallet.balance}
                    className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    Confirm Withdrawal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Pay Book Costs Modal - Admin Only */}
      <AnimatePresence>
        {isPayBookCostsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setIsPayBookCostsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pay Book Costs</h2>
              <p className="text-slate-500 mb-6 text-sm">Clear book purchase costs using available wallet balance.</p>
              
              <form onSubmit={handlePayBookCostsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">How much money do you want to pay?</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      max={wallet.purchase_cost}
                      min="1"
                      value={payBookCostsAmount} 
                      onChange={e => setPayBookCostsAmount(e.target.value)} 
                      className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-lg font-bold" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">UZS</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 flex justify-between">
                    <span>Available Balance:</span>
                    <span className={`font-bold ${wallet.balance >= 0 ? 'text-slate-900' : 'text-stark-600'}`}>{wallet.balance.toLocaleString()} UZS</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1 flex justify-between">
                    <span>Book Costs:</span>
                    <span className="font-bold text-stark-600">{wallet.purchase_cost.toLocaleString()} UZS</span>
                  </p>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={Number(payBookCostsAmount) <= 0 || Number(payBookCostsAmount) > wallet.purchase_cost}
                    className="w-full bg-stark-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl hover:bg-stark-700 transition-colors shadow-lg cursor-pointer"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
