import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { User, Book, InventoryItem, Wallet, SalesHistory, PurchaseHistory, Debt, Role, Category, CartEntry, MonthlyCart, AppMessage, RegistrationStatus } from '../types';

interface AppState {
  currentUser: User | null;
  users: User[];
  books: Book[];
  inventory: InventoryItem[];
  wallet: Wallet;
  salesHistory: SalesHistory[];
  purchaseHistory: PurchaseHistory[];
  debts: Debt[];
  categories: Category[];
  // Tracks which user emails are currently logged-in (shared across devices)
  activeSessions: string[];
  // Date string (YYYY-MM-DD) of the last auto daily reset
  lastResetDate: string;
  // Monthly cart — accumulates each day's archive; clears every new month
  cart: MonthlyCart;
  // Messages & notifications system (targeted at admin@stark.edu & creator@stark.edu)
  messages: AppMessage[];

  // Message Actions
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  clearAllMessages: () => void;

  // Auth Actions
  login: (email: string, password?: string) => Promise<'success' | 'pending' | 'rejected' | 'not_found' | 'invalid'>;
  loginById: (userId: string) => void;
  register: (name: string, email: string, password?: string, role?: Role) => Promise<'approved' | 'pending' | 'exists'>;
  logout: () => void;

  // User Management (Admin)
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, newRole: Role) => void;
  approveUser: (userId: string, notificationId?: string) => Promise<void>;
  rejectUser: (userId: string, notificationId?: string) => Promise<void>;
  handleRegistrationAction: (action: 'accept' | 'dismiss', userId: string, notificationId?: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;

  // Book / Inventory Actions
  deleteBook: (bookId: string) => void;
  addBook: (book: Omit<Book, 'id' | 'created_at'>, quantity: number, adminId: string) => string;
  restockBook: (bookId: string, quantity: number, purchasePrice: number, adminId: string) => void;
  sellBook: (bookId: string, quantity: number, customerName: string, status: 'paid' | 'pending', sellerId: string) => void;

  // Category Actions
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  addBookToCategory: (categoryId: string, bookId: string) => void;
  removeBookFromCategory: (categoryId: string, bookId: string) => void;

  // Wallet Actions
  approveSale: (saleId: string) => void;
  payStudentDebt: () => void;
  payBookCosts: (amount: number) => void;
  cashOut: (amount: number, description: string) => void;
  clearWalletBalance: () => void;
  clearTotalDebt: () => void;
  clearBookCosts: () => void;
  clearSalesHistory: () => void;
  clearPurchaseHistory: () => void;
  clearCart: () => void;

  // Daily auto-reset
  performDailyReset: () => void;

  // Live Cross-Device Sync
  syncWithDatabase: () => Promise<{ newPendingUsers: User[] }>;

  // Access Revoked state (for force logout when account is expunged)
  isAccessRevoked: boolean;
  setAccessRevoked: (revoked: boolean) => void;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

let isSyncingState = false;

// ── Shared DB storage (for app data, NOT for currentUser) ──────────────────
const apiStorage: StateStorage = {
  getItem: async (name): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const response = await fetch('/api/db?key=' + name, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return data.value;
    } catch {
      return null;
    }
  },
  setItem: async (name, value): Promise<void> => {
    if (typeof window === 'undefined' || isSyncingState) return;
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: name, value })
      });
    } catch (e) {
      console.error("Failed to save state to db file", e);
    }
  },
  removeItem: async (name): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: name, value: null })
      });
    } catch (e) {
      console.error("Failed to remove state from db file", e);
    }
  },
};

// ── Super-admin seed accounts (always protected, passwords enforced from code) ──
const SUPER_ADMIN_SEEDS: User[] = [
  {
    id: 'superadmin-001',
    name: 'Admin',
    email: 'admin@stark.edu',
    password: 'javohir123',
    role: 'admin',
    isSuperAdmin: true,
    status: 'approved',
    isApproved: true,
  },
  {
    id: 'superadmin-002',
    name: 'Muhammadjon',
    email: 'creator@stark.edu',
    password: '7887',
    role: 'admin',
    isSuperAdmin: true,
    status: 'approved',
    isApproved: true,
  },
];

const MOCK_USERS: User[] = [];

const getLocalCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('stark_current_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setLocalCurrentUser = (user: User) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('stark_current_user', JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save currentUser to localStorage", e);
  }
};

const removeLocalCurrentUser = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('stark_current_user');
  } catch (e) {
    console.error("Failed to remove currentUser from localStorage", e);
  }
};

