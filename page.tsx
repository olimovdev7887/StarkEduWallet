"use client";

import { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle, Mail, Lock, User as UserIcon } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const shouldRegister = searchParams.get("register") === "true";

  const [isRegistering, setIsRegistering] = useState(shouldRegister);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const login = useAppStore((state) => state.login);
  const register = useAppStore((state) => state.register);
  const router = useRouter();

  useEffect(() => {
    setIsRegistering(shouldRegister);
  }, [shouldRegister]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegistering) {
      const success = register(fullName, email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("An account with this email already exists.");
      }
    } else {
      const success = login(email, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stark-50 p-4">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden"
      >
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-stark-600 p-3 rounded-2xl shadow-lg shadow-stark-500/30">
            <BookOpen className="text-white w-7 h-7 sm:w-8 sm:h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900 mb-2">
          {isRegistering ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">
          {isRegistering ? "Sign up to start using Stark Edu Wallet" : "Sign in to your Stark Edu Wallet"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <AnimatePresence mode="popLayout">
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm sm:text-base"
                    placeholder="John Doe"
                    required={isRegistering}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm sm:text-base"
                placeholder="email@gmail.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm sm:text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-stark-50 text-stark-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-stark-600 text-white font-bold py-3 sm:py-3.5 rounded-xl hover:bg-stark-700 transition-colors shadow-lg shadow-stark-500/25 active:scale-[0.98] mt-2 text-sm sm:text-base"
          >
            {isRegistering ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center text-sm text-slate-500">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={toggleMode}
            className="text-stark-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            {isRegistering ? "Sign In" : "Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stark-50">
        <div className="animate-pulse text-stark-600 font-bold">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
