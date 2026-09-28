"use client";

import { useAppStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, ShoppingBag, Trash2, UserPlus, X, Mail, Lock, User as UserIcon, Check, GraduationCap, Loader2 } from "lucide-react";
import { Role } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const currentUser = useAppStore(state => state.currentUser);
  const users = useAppStore(state => state.users);
  const deleteUser = useAppStore(state => state.deleteUser);
  const updateUserRole = useAppStore(state => state.updateUserRole);
  const approveUser = useAppStore(state => state.approveUser);
  const rejectUser = useAppStore(state => state.rejectUser);
  const register = useAppStore(state => state.register);
  const router = useRouter();

  const isCallerMarkedAdmin = currentUser?.isPromotedAdmin && !currentUser?.isSuperAdmin;
  const isCallerSuperAdmin = currentUser?.isSuperAdmin === true;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("seller");
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingUsers = users.filter(u => u.status === 'pending' || u.isApproved === false);

  const handleAccept = async (userId: string) => {
    if (processingId) return;
    setProcessingId(userId);
    try {
      await approveUser(userId);
    } catch (e) {
      console.error("Accept error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (userId: string, name?: string) => {
    if (processingId) return;
    if (window.confirm(`Dismiss registration for ${name || "user"}?`)) {
      setProcessingId(userId);
      try {
        await rejectUser(userId);
      } catch (e) {
        console.error("Dismiss error:", e);
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Only admins can access this page
  if (currentUser?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const roleToCreate = isCallerMarkedAdmin ? "seller" : newRole;
    const status = await register(newName, newEmail, newPassword, roleToCreate);
    if (status !== 'exists') {
      setIsAddModalOpen(false);
      setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("seller");
      useAppStore.getState().loginById(currentUser!.id);
    } else {
      setError("An account with this email already exists.");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-md shadow-indigo-500/20">
            <Users className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 mt-1">Manage team accounts and roles</p>
          </div>
        </div>

        {(!isCallerMarkedAdmin) ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-stark-600 hover:bg-stark-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 w-fit"
          >
            <UserPlus className="w-5 h-5" /> Add User
          </button>
        ) : (
          <button
            disabled
            className="bg-slate-100 text-slate-400 border border-slate-200 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed w-fit"
            title="Marked admins cannot add new users"
          >
            <UserPlus className="w-5 h-5 opacity-50" /> Add User
          </button>
        )}
      </div>

      {/* Pending Registrations Section */}
      {pendingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-stark-50 to-amber-50/50 border border-stark-200 rounded-3xl shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-stark-500 animate-ping" />
            <h2 className="text-lg font-bold text-slate-900">
              Pending Registrations ({pendingUsers.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((pUser) => {
              const isBusy = processingId === pUser.id;
              return (
                <div
                  key={pUser.id}
                  className="bg-white p-4 rounded-2xl border border-stark-100 shadow-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{pUser.name}</p>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {pUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{pUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(pUser.id)}
                      disabled={isBusy}
                      className="bg-stark-600 hover:bg-stark-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Accept
                    </button>
                    <button
                      onClick={() => handleDismiss(pUser.id, pUser.name)}
                      disabled={isBusy}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {users.map((user) => {
          const isTargetSuperAdmin = user.isSuperAdmin === true;
          const isPending = user.isApproved === false;

          const canDelete = !isCallerMarkedAdmin && !isTargetSuperAdmin;
          const canChangeRole = !isCallerMarkedAdmin && !isTargetSuperAdmin;

          return (
            <motion.div
              key={user.id}
              variants={item}
              className={`bg-white p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                isPending
                  ? "border-amber-200 bg-amber-50/10 ring-1 ring-amber-100"
                  : user.id === currentUser?.id
                  ? "border-stark-200 ring-1 ring-stark-100"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                    user.role === "admin" 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white" 
                      : "bg-gradient-to-br from-stark-500 to-stark-700 text-white"
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                {user.id === currentUser?.id && (
                  <span className="text-xs font-bold bg-stark-50 text-stark-600 px-2 py-1 rounded-full">You</span>
                )}
                {isPending && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse">Pending</span>
                )}
                {user.isSuperAdmin && user.id !== currentUser?.id && (
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-500 px-2 py-1 rounded-full">Protected</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {user.role === "admin" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold animate-fade-in">
                      <Shield className="w-3.5 h-3.5" /> Admin {user.isPromotedAdmin && <span className="font-normal opacity-75">(Promoted)</span>}
                    </div>
                  )}
                </div>

                {user.id !== currentUser?.id && (
                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleAccept(user.id)}
                          disabled={processingId === user.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-stark-600 text-white hover:bg-stark-700 transition-all shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={() => handleDismiss(user.id, user.name)}
                          disabled={processingId === user.id}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Dismiss
                        </button>
                      </>
                    ) : (
                      <>
                        {canChangeRole ? (
                          <button
                            onClick={() => updateUserRole(user.id, user.role === "admin" ? "seller" : "admin")}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            {user.role === "admin" ? "Make Seller" : "Make Admin"}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                            title="Marked admins cannot change user roles"
                          >
                            {user.role === "admin" ? "Make Seller" : "Make Admin"}
                          </button>
                        )}
                        {canDelete ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete user ${user.name}? This cannot be undone.`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-stark-600 hover:bg-stark-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                            title="Marked admins cannot delete users"
                          >
                            <Trash2 className="w-4 h-4 opacity-50" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => { setIsAddModalOpen(false); setError(""); }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New User</h2>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none" placeholder="user@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-stark-500 outline-none" placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRole("seller")}
                      className={`py-2.5 rounded-xl font-bold border-2 transition-all cursor-pointer text-xs ${
                        newRole === "seller" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      Seller
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole("teacher")}
                      className={`py-2.5 rounded-xl font-bold border-2 transition-all cursor-pointer text-xs ${
                        newRole === "teacher" ? "border-stark-500 bg-stark-50 text-stark-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      Teacher
                    </button>
                    <button
                      type="button"
                      disabled={isCallerMarkedAdmin}
                      onClick={() => setNewRole("admin")}
                      className={`py-2.5 rounded-xl font-bold border-2 transition-all cursor-pointer text-xs ${
                        isCallerMarkedAdmin
                          ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                          : newRole === "admin"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                      title={isCallerMarkedAdmin ? "Marked admins cannot create admin accounts" : ""}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stark-50 text-stark-600 p-3 rounded-xl text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="pt-4">
                  <button type="submit" className="w-full bg-stark-600 text-white font-bold py-3.5 rounded-xl hover:bg-stark-700 transition-colors shadow-lg shadow-stark-500/25">
                    Create Account
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