function consolidateDuplicateBooks(data: {
  books: Book[];
  inventory: InventoryItem[];
  categories: Category[];
  salesHistory: SalesHistory[];
  purchaseHistory: PurchaseHistory[];
}) {
  const nameMap = new Map<string, Book[]>();

  for (const book of data.books || []) {
    const key = book.name.trim().toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(book);
  }

  let hasDuplicates = false;
  const duplicateIdToPrimaryId = new Map<string, string>();
  const primaryBooks: Book[] = [];

  for (const [, bookGroup] of nameMap.entries()) {
    const primary = bookGroup[0];
    primaryBooks.push(primary);

    if (bookGroup.length > 1) {
      hasDuplicates = true;
      for (let i = 1; i < bookGroup.length; i++) {
        duplicateIdToPrimaryId.set(bookGroup[i].id, primary.id);
      }
    }
  }

  if (!hasDuplicates) {
    return data;
  }

  const invMap = new Map<string, InventoryItem>();
  for (const inv of data.inventory || []) {
    const targetBookId = duplicateIdToPrimaryId.get(inv.book_id) || inv.book_id;
    if (invMap.has(targetBookId)) {
      const existingInv = invMap.get(targetBookId)!;
      existingInv.quantity += inv.quantity;
      if (new Date(inv.last_updated) > new Date(existingInv.last_updated)) {
        existingInv.last_updated = inv.last_updated;
      }
    } else {
      invMap.set(targetBookId, {
        ...inv,
        book_id: targetBookId,
      });
    }
  }
  const newInventory = Array.from(invMap.values());

  const newCategories = (data.categories || []).map(cat => {
    const updatedBookIds = cat.bookIds.map(id => duplicateIdToPrimaryId.get(id) || id);
    const uniqueBookIds = Array.from(new Set(updatedBookIds));
    return { ...cat, bookIds: uniqueBookIds };
  });

  const newSalesHistory = (data.salesHistory || []).map(sale => {
    const mappedBookId = duplicateIdToPrimaryId.get(sale.book_id);
    return mappedBookId ? { ...sale, book_id: mappedBookId } : sale;
  });

  const newPurchaseHistory = (data.purchaseHistory || []).map(purchase => {
    const mappedBookId = duplicateIdToPrimaryId.get(purchase.book_id);
    return mappedBookId ? { ...purchase, book_id: mappedBookId } : purchase;
  });

  return {
    books: primaryBooks,
    inventory: newInventory,
    categories: newCategories,
    salesHistory: newSalesHistory,
    purchaseHistory: newPurchaseHistory,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: getLocalCurrentUser(),
      users: MOCK_USERS,
      books: [],
      inventory: [],
      wallet: { id: 'w1', balance: 0, total_debt: 0, purchase_cost: 0 },
      salesHistory: [],
      purchaseHistory: [],
      debts: [],
      categories: [],
      activeSessions: [],
      lastResetDate: '',
      cart: { month: '', entries: [] },
      messages: [],
      isAccessRevoked: false,
      setAccessRevoked: (revoked) => set({ isAccessRevoked: revoked }),
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      markMessageRead: (id) => {
        set((state) => ({
          messages: (state.messages || []).map((m) =>
            m.id === id ? { ...m, read: true } : m
          ),
        }));
      },

      deleteMessage: (id) => {
        set((state) => ({
          messages: (state.messages || []).filter((m) => m.id !== id),
        }));
      },

      clearAllMessages: () => {
        set({ messages: [] });
      },

      login: async (email, password) => {
        // Force fresh sync with database before evaluating credentials
        try {
          await get().syncWithDatabase();
        } catch (e) {
          console.error("Login DB pre-sync error:", e);
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (!user) return 'not_found';

        // Always require exact password match
        if (user.password !== password) return 'invalid';

        // If user status is rejected, block entry
        if (user.status === 'rejected') {
          return 'rejected';
        }

        // If user is not approved, block entry
        if (user.status === 'pending' || user.isApproved === false) {
          return 'pending';
        }

        // Register this session and set current user
        const activeSessions = get().activeSessions;
        const nextSessions = activeSessions.includes(user.email)
          ? activeSessions
          : [...activeSessions, user.email];

        setLocalCurrentUser(user);
        set({
          currentUser: user,
          activeSessions: nextSessions,
          isAccessRevoked: false,
        });
        return 'success';
      },

      loginById: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) {
          setLocalCurrentUser(user);
          set({ currentUser: user });
        }
      },

      register: async (name, email, password, role = 'seller') => {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Primary: Persist registration directly via backend API
        try {
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
            body: JSON.stringify({
              name: name.trim(),
              email: normalizedEmail,
              password,
              role,
            }),
          });

          if (res.status === 409) {
            return 'exists';
          }

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              const currentUsers = get().users.filter((u) => u.id !== data.user.id);
              const currentMessages = (get().messages || []).filter(
                (m) => m.id !== data.notification?.id
              );
              set({
                users: [...currentUsers, data.user],
                messages: data.notification
                  ? [data.notification, ...currentMessages]
                  : currentMessages,
              });
              return 'pending';
            }
          }
        } catch (e) {
          console.error("Register API call error, falling back to local pre-sync:", e);
        }

        // 2. Fallback: local sync and write if API request fails
        try {
          await get().syncWithDatabase();
        } catch (e) {
          console.error("Register DB pre-sync error:", e);
        }

        const currentUsers = get().users;
        if (currentUsers.find((u) => u.email.toLowerCase() === normalizedEmail && u.status !== 'rejected')) {
          return 'exists';
        }

        // Super-admin emails are reserved — cannot be registered by anyone
        if (SUPER_ADMIN_SEEDS.find((s) => s.email.toLowerCase() === normalizedEmail)) {
          return 'exists';
        }

        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          email: normalizedEmail,
          password,
          role,
          status: 'pending',
          isApproved: false,
        };

        const adminIds = Array.from(
          new Set([
            ...SUPER_ADMIN_SEEDS.map((s) => s.id),
            ...currentUsers.filter((u) => u.role === 'admin').map((u) => u.id),
          ])
        );

        const adminEmails = Array.from(
          new Set([
            ...SUPER_ADMIN_SEEDS.map((s) => s.email),
            ...currentUsers.filter((u) => u.role === 'admin').map((u) => u.email),
          ])
        );

        const newMsg: AppMessage = {
          id: `reg-notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: "registration",
          title: "New Account Registration",
          content: `New ${role} account registration request from ${name} (${normalizedEmail}). Action required: Accept or Dismiss.`,
          senderName: name,
          senderEmail: normalizedEmail,
          userId: newUser.id,
          date: new Date().toISOString(),
          read: false,
          status: "pending",
          targetAdminIds: adminIds,
          targetEmails: adminEmails,
        };

        const nextUsers = [...currentUsers.filter((u) => u.email !== normalizedEmail), newUser];
        const nextMessages = [newMsg, ...(get().messages || [])];

        set({
          users: nextUsers,
          messages: nextMessages,
        });

        // Force explicit server-side persistence write to database.json
        try {
          const currentState = get();
          const partializeData = {
            users: currentState.users,
            books: currentState.books,
            inventory: currentState.inventory,
            wallet: currentState.wallet,
            salesHistory: currentState.salesHistory,
            purchaseHistory: currentState.purchaseHistory,
            debts: currentState.debts,
            categories: currentState.categories,
            activeSessions: currentState.activeSessions,
            lastResetDate: currentState.lastResetDate,
            cart: currentState.cart,
            messages: currentState.messages,
          };

          await fetch('/api/db', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
            body: JSON.stringify({
              key: 'stark-edu-wallet-storage',
              value: JSON.stringify({ state: partializeData, version: 0 }),
            }),
          });
        } catch (e) {
          console.error("Failed to persist registration server-side", e);
        }

        return 'pending';
      },

      logout: () => {
        const email = get().currentUser?.email;
        removeLocalCurrentUser();
        set((state) => ({
          currentUser: null,
          activeSessions: email
            ? state.activeSessions.filter(s => s !== email)
            : state.activeSessions,
        }));
      },

      // ── User Management ────────────────────────────────
      deleteUser: async (userId: string) => {
        const caller = get().currentUser;
        const target = get().users.find((u) => u.id === userId);

        if (!target) {
          return { success: false, error: 'User not found' };
        }

        // The "Protected" account (admin@stark.edu) must NOT be deletable
        if (target.email?.toLowerCase() === 'admin@stark.edu') {
          console.warn("Protected account (admin@stark.edu) cannot be deleted.");
          return { success: false, error: 'The protected account (admin@stark.edu) cannot be deleted.' };
        }

        // Currently logged-in user ("You") must NOT be deletable
        if (caller && caller.id === userId) {
          console.warn("You cannot delete your own account.");
          return { success: false, error: 'You cannot delete your own account.' };
        }

        // Only admins can delete users
        if (caller?.role !== 'admin') {
          return { success: false, error: 'Only administrators have permission to delete users.' };
        }

        // Optimistically update the UI instantly without waiting
        const previousUsers = get().users;
        const nextUsers = previousUsers.filter((u) => u.id !== userId);
        const targetEmail = target.email?.toLowerCase();
        const nextSessions = targetEmail
          ? get().activeSessions.filter((s) => s.toLowerCase() !== targetEmail)
          : get().activeSessions;
        const nextMessages = get().messages.filter(
          (m) => m.userId !== userId && (!targetEmail || m.senderEmail?.toLowerCase() !== targetEmail)
        );

        set({
          users: nextUsers,
          activeSessions: nextSessions,
          messages: nextMessages,
        });

        try {
          // Permanently remove from server storage via API
          const res = await fetch(
            `/api/admin/users?userId=${encodeURIComponent(userId)}&callerId=${encodeURIComponent(caller?.id || '')}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache',
              },
            }
          );

          const data = await res.json().catch(() => ({}));

          if (!res.ok || !data.success) {
            // Rollback optimistic state if server failed
            set({ users: previousUsers });
            return { success: false, error: data.error || 'Server rejected user deletion.' };
          }

          // Also force write to /api/db with deletedUserIds so stale clients can never restore it
          const currentState = get();
          const partializeData = {
            users: nextUsers,
            books: currentState.books,
            inventory: currentState.inventory,
            wallet: currentState.wallet,
            salesHistory: currentState.salesHistory,
            purchaseHistory: currentState.purchaseHistory,
            debts: currentState.debts,
            categories: currentState.categories,
            activeSessions: nextSessions,
            lastResetDate: currentState.lastResetDate,
            cart: currentState.cart,
            messages: nextMessages,
            deletedUserIds: [userId],
          };

          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'stark-edu-wallet-storage',
              value: JSON.stringify({ state: partializeData, version: 0 }),
            }),
          }).catch(() => {});

          return { success: true };
        } catch (err) {
          console.error("deleteUser network error:", err);
          // Try fallback directly to /api/db
          try {
            const fallbackRes = await fetch(`/api/db?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
            if (fallbackRes.ok) {
              return { success: true };
            }
          } catch {
            // ignore
          }
          set({ users: previousUsers });
          return { success: false, error: 'Network error occurred while deleting user.' };
        }
      },

      updateUserRole: (userId, newRole) => {
        const caller = get().currentUser;
        const target = get().users.find(u => u.id === userId);

        // Cannot change the role of a super-admin account
        if (target?.isSuperAdmin) {
          console.warn("Super-admin roles cannot be changed.");
          return;
        }

        // Promoted (marked) admins cannot change roles
        if (caller?.role === 'admin' && caller?.isPromotedAdmin && !caller?.isSuperAdmin) {
          console.warn("Marked admin cannot change user roles");
          return;
        }

        set((state) => {
          const nextUsers = state.users.map(u => {
            if (u.id === userId) {
              const wasSeller = u.role === 'seller';
              return {
                ...u,
                role: newRole,
                isPromotedAdmin: newRole === 'admin' ? (wasSeller ? true : u.isPromotedAdmin) : false
              };
            }
            return u;
          });

          let nextCurrentUser = state.currentUser;
          if (state.currentUser && state.currentUser.id === userId) {
            nextCurrentUser = {
              ...state.currentUser,
              role: newRole,
              isPromotedAdmin: newRole === 'admin' ? (state.currentUser.role === 'seller' ? true : state.currentUser.isPromotedAdmin) : false
            };
            setLocalCurrentUser(nextCurrentUser);
          }

          return {
            users: nextUsers,
            currentUser: nextCurrentUser
          };
        });
      },

      handleRegistrationAction: async (action, userId, notificationId) => {
        const isAccept = action === 'accept';
        const targetStatus: RegistrationStatus = isAccept ? 'approved' : 'rejected';
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        const handlerName = currentUser?.name || (currentUser?.id === 'superadmin-002' ? 'Muhammadjon' : 'Admin');

        // 1. Optimistic local update
        set((state) => {
          const nextUsers = state.users.map((u) =>
            u.id === userId
              ? { ...u, status: targetStatus, isApproved: isAccept }
              : u
          );
          const nextMessages = (state.messages || []).map((m) => {
            const matches =
              (notificationId && m.id === notificationId) ||
              (m.type === 'registration' && m.userId === userId);
            if (matches) {
              return {
                ...m,
                status: 'handled' as const,
                actionTaken: isAccept ? ('accepted' as const) : ('dismissed' as const),
                handledBy: handlerName,
                handledAt: now,
                read: true,
              };
            }
            return m;
          });
          return { users: nextUsers, messages: nextMessages };
        });

        // 2. Persist authoritative decision to backend API
        try {
          const res = await fetch('/api/admin/registration-action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
            body: JSON.stringify({
              userId,
              action,
              notificationId,
              adminId: currentUser?.id,
              adminName: handlerName,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              set((state) => {
                const updatedUsers = state.users.map((u) =>
                  u.id === userId ? { ...u, ...data.user } : u
                );
                const updatedMessages = (state.messages || []).map((m) => {
                  const matches =
                    (notificationId && m.id === notificationId) ||
                    (m.type === 'registration' && m.userId === userId);
                  if (matches && data.notification) {
                    return { ...m, ...data.notification };
                  }
                  return m;
                });
                return { users: updatedUsers, messages: updatedMessages };
              });
            }
          }
        } catch (e) {
          console.error("Failed to perform registration action on server:", e);
        }
      },

      approveUser: async (userId, notificationId) => {
        await get().handleRegistrationAction('accept', userId, notificationId);
      },

      rejectUser: async (userId, notificationId) => {
        await get().handleRegistrationAction('dismiss', userId, notificationId);
      },

      fetchNotifications: async () => {
        try {
          const currentAdmin = get().currentUser;
          const url = currentAdmin?.id
            ? `/api/notifications?adminId=${encodeURIComponent(currentAdmin.id)}`
            : '/api/notifications';
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.notifications) {
              set({ messages: data.notifications });
            }
          }
        } catch (e) {
          console.error("Failed to fetch notifications from API:", e);
        }
      },

      // ── Book / Inventory ───────────────────────────────
      deleteBook: (bookId) => {
        set((state) => ({
          inventory: state.inventory.filter((inv) => inv.book_id !== bookId),
          books: state.books.filter((b) => b.id !== bookId),
          categories: state.categories.map((c) => ({
            ...c,
            bookIds: c.bookIds.filter((id) => id !== bookId),
          })),
        }));
      },

      addBook: (newBookData, quantity, adminId) => {
        const normalizedName = newBookData.name.trim().toLowerCase();
        const existingBook = get().books.find(
          (b) => b.name.trim().toLowerCase() === normalizedName
        );

        const totalCost = newBookData.purchase_price * quantity;
        const currentWallet = get().wallet;

        if (existingBook) {
          const bookId = existingBook.id;
          const newPurchase: PurchaseHistory = {
            id: Math.random().toString(36).substr(2, 9),
            book_id: bookId,
            quantity,
            total_cost: totalCost,
            admin_id: adminId,
            date: new Date().toISOString(),
          };

          set((state) => {
            const updatedBooks = state.books.map((b) =>
              b.id === bookId
                ? {
                  ...b,
                  purchase_price: newBookData.purchase_price > 0 ? newBookData.purchase_price : b.purchase_price,
                  sale_price: newBookData.sale_price > 0 ? newBookData.sale_price : b.sale_price,
                }
                : b
            );

            const hasInv = state.inventory.some((inv) => inv.book_id === bookId);
            const updatedInventory = hasInv
              ? state.inventory.map((inv) =>
                inv.book_id === bookId
                  ? {
                    ...inv,
                    quantity: inv.quantity + quantity,
                    last_updated: new Date().toISOString(),
                  }
                  : inv
              )
              : [
                ...state.inventory,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  book_id: bookId,
                  quantity,
                  last_updated: new Date().toISOString(),
                },
              ];

            return {
              books: updatedBooks,
              wallet: {
                ...state.wallet,
                purchase_cost: state.wallet.purchase_cost + totalCost,
              },
              purchaseHistory: [...state.purchaseHistory, newPurchase],
              inventory: updatedInventory,
            };
          });

          return bookId;
        }

        const bookId = Math.random().toString(36).substr(2, 9);
        const newBook: Book = {
          ...newBookData,
          name: newBookData.name.trim(),
          id: bookId,
          created_at: new Date().toISOString(),
        };

        const newPurchase: PurchaseHistory = {
          id: Math.random().toString(36).substr(2, 9),
          book_id: bookId,
          quantity,
          total_cost: totalCost,
          admin_id: adminId,
          date: new Date().toISOString(),
        };

        const newInventoryItem: InventoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          book_id: bookId,
          quantity,
          last_updated: new Date().toISOString(),
        };

        set((state) => ({
          books: [...state.books, newBook],
          wallet: {
            ...currentWallet,
            purchase_cost: currentWallet.purchase_cost + totalCost,
          },
          purchaseHistory: [...state.purchaseHistory, newPurchase],
          inventory: [...state.inventory, newInventoryItem],
        }));
        return bookId;
      },

      restockBook: (bookId, quantity, purchasePrice, adminId) => {
        const totalCost = purchasePrice * quantity;
        const currentWallet = get().wallet;

        const newPurchase: PurchaseHistory = {
          id: Math.random().toString(36).substr(2, 9),
          book_id: bookId,
          quantity,
          total_cost: totalCost,
          admin_id: adminId,
          date: new Date().toISOString(),
        };

        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.book_id === bookId
              ? { ...inv, quantity: inv.quantity + quantity, last_updated: new Date().toISOString() }
              : inv
          ),
          wallet: {
            ...currentWallet,
            purchase_cost: currentWallet.purchase_cost + totalCost,
          },
          purchaseHistory: [...state.purchaseHistory, newPurchase],
        }));
      },

      sellBook: (bookId, quantity, customerName, status, sellerId) => {
        const book = get().books.find(b => b.id === bookId);
        if (!book) return;

        const totalPrice = book.sale_price * quantity;
        const currentWallet = get().wallet;

        let newBalance = currentWallet.balance;
        let newTotalDebt = currentWallet.total_debt;
        const newDebts = [...get().debts];

        if (status === 'paid') {
          newBalance += totalPrice;
        } else {
          // Student hasn't paid yet — record as student debt
          newTotalDebt += totalPrice;
          newDebts.push({
            id: Math.random().toString(36).substr(2, 9),
            amount: totalPrice,
            description: `Pending payment from ${customerName} for ${book.name}`,
            status: 'pending'
          });
        }

        const newSale: SalesHistory = {
          id: Math.random().toString(36).substr(2, 9),
          customer_name: customerName,
          book_id: bookId,
          quantity,
          total_price: totalPrice,
          status,
          seller_id: sellerId,
          date: new Date().toISOString(),
        };

        set((state) => ({
          inventory: state.inventory.map(inv =>
            inv.book_id === bookId ? { ...inv, quantity: inv.quantity - quantity, last_updated: new Date().toISOString() } : inv
          ),
          wallet: { ...currentWallet, balance: newBalance, total_debt: newTotalDebt },
          debts: newDebts,
          salesHistory: [...state.salesHistory, newSale],
        }));
      },

      // ── Category Actions ───────────────────────────────
      addCategory: (name) => {
        const caller = get().currentUser;
        if (caller?.role !== 'admin') return;
        const newCat: Category = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          bookIds: [],
          created_at: new Date().toISOString(),
        };
        set(state => ({ categories: [...state.categories, newCat] }));
      },

      deleteCategory: (categoryId) => {
        const caller = get().currentUser;
        if (caller?.role !== 'admin') return;
        set(state => ({ categories: state.categories.filter(c => c.id !== categoryId) }));
      },

      addBookToCategory: (categoryId, bookId) => {
        set(state => ({
          categories: state.categories.map(c =>
            c.id === categoryId && !c.bookIds.includes(bookId)
              ? { ...c, bookIds: [...c.bookIds, bookId] }
              : c
          )
        }));
      },

      removeBookFromCategory: (categoryId, bookId) => {
        set(state => ({
          categories: state.categories.map(c =>
            c.id === categoryId
              ? { ...c, bookIds: c.bookIds.filter(id => id !== bookId) }
              : c
          )
        }));
      },

      // ── Wallet Actions ─────────────────────────────────
      approveSale: (saleId) => {
        const sale = get().salesHistory.find(s => s.id === saleId);
        if (!sale || sale.status === 'paid') return;

        const currentWallet = get().wallet;
        set((state) => ({
          salesHistory: state.salesHistory.map(s =>
            s.id === saleId ? { ...s, status: 'paid' } : s
          ),
          wallet: {
            ...currentWallet,
            balance: currentWallet.balance + sale.total_price,
            total_debt: Math.max(0, currentWallet.total_debt - sale.total_price)
          }
        }));
      },

      // Admin pays all outstanding student debts from the wallet balance
      payStudentDebt: () => {
        const caller = get().currentUser;
        if (caller?.role !== 'admin') return;

        const currentWallet = get().wallet;
        const debtToPay = currentWallet.total_debt;
        if (debtToPay <= 0) return;

        // Deduct from wallet balance
        const newBalance = Math.max(0, currentWallet.balance - debtToPay);
        const amountPaid = currentWallet.balance - newBalance;

        set((state) => ({
          wallet: {
            ...currentWallet,
            balance: newBalance,
            total_debt: Math.max(0, currentWallet.total_debt - amountPaid),
          },
          // Mark all pending sales as paid
          salesHistory: state.salesHistory.map(s =>
            s.status === 'pending' ? { ...s, status: 'paid' } : s
          ),
          debts: state.debts.map(d => ({ ...d, status: 'cleared' as const })),
        }));
      },

      payBookCosts: (amount) => {
        const caller = get().currentUser;
        if (caller?.role !== 'admin') return;

        const currentWallet = get().wallet;
        if (amount <= 0 || amount > currentWallet.purchase_cost) return;

        set({
          wallet: {
            ...currentWallet,
            balance: currentWallet.balance - amount,
            purchase_cost: Math.max(0, currentWallet.purchase_cost - amount),
          }
        });
      },

      cashOut: (amount, description) => {
        const currentWallet = get().wallet;
        if (currentWallet.balance < amount) return;

        const caller = get().currentUser;

        const newCashOutRecord: SalesHistory = {
          id: Math.random().toString(36).substr(2, 9),
          customer_name: description || "Admin Cash Out",
          book_id: "cash_out",
          quantity: 0,
          total_price: -amount,
          status: "cash_out",
          seller_id: caller?.id || "admin",
          date: new Date().toISOString(),
        };

        set((state) => ({
          wallet: {
            ...currentWallet,
            balance: currentWallet.balance - amount
          },
          salesHistory: [...state.salesHistory, newCashOutRecord]
        }));
      },

      clearWalletBalance: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear wallet balance");
          return;
        }
        const currentWallet = get().wallet;
        set({ wallet: { ...currentWallet, balance: 0 } });
      },

      clearTotalDebt: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear total debt");
          return;
        }
        const currentWallet = get().wallet;
        set({ wallet: { ...currentWallet, total_debt: 0 } });
      },

      clearBookCosts: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear book costs");
          return;
        }
        const currentWallet = get().wallet;
        set({ wallet: { ...currentWallet, purchase_cost: 0 } });
      },

      clearSalesHistory: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear sales history");
          return;
        }
        set({ salesHistory: [] });
      },

      clearPurchaseHistory: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear purchase history");
          return;
        }
        set({ purchaseHistory: [] });
      },

      clearCart: () => {
        const caller = get().currentUser;
        if (caller?.role === 'admin' && caller?.isPromotedAdmin) {
          console.warn("Marked admin cannot clear cart");
          return;
        }
        set({ cart: { month: '', entries: [] } });
      },

      // ── Daily Auto-Reset with Cart Archiving ────────────────
      // Before clearing daily tallies, today's data is archived into the Cart.
      // Sales History retains 1 month of records; Cart retains 1 year (365 days) of records.
      performDailyReset: () => {
        const now = new Date();
        const today = now.toISOString().slice(0, 10);        // 'YYYY-MM-DD'

        const { lastResetDate, salesHistory, purchaseHistory, debts, wallet, cart } = get();
        if (lastResetDate === today) return; // Already reset today — nothing to do

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const hasData = salesHistory.length > 0 || purchaseHistory.length > 0 || debts.length > 0;
        const prevEntries = cart?.entries ? [...cart.entries] : [];

        if (hasData) {
          const newEntry: CartEntry = {
            date: lastResetDate || today,
            salesHistory,
            purchaseHistory,
            debts,
            walletSnapshot: {
              total_debt: wallet.total_debt,
              purchase_cost: wallet.purchase_cost,
              balance: wallet.balance,
            },
          };
          const existingIdx = prevEntries.findIndex(e => e.date === newEntry.date);
          if (existingIdx >= 0) {
            prevEntries[existingIdx] = newEntry;
          } else {
            prevEntries.push(newEntry);
          }
        }

        // Cart retains records for 1 year (365 days)
        const prunedCartEntries = prevEntries.filter(entry => {
          if (!entry.date) return false;
          const d = new Date(entry.date + 'T00:00:00');
          return d.getTime() >= oneYearAgo.getTime();
        });

        // Sales History retains records for 1 month
        const prunedSalesHistory = salesHistory.filter(s => {
          if (!s.date) return false;
          return new Date(s.date).getTime() >= oneMonthAgo.getTime();
        });

        set({
          salesHistory: prunedSalesHistory,
          purchaseHistory: [],
          debts: [],
          lastResetDate: today,
          cart: { entries: prunedCartEntries },
          wallet: {
            ...wallet,
            total_debt: 0,
            purchase_cost: 0,
          },
        });
      },

      syncWithDatabase: async () => {
        try {
          const rawData = await apiStorage.getItem('stark-edu-wallet-storage');
          if (!rawData) return { newPendingUsers: [] };
          const parsed = JSON.parse(rawData);
          const dbState = parsed?.state;
          if (!dbState) return { newPendingUsers: [] };

          const currentUsers = get().users || [];
          const dbUsers: User[] = dbState.users || [];

          const seedIds = new Set(SUPER_ADMIN_SEEDS.map((s) => s.id));
          const nonAdminDbUsers = dbUsers.filter((u) => !seedIds.has(u.id));
          const mergedUsers = [...SUPER_ADMIN_SEEDS, ...nonAdminDbUsers].map((u) => {
            const status: RegistrationStatus =
              u.status || (u.isApproved === false ? 'pending' : 'approved');
            return {
              ...u,
              status,
              isApproved: status === 'approved',
            };
          });

          const currentPendingIds = new Set(
            currentUsers
              .filter((u) => u.status === 'pending' || u.isApproved === false)
              .map((u) => u.id)
          );
          const newPendingUsers = mergedUsers.filter(
            (u) =>
              (u.status === 'pending' || u.isApproved === false) &&
              !currentPendingIds.has(u.id)
          );

          const activeUser = getLocalCurrentUser() || get().currentUser;
          let updatedCurrentUser = get().currentUser;
          if (activeUser) {
            const match = mergedUsers.find((u) => u.id === activeUser.id);
            if (match) {
              setLocalCurrentUser(match);
              updatedCurrentUser = match;
            } else {
              // The active user's account has been permanently expunged
              removeLocalCurrentUser();
              updatedCurrentUser = null;
              set({ isAccessRevoked: true });
            }
          }

          // Gather all admin IDs & emails for message targeting
          const adminIds = Array.from(
            new Set([
              ...SUPER_ADMIN_SEEDS.map((s) => s.id),
              ...mergedUsers.filter((u) => u.role === 'admin').map((u) => u.id),
            ])
          );
          const adminEmails = Array.from(
            new Set([
              ...SUPER_ADMIN_SEEDS.map((s) => s.email),
              ...mergedUsers.filter((u) => u.role === 'admin').map((u) => u.email),
            ])
          );

          // Build self-healing messages list: ensure every pending user has a registration notification
          let mergedMessages: AppMessage[] = dbState.messages ? [...dbState.messages] : [...(get().messages || [])];
          const pendingUsers = mergedUsers.filter((u) => u.status === 'pending' || u.isApproved === false);

          for (const pendingUser of pendingUsers) {
            const exists = mergedMessages.some(
              (m) => m.type === "registration" && (m.userId === pendingUser.id || m.senderEmail === pendingUser.email)
            );
            if (!exists) {
              const synthMsg: AppMessage = {
                id: `reg-notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                type: "registration",
                title: "New Account Registration",
                content: `New ${pendingUser.role || 'seller'} account registration request from ${pendingUser.name} (${pendingUser.email}). Action required: Accept or Dismiss.`,
                senderName: pendingUser.name,
                senderEmail: pendingUser.email,
                userId: pendingUser.id,
                date: new Date().toISOString(),
                read: false,
                status: "pending",
                targetAdminIds: adminIds,
                targetEmails: adminEmails,
              };
              mergedMessages = [synthMsg, ...mergedMessages];
            }
          }

          // Mark registration messages as handled for users who are already approved or rejected
          const approvedUserIds = new Set(
            mergedUsers.filter((u) => u.status === 'approved' || u.isApproved === true).map((u) => u.id)
          );
          const rejectedUserIds = new Set(
            mergedUsers.filter((u) => u.status === 'rejected').map((u) => u.id)
          );

          mergedMessages = mergedMessages.map((m) => {
            if (m.type === "registration" && m.userId) {
              if (approvedUserIds.has(m.userId)) {
                return {
                  ...m,
                  status: 'handled' as const,
                  actionTaken: m.actionTaken || ('accepted' as const),
                  read: true,
                };
              }
              if (rejectedUserIds.has(m.userId)) {
                return {
                  ...m,
                  status: 'handled' as const,
                  actionTaken: m.actionTaken || ('dismissed' as const),
                  read: true,
                };
              }
            }
            return m;
          });

          isSyncingState = true;
          try {
            set({
              users: mergedUsers,
              books: dbState.books || get().books,
              inventory: dbState.inventory || get().inventory,
              wallet: dbState.wallet || get().wallet,
              salesHistory: dbState.salesHistory || get().salesHistory,
              purchaseHistory: dbState.purchaseHistory || get().purchaseHistory,
              debts: dbState.debts || get().debts,
              categories: dbState.categories || get().categories,
              activeSessions: dbState.activeSessions || get().activeSessions,
              lastResetDate: dbState.lastResetDate || get().lastResetDate,
              cart: dbState.cart || get().cart,
              messages: mergedMessages,
              currentUser: updatedCurrentUser,
            });
          } finally {
            isSyncingState = false;
          }

          return { newPendingUsers };
        } catch (e) {
          console.error("Failed syncWithDatabase", e);
          return { newPendingUsers: [] };
        }
      },
    }),
    {
      name: 'stark-edu-wallet-storage',
      storage: createJSONStorage(() => apiStorage),
      // ⚠️ CRITICAL: exclude currentUser from shared DB persistence.
      // Each user's session is tracked locally in their own browser (localStorage).
      // activeSessions IS persisted so other devices know who is logged in.
      partialize: (state) => ({
        users: state.users,
        books: state.books,
        inventory: state.inventory,
        wallet: state.wallet,
        salesHistory: state.salesHistory,
        purchaseHistory: state.purchaseHistory,
        debts: state.debts,
        categories: state.categories,
        activeSessions: state.activeSessions,
        lastResetDate: state.lastResetDate,
        cart: state.cart,
        messages: state.messages,
        // currentUser is intentionally NOT included here
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Consolidate any duplicate book entries across books, inventory, and categories
          const consolidated = consolidateDuplicateBooks({
            books: state.books || [],
            inventory: state.inventory || [],
            categories: state.categories || [],
            salesHistory: state.salesHistory || [],
            purchaseHistory: state.purchaseHistory || [],
          });

          state.books = consolidated.books;
          state.inventory = consolidated.inventory;
          state.categories = consolidated.categories;
          state.salesHistory = consolidated.salesHistory;
          state.purchaseHistory = consolidated.purchaseHistory;

          // ⚠️ ALWAYS override super-admin entries with the hardcoded seed data.
          // This ensures passwords and roles stay in sync with the source code.
          const deletedSet = new Set(Array.isArray((state as unknown as { deletedUserIds?: string[] }).deletedUserIds) ? (state as unknown as { deletedUserIds?: string[] }).deletedUserIds : []);
          const seedIds = new Set(SUPER_ADMIN_SEEDS.map(s => s.id));
          const nonAdminUsers = (state.users || []).filter(u => !seedIds.has(u.id) && !deletedSet.has(u.id));
          state.users = [
            ...SUPER_ADMIN_SEEDS.filter(s => s.email.toLowerCase() === 'admin@stark.edu' || !deletedSet.has(s.id)),
            ...nonAdminUsers
          ];

          // Ensure all hydrated users have isApproved field (backward compatibility)
          state.users = state.users.map(u => ({
            ...u,
            isApproved: u.isApproved !== undefined ? u.isApproved : true
          }));

          // Ensure wallet has purchase_cost field (backward compatibility with old data)
          if (state.wallet && state.wallet.purchase_cost === undefined) {
            state.wallet = { ...state.wallet, purchase_cost: 0 };
          }

          // Sync currentUser with latest database user list
          const localUser = getLocalCurrentUser();
          if (localUser) {
            // Also check super-admin seeds in case they are the current user
            const allUsers = [...SUPER_ADMIN_SEEDS, ...nonAdminUsers];
            const latestUser = allUsers.find(u => u.id === localUser.id);
            if (latestUser) {
              setLocalCurrentUser(latestUser);
              state.currentUser = latestUser;
            } else {
              removeLocalCurrentUser();
              state.currentUser = null;
              state.isAccessRevoked = true;
            }
          } else {
            state.currentUser = null;
          }

          // ── Retention Windows on Hydration ────────────────────
          // Sales History: 1 month retention
          // Cart: 1 year (365 days) retention
          const now = new Date();
          const today = now.toISOString().slice(0, 10);

          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          const prevEntries = state.cart?.entries || [];

          if (state.lastResetDate !== today) {
            const hasData =
              (state.salesHistory || []).length > 0 ||
              (state.purchaseHistory || []).length > 0 ||
              (state.debts || []).length > 0;

            const nextEntries = [...prevEntries];

            if (hasData) {
              const newEntry: CartEntry = {
                date: state.lastResetDate || today,
                salesHistory: state.salesHistory,
                purchaseHistory: state.purchaseHistory,
                debts: state.debts,
                walletSnapshot: {
                  total_debt: state.wallet.total_debt,
                  purchase_cost: state.wallet.purchase_cost,
                  balance: state.wallet.balance,
                },
              };
              const existingIdx = nextEntries.findIndex(e => e.date === newEntry.date);
              if (existingIdx >= 0) {
                nextEntries[existingIdx] = newEntry;
              } else {
                nextEntries.push(newEntry);
              }
            }

            state.purchaseHistory = [];
            state.debts = [];
            state.lastResetDate = today;
            state.wallet = { ...state.wallet, total_debt: 0, purchase_cost: 0 };
            state.cart = { entries: nextEntries };
          }

          // Enforce 1-month cutoff for Sales History
          state.salesHistory = (state.salesHistory || []).filter((s) => {
            if (!s.date) return false;
            return new Date(s.date).getTime() >= oneMonthAgo.getTime();
          });

          // Enforce 1-year cutoff for Cart entries
          const cartEntriesToKeep = (state.cart?.entries || []).filter((e) => {
            if (!e.date) return false;
            const d = new Date(e.date + 'T00:00:00');
            return d.getTime() >= oneYearAgo.getTime();
          });
          state.cart = { entries: cartEntriesToKeep };

          state.setHasHydrated(true);
        }
      }
    }
  )
);
