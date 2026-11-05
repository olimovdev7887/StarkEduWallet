"use client";

import { useAppStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Wallet, TrendingUp, AlertCircle, RefreshCw, DollarSign, Package, Search, ShoppingCart, X, CreditCard, Receipt } from "lucide-react";
import { useEffect, useState } from "react";

const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1000;
    const startValue = displayValue;
    const distance = value - startValue;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(startValue + distance * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

export default function Dashboard() {
  const currentUser = useAppStore(state => state.currentUser);
  const inventory = useAppStore(state => state.inventory);
  const books = useAppStore(state => state.books);
  const wallet = useAppStore(state => state.wallet);
  const salesHistory = useAppStore(state => state.salesHistory);
  const clearWalletBalance = useAppStore(state => state.clearWalletBalance);
  const clearTotalDebt = useAppStore(state => state.clearTotalDebt);
  const clearBookCosts = useAppStore(state => state.clearBookCosts);
  const approveSale = useAppStore(state => state.approveSale);
  const clearSalesHistory = useAppStore(state => state.clearSalesHistory);
  const payBookCosts = useAppStore(state => state.payBookCosts);

  const users = useAppStore(state => state.users);
  const approveUser = useAppStore(state => state.approveUser);
  const rejectUser = useAppStore(state => state.rejectUser);
  const sellBook = useAppStore(state => state.sellBook);
  const categories = useAppStore(state => state.categories);

  const isAdmin = currentUser?.role === 'admin';
  const isRealAdmin = currentUser?.role === 'admin' && !currentUser?.isPromotedAdmin;

  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);
  const [isRefreshingDebt, setIsRefreshingDebt] = useState(false);
  const [isRefreshingSales, setIsRefreshingSales] = useState(false);
  const [isRefreshingBookCosts, setIsRefreshingBookCosts] = useState(false);
  const [isPayBookCostsModalOpen, setIsPayBookCostsModalOpen] = useState(false);
  const [payBookCostsAmount, setPayBookCostsAmount] = useState("");

  // Bookstore Search and Filter states
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Sell Book Modal states
  const [sellModalData, setSellModalData] = useState<{ bookId: string, name: string, price: number, maxQty: number } | null>(null);
  const [sellQty, setSellQty] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');

  const handleSellBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !sellModalData) return;
    sellBook(sellModalData.bookId, Number(sellQty), customerName, paymentStatus, currentUser.id);
    setSellModalData(null);
    setSellQty("1"); setCustomerName(""); setPaymentStatus("paid");
  };

  const pendingRegistrations = users.filter(u => u.status === 'pending' || u.isApproved === false);

  const filteredBooks = inventory.map(inv => {
    const book = books.find(b => b.id === inv.book_id)!;
    return { ...inv, book };
  }).filter(item => {
    if (!item.book) return false;
    const matchesSearch = item.book.name.toLowerCase().includes(bookSearchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || categories.find(c => c.id === selectedCategoryFilter)?.bookIds.includes(item.book.id);
    return matchesSearch && matchesCategory;
  });

  const handleRefreshWallet = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear the wallet balance to 0?")) {
      setIsRefreshingWallet(true);
      clearWalletBalance();
      setTimeout(() => setIsRefreshingWallet(false), 500);
    }
  };

  const handleRefreshDebt = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear the total debt to 0?")) {
      setIsRefreshingDebt(true);
      clearTotalDebt();
      setTimeout(() => setIsRefreshingDebt(false), 500);
    }
  };

  const handleRefreshSales = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear all sales history?")) {
      setIsRefreshingSales(true);
      clearSalesHistory();
      setTimeout(() => setIsRefreshingSales(false), 500);
    }
  };

  const handleClearBookCosts = () => {
    if (!isRealAdmin) return;
    if (window.confirm("Do you agree to clear the book costs to 0? This only resets the displayed amount — it does not refund the wallet.")) {
      setIsRefreshingBookCosts(true);
      clearBookCosts();
      setTimeout(() => setIsRefreshingBookCosts(false), 500);
    }
  };
  
  const handlePayBookCostsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payBookCostsAmount);
    if (amount > 0 && amount <= wallet.balance && amount <= wallet.purchase_cost) {
      payBookCosts(amount);
      setIsPayBookCostsModalOpen(false);
      setPayBookCostsAmount("");
    }
  };

  // All data is shared between admin and seller
  const totalBooks = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalSalesVolume = salesHistory.reduce((sum, s) => sum + s.quantity, 0);
  const totalSalesRevenue = salesHistory.reduce((sum, s) => sum + s.total_price, 0);
  const pendingSales = salesHistory.filter(s => s.status === 'pending');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, <span className="font-semibold text-slate-700">{currentUser?.name}</span></p>
      </div>

      {/* Pending Registrations Admin Banner */}
      {isAdmin && pendingRegistrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 bg-gradient-to-r from-stark-50 to-white border border-stark-200 rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-stark-600 flex items-center justify-center text-white shadow-md shadow-stark-500/20 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                Pending Registration Alerts
                <span className="bg-stark-600 text-white text-xxs font-extrabold px-2 py-0.5 rounded-full">
                  {pendingRegistrations.length} Awaiting Approval
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                New user accounts registered across devices awaiting admin decision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {pendingRegistrations.slice(0, 2).map((pUser) => (
              <div
                key={pUser.id}
                className="bg-white px-3 py-2 rounded-xl border border-stark-100 flex items-center gap-2 text-xs shadow-xs"
              >
                <span className="font-bold text-slate-800">{pUser.name}</span>
                <span className="text-slate-400">({pUser.email})</span>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => approveUser(pUser.id)}
                    className="bg-stark-600 hover:bg-stark-700 text-white px-2.5 py-1 rounded-lg font-bold transition-all text-xxs cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Dismiss registration for ${pUser.name}?`)) {
                        rejectUser(pUser.id);
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-semibold transition-all text-xxs cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
            {pendingRegistrations.length > 2 && (
              <a
                href="/dashboard/users"
                className="text-xs font-bold text-stark-600 hover:underline px-2"
              >
                +{pendingRegistrations.length - 2} more
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6"
      >
        {/* Total Books */}
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-slate-500 font-medium text-sm sm:text-base">Total Books</h3>
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={totalBooks} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{books.length} unique titles</p>
        </motion.div>

        {/* Total Sales */}
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-slate-500 font-medium text-sm sm:text-base">Total Sales</h3>
              {isRealAdmin && (
                <button 
                  onClick={handleRefreshSales}
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Clear Sales History"
                >
                  <motion.div animate={{ rotate: isRefreshingSales ? 360 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </motion.div>
                </button>
              )}
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={totalSalesVolume} />
          </div>
          <p className="text-xs text-slate-400 mt-1"><AnimatedCounter value={totalSalesRevenue} suffix=" UZS" /> revenue</p>
        </motion.div>

        {/* Wallet Balance */}
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-emerald-50 rounded-full translate-x-12 sm:translate-x-16 -translate-y-12 sm:-translate-y-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
            <div className="flex items-center gap-1.5">
              <h3 className="text-slate-500 font-medium text-sm sm:text-base">Wallet</h3>
              {isRealAdmin && (
                <button onClick={handleRefreshWallet} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Clear wallet balance">
                  <motion.div animate={{ rotate: isRefreshingWallet ? 360 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </motion.div>
                </button>
              )}
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 relative z-10">
            <AnimatedCounter value={wallet.balance} suffix=" UZS" />
          </div>
        </motion.div>

        {/* Student Debt */}
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-slate-500 font-medium text-sm sm:text-base">Student Debt</h3>
              {isRealAdmin && (
                <button onClick={handleRefreshDebt} className="text-slate-400 hover:text-amber-600 transition-colors" title="Clear student debt">
                  <motion.div animate={{ rotate: isRefreshingDebt ? 360 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </motion.div>
                </button>
              )}
            </div>
            <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            <AnimatedCounter value={wallet.total_debt} suffix=" UZS" />
          </div>
        </motion.div>

        {/* Purchase Cost */}
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-slate-500 font-medium text-sm sm:text-base">Book Costs</h3>
                {isRealAdmin && wallet.purchase_cost > 0 && (
                  <button onClick={handleClearBookCosts} className="text-slate-400 hover:text-stark-600 transition-colors" title="Clear book costs">
                    <motion.div animate={{ rotate: isRefreshingBookCosts ? 360 : 0 }} transition={{ duration: 0.5, ease: "linear" }}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>
                )}
              </div>
              <div className="bg-stark-50 p-2 rounded-xl text-stark-600">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stark-600">
              <AnimatedCounter value={wallet.purchase_cost} suffix=" UZS" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Total spent on book purchases</p>
          </div>
          {isAdmin && wallet.purchase_cost > 0 && (
            <button
              onClick={() => {
                setPayBookCostsAmount("");
                setIsPayBookCostsModalOpen(true);
              }}
              className="mt-3 w-full flex items-center justify-center gap-1.5 bg-stark-600 hover:bg-stark-700 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay from Wallet
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* Bookstore Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 sm:mt-8 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Bookstore</h2>
            <p className="text-slate-500 text-sm mt-0.5">Browse books and sell them instantly</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-stark-500 focus:border-transparent outline-none w-full sm:w-48 transition-all text-xs"
              />
            </div>
            
            {/* Category Select Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === "all"
                    ? "bg-stark-600 text-white shadow-md shadow-stark-500/10"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategoryFilter === cat.id
                      ? "bg-stark-600 text-white shadow-md shadow-stark-500/10"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No books available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((item) => {
              const bookCategory = categories.find(c => c.bookIds.includes(item.book.id));
              const stock = item.quantity;
              
              return (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -3 }}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    stock === 0 ? 'bg-slate-50 border-slate-200' :
                    stock <= 5 ? 'bg-amber-50/20 border-amber-200' : 'bg-white border-slate-100 hover:shadow-md hover:border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">{item.book.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        stock === 0 ? 'bg-stark-100 text-stark-700' :
                        stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {stock === 0 ? 'Out' : `${stock} left`}
                      </span>
                    </div>
                    
                    {bookCategory && (
                      <span className="inline-block text-xxs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-3">
                        {bookCategory.name}
                      </span>
                    )}

                    <div className="text-slate-950 font-extrabold text-sm sm:text-base mb-4">
                      {item.book.sale_price.toLocaleString()} UZS
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: stock === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: stock === 0 ? 1 : 0.98 }}
                    type="button"
                    onClick={() => setSellModalData({
                      bookId: item.book.id,
                      name: item.book.name,
                      price: item.book.sale_price,
                      maxQty: stock
                    })}
                    disabled={stock === 0}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Sell Book
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Bottom Grid: Recent Sales + Pending Debts */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Sales */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Sales</h2>
            {isRealAdmin && salesHistory.length > 0 && (
              <button 
                onClick={handleRefreshSales}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-emerald-600 transition-all flex items-center gap-1"
                title="Clear Sales History"
              >
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          {salesHistory.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No sales recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...salesHistory].reverse().slice(0, 5).map(sale => {
                const book = books.find(b => b.id === sale.book_id);
                return (
                  <div key={sale.id} className="flex justify-between items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{sale.customer_name}</p>
                      <p className="text-xs sm:text-sm text-slate-500">{book?.name || 'Unknown'} × {sale.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-slate-900 text-sm sm:text-base">{sale.total_price.toLocaleString()} UZS</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        sale.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sale.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pending Debts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100"
        >
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 sm:mb-6">Pending Debts</h2>
          {pendingSales.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No pending debts. All clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSales.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex justify-between items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-bold text-amber-900 text-sm sm:text-base truncate">{sale.customer_name}</p>
                    <p className="text-xs sm:text-sm text-amber-700">{sale.total_price.toLocaleString()} UZS</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to approve the sale for ${sale.customer_name} of ${sale.total_price.toLocaleString()} UZS?`)) {
                          approveSale(sale.id);
                        }
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex-shrink-0"
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sell Book Modal */}
      <AnimatePresence>
        {sellModalData && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-md shadow-2xl relative border-t-2 sm:border-2 border-stark-100 max-h-[90vh] overflow-y-auto"
            >
              <button 
                type="button"
                onClick={() => setSellModalData(null)}
                className="absolute top-5 right-5 sm:top-6 sm:right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Sell Book</h2>
              <p className="text-stark-600 font-bold mb-5 sm:mb-6 text-sm sm:text-base">{sellModalData.name}</p>
              
              <form onSubmit={handleSellBook} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
                  <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm" placeholder="Customer name" />
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Qty</label>
                    <input type="number" required min="1" max={sellModalData.maxQty} value={sellQty} onChange={e => setSellQty(e.target.value)} className="w-full px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-sm" />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Price</label>
                    <div className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm">
                      {(sellModalData.price * Number(sellQty)).toLocaleString()} UZS
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`py-2.5 sm:py-3 rounded-xl font-bold border-2 transition-all text-sm cursor-pointer ${
                        paymentStatus === 'paid' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      💵 Cash / Paid
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentStatus('pending')}
                      className={`py-2.5 sm:py-3 rounded-xl font-bold border-2 transition-all text-sm cursor-pointer ${
                        paymentStatus === 'pending' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      📋 Debt
                    </button>
                  </div>
                </div>

                <div className="pt-2 sm:pt-4">
                  <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 sm:py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg text-sm sm:text-base cursor-pointer">
                    Confirm Sale
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
                      max={Math.min(wallet.balance, wallet.purchase_cost)}
                      min="1"
                      value={payBookCostsAmount} 
                      onChange={e => setPayBookCostsAmount(e.target.value)} 
                      className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none text-lg font-bold" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">UZS</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2 flex justify-between">
                    <span>Available Balance:</span>
                    <span className="font-bold text-slate-900">{wallet.balance.toLocaleString()} UZS</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1 flex justify-between">
                    <span>Book Costs:</span>
                    <span className="font-bold text-stark-600">{wallet.purchase_cost.toLocaleString()} UZS</span>
                  </p>
                </div>
                
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={Number(payBookCostsAmount) <= 0 || Number(payBookCostsAmount) > wallet.balance || Number(payBookCostsAmount) > wallet.purchase_cost}
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
