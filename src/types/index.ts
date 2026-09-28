export type Role = "admin" | "seller" | "teacher";
export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string;
  isPromotedAdmin?: boolean;
  isSuperAdmin?: boolean; // Built-in protected admin accounts
  status?: RegistrationStatus; // "pending" | "approved" | "rejected"
  isApproved?: boolean;
}

export interface Book {
  id: string;
  name: string;
  purchase_price: number;
  sale_price: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  book_id: string;
  quantity: number;
  last_updated: string;
}

export interface Wallet {
  id: string;
  balance: number;
  total_debt: number;     // Student debts only (unpaid sales)
  purchase_cost: number;  // Book purchase costs (shown on Dashboard, separate from student debt)
}

export interface SalesHistory {
  id: string;
  customer_name: string;
  book_id: string;
  quantity: number;
  total_price: number;
  status: "paid" | "pending" | "cash_out";
  seller_id: string;
  date: string;
}

export interface PurchaseHistory {
  id: string;
  book_id: string;
  quantity: number;
  total_cost: number;
  admin_id: string;
  date: string;
}

export interface Debt {
  id: string;
  amount: number;
  description: string;
  status: "pending" | "cleared";
}

export interface Category {
  id: string;
  name: string;
  bookIds: string[];
  created_at: string;
}

// ── Cart (Archive - 1 Year Retention) ───────────────────────────────
// Each day's transactional data is archived here during daily auto-reset.
// The cart retains archived records for 1 year (365 days).
export interface CartEntry {
  date: string;           // YYYY-MM-DD
  salesHistory: SalesHistory[];
  purchaseHistory: PurchaseHistory[];
  debts: Debt[];
  walletSnapshot: {
    total_debt: number;
    purchase_cost: number;
    balance: number;
  };
}

export interface MonthlyCart {
  month?: string;          // YYYY-MM (kept optional for backward compatibility)
  entries: CartEntry[];
}

export type NotificationStatus = "pending" | "handled";

export interface AppMessage {
  id: string;
  type: "registration" | "system";
  title: string;
  content: string;
  senderName?: string;
  senderEmail?: string;
  userId?: string;
  date: string;
  read: boolean;
  status?: NotificationStatus; // "pending" | "handled"
  targetAdminIds?: string[]; // Both admin IDs e.g. ['superadmin-001', 'superadmin-002']
  targetEmails?: string[];
  handledBy?: string;
  handledAt?: string;
  actionTaken?: "accepted" | "dismissed";
}

