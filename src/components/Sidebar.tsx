"use client";

import { useAppStore } from "@/store";
import { BookOpen, LayoutDashboard, LogOut, Package, History, Wallet, Menu, X, Users, ChevronRight, FolderOpen, Archive } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Sidebar() {
  const currentUser = useAppStore(state => state.currentUser);
  const users = useAppStore(state => state.users);
  const logout = useAppStore(state => state.logout);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingSellersCount = currentUser?.role === 'admin'
    ? users.filter(u => u.status === 'pending' || u.isApproved === false).length
    : 0;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "seller"] },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["admin", "seller"] },
    { name: "Categories", href: "/dashboard/categories", icon: FolderOpen, roles: ["admin", "seller"] },
    { name: "Sales History", href: "/dashboard/sales", icon: History, roles: ["admin", "seller"] },
    { name: "Cart (1 Year)", href: "/dashboard/cart", icon: Archive, roles: ["admin", "seller"] },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet, roles: ["admin", "seller"] },
    { name: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
  ];

  const visibleItems = menuItems.filter(item => currentUser && item.roles.includes(currentUser.role));

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="bg-stark-600 p-2 rounded-xl shadow-md shadow-stark-500/20"
          >
            <BookOpen className="text-white w-6 h-6" />
          </motion.div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Stark Edu</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.name === "Users" && pendingSellersCount > 0;
          return (
            <Link key={item.name} href={item.href} className="block" onClick={() => setMobileOpen(false)}>
              <motion.div 
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "text-stark-600 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-stark-50 rounded-xl border border-stark-100"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-200 ${isActive ? "text-stark-600 scale-110" : ""}`} />
                <span className="relative z-10">{item.name}</span>
                {showBadge && (
                  <span className="ml-auto relative z-10 bg-stark-600 text-white font-extrabold text-xs px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-stark-500/30">
                    {pendingSellersCount}
                  </span>
                )}
                {isActive && !showBadge && (
                  <ChevronRight className="w-4 h-4 ml-auto relative z-10 text-stark-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <p className="text-center text-xs text-slate-400 mb-3 font-medium tracking-wide">
          Created by{" "}
          <span className="text-stark-500 font-bold">Muhammadjon</span>
        </p>
        <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100">
          <motion.div 
            whileHover={{ scale: 1.08 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-stark-500 to-stark-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-stark-500/20 relative"
          >
            {currentUser?.name.charAt(0)}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-stark-600 hover:bg-stark-50 rounded-xl transition-colors font-medium cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-stark-600 p-1.5 rounded-lg shadow-sm">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">Stark Edu</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)} 
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col"
            >
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col h-full sticky top-0">
        <NavContent />
      </div>
    </>
  );
}
