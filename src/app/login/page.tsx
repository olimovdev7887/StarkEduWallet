"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAppStore } from "@/store";
import { useCrossDeviceSync } from "@/hooks/useCrossDeviceSync";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, AlertCircle, Mail, Lock, User as UserIcon, CheckCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const shouldRegister = searchParams.get("register") === "true";

  const [isRegistering, setIsRegistering] = useState(shouldRegister);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [btnPosition, setBtnPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  
  const login = useAppStore((state) => state.login);
  const register = useAppStore((state) => state.register);
  const syncWithDatabase = useAppStore((state) => state.syncWithDatabase);
  const currentUser = useAppStore((state) => state.currentUser);
  const _hasHydrated = useAppStore((state) => state._hasHydrated);
  const router = useRouter();

  useCrossDeviceSync();

  useEffect(() => {
    if (_hasHydrated) {
      syncWithDatabase();
    }
  }, [_hasHydrated, syncWithDatabase]);

  const isFormValid = isRegistering
    ? fullName.trim() !== "" && email.trim() !== "" && password.length >= 4 && password === confirmPassword
    : email.trim() !== "" && password.trim() !== "";

  useEffect(() => {
    setIsRegistering(shouldRegister);
  }, [shouldRegister]);

  useEffect(() => {
    if (isFormValid) {
      setBtnPosition({ x: 0, y: 0 });
    }
  }, [isFormValid]);

  useEffect(() => {
    if (_hasHydrated && currentUser) {
      router.push("/dashboard");
    }
  }, [_hasHydrated, currentUser, router]);

  // Return button to original position when cursor moves far away from button area
  useEffect(() => {
    if (btnPosition.x === 0 && btnPosition.y === 0) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      // Calculate origin (original center of button without offset)
      const originX = rect.left + rect.width / 2 - btnPosition.x;
      const originY = rect.top + rect.height / 2 - btnPosition.y;

      const dist = Math.hypot(e.clientX - originX, e.clientY - originY);
      // Reset button when cursor is taken far away (> 200px from origin)
      if (dist > 200) {
        setBtnPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    return () => window.removeEventListener("mousemove", handleWindowMouseMove);
  }, [btnPosition, isFormValid]);

  const handleButtonEscape = () => {
    if (!isFormValid) {
      const directions = [
        { x: 180, y: -40 },
        { x: -180, y: -40 },
        { x: 190, y: 40 },
        { x: -190, y: 40 },
        { x: 200, y: 0 },
        { x: -200, y: 0 },
      ];
      // Pick a direction different from current position
      const filtered = directions.filter(d => d.x !== btnPosition.x || d.y !== btnPosition.y);
      const nextDir = filtered[Math.floor(Math.random() * filtered.length)];
      setBtnPosition(nextDir);
    }
  };

  const handleButtonReturn = () => {
    if (!isFormValid) {
      setBtnPosition({ x: 0, y: 0 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      handleButtonEscape();
      return;
    }
    setError("");
    setSuccessMessage("");

    if (isRegistering) {
      // Password validation
      if (password.length < 4) {
        setError("Password must be at least 4 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        return;
      }

      const status = await register(fullName, email, password, 'seller');
      if (status === 'pending') {
        setSuccessMessage("Registration successful! Your account is pending approval by an admin. Both admin accounts have received your request.");
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setIsRegistering(false);
      } else {
        setError("An account with this email already exists.");
      }
    } else {
      const status = await login(email, password);
      if (status === 'success') {
        router.push("/dashboard");
      } else if (status === 'pending') {
        setError("Your account is pending approval by creator@stark.edu or admin@stark.edu. Please try again later.");
      } else if (status === 'rejected') {
        setError("Your registration request was dismissed by an admin. Please contact support or register with another email.");
      } else {
        setError("Invalid email or password.");
      }
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setBtnPosition({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-stark-50/50 to-indigo-50/30 p-4 relative overflow-hidden">
      {/* Animated Ambient Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-stark-200/40 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, -30, 0],
          y: [0, 25, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/60 relative z-10"
      >
        <div className="flex justify-center mb-6 sm:mb-8">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-stark-600 p-3.5 rounded-2xl shadow-lg shadow-stark-500/30 cursor-pointer"
          >
            <BookOpen className="text-white w-7 h-7 sm:w-8 sm:h-8" />
          </motion.div>
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
                className="space-y-4"
              >
                <div>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Password {isRegistering && <span className="text-slate-400 font-normal">(min. 4 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm sm:text-base"
                placeholder="••••••••"
                required
                minLength={isRegistering ? 4 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password — only shown on registration */}
          <AnimatePresence mode="popLayout">
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-12 py-2.5 sm:py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-stark-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm sm:text-base ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-300 bg-red-50'
                        : confirmPassword && password === confirmPassword
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200'
                    }`}
                    placeholder="••••••••"
                    required={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-stark-50 text-stark-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium border border-stark-100"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-emerald-50 text-emerald-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium border border-emerald-100"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {successMessage}
            </motion.div>
          )}

          <div 
            ref={buttonRef}
            className="relative pt-2 z-50"
          >
            <motion.button
              animate={{ x: btnPosition.x, y: btnPosition.y }}
              transition={{ type: "spring", stiffness: 1200, damping: 25, mass: 0.35 }}
              onMouseEnter={handleButtonEscape}
              onMouseMove={handleButtonEscape}
              onPointerOver={handleButtonEscape}
              onMouseDown={handleButtonEscape}
              whileHover={isFormValid ? { scale: 1.02, y: -1 } : {}}
              whileTap={isFormValid ? { scale: 0.98 } : {}}
              type="submit"
              className={`w-full bg-stark-600 text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-lg shadow-stark-500/25 text-sm sm:text-base cursor-pointer select-none ${
                !isFormValid ? "opacity-90 cursor-not-allowed" : "hover:bg-stark-700 transition-colors"
              }`}
            >
              {isRegistering ? "Sign Up" : "Sign In"}
            </motion.button>
          </div>
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
