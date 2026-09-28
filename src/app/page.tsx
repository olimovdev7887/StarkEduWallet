"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Wallet, Users, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="w-full px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-stark-600 p-2 rounded-lg shadow-md shadow-stark-500/20">
            <BookOpen className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-stark-900 tracking-tight">Stark Edu</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-stark-600 font-medium hover:text-stark-800 transition-colors text-sm sm:text-base">
            Sign In
          </Link>
          <Link href="/login?register=true" className="bg-stark-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium hover:bg-stark-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-stark-50 blur-3xl -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stark-100 blur-3xl -z-10" />

        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 sm:mb-8">
              Smart Finance & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-stark-500 to-stark-800">
                Inventory Management
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4"
          >
            Empower your educational center with streamlined book sales, robust debt tracking, and shared wallet management.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-4"
          >
            <Link
              href="/login"
              className="group flex items-center justify-center gap-2 bg-stark-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:bg-stark-700 transition-all shadow-xl hover:shadow-stark-500/30 w-full sm:w-auto"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login?register=true"
              className="flex items-center justify-center gap-2 bg-white text-stark-600 border-2 border-stark-100 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:border-stark-200 hover:bg-stark-50 transition-all w-full sm:w-auto"
            >
              Create Account
            </Link>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-16 sm:mt-24 max-w-5xl mx-auto w-full pb-8 sm:pb-12 px-4"
        >
          {[
            { icon: BookOpen, title: "Inventory Control", desc: "Track books, purchase prices, and set sale margins with ease.", color: "bg-blue-50 text-blue-600" },
            { icon: Wallet, title: "Shared Wallet", desc: "Real-time tracking of funds, costs, and cash collection.", color: "bg-emerald-50 text-emerald-600" },
            { icon: Users, title: "Role Based Access", desc: "Separate views for admins and sellers with shared data.", color: "bg-indigo-50 text-indigo-600" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className={`${feature.color} w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} Stark Edu Wallet. All rights reserved.
      </footer>
    </div>
  );
}
