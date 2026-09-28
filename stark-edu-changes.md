# Stark-Edu Wallet — Code Changes Guide

Three changes are needed across your Next.js + Supabase project. Apply each patch to the file listed.

---

## Change 1 · Rename "Book Name" → "Category" in Inventory

**File:** `src/app/dashboard/inventory/page.tsx`

Find every occurrence of `Book Name` / `bookName` / `book_name` in this file and replace as shown below.

```tsx
// BEFORE — column header label
<th>Book Name</th>

// AFTER
<th>Category</th>
```

```tsx
// BEFORE — input field label (in your add/edit form)
<label htmlFor="bookName">Book Name</label>
<input id="bookName" name="bookName" ... />

// AFTER
<label htmlFor="category">Category</label>
<input id="category" name="category" ... />
```

```tsx
// BEFORE — table cell rendering
<td>{item.bookName}</td>       // or item.book_name

// AFTER
<td>{item.category}</td>
```

> **Supabase column note:** If your Supabase table column is literally called `book_name`, you have two options:
> - Rename the column in Supabase to `category` (then update every query/type that references it), **or**
> - Keep the column name and just alias it in your select: `.select('book_name as category, ...')` and use `item.category` in the UI.

---

## Change 2 · Unified data visibility for Admin and Seller

Both roles should see the **same numbers** for wallet, total debt, inventory, sales history, total books, total sales, and recent sales — but keep their existing action permissions.

### 2a · Types — `src/types/index.ts`

Make sure your shared stats type is role-agnostic:

```ts
export interface DashboardStats {
  totalBooks: number;
  totalSales: number;
  totalDebt: number;
  recentSales: Sale[];
  inventoryItems: InventoryItem[];
  salesHistory: Sale[];
}
```

### 2b · Store / data fetcher — `src/store/index.ts`

The key change: **both roles run the same queries**. Remove any `if (role === 'admin')` forks that limit what data sellers can see.

```ts
// BEFORE — role-split fetching (seller sees less data)
export async function fetchDashboardData(userId: string, role: string) {
  if (role === 'admin') {
    // fetch everything
  } else {
    // seller only fetches their own data
  }
}

// AFTER — same query for both, role only gates actions later
export async function fetchDashboardData(userId: string, role: string) {
  const { data: inventory } = await supabase
    .from('inventory')
    .select('*');                        // ← no user filter here

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, debt')
    .single();                           // aggregate wallet, not per-user

  return {
    totalBooks:    inventory?.length ?? 0,
    totalSales:    sales?.length ?? 0,
    totalDebt:     wallet?.debt ?? 0,
    recentSales:   sales?.slice(0, 5) ?? [],
    inventoryItems: inventory ?? [],
    salesHistory:  sales ?? [],
    walletBalance: wallet?.balance ?? 0,
  };
}
```

### 2c · Dashboard page — `src/app/dashboard/page.tsx`

Pass the shared stats to both role views:

```tsx
// BEFORE
{role === 'admin' && <AdminDashboard stats={adminStats} />}
{role === 'seller' && <SellerDashboard stats={sellerStats} />}

// AFTER — both components receive the same `stats` object
{role === 'admin' && <AdminDashboard stats={stats} />}
{role === 'seller' && <SellerDashboard stats={stats} />}
```

### 2d · Wallet page — `src/app/dashboard/wallet/page.tsx`

```tsx
// BEFORE — seller wallet query might be filtered by userId
const { data } = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', userId);   // ← this hides the shared balance

// AFTER — fetch the global wallet (or sum all wallets)
const { data } = await supabase
  .from('wallets')
  .select('*');              // both roles see total

const totalBalance = data?.reduce((sum, w) => sum + w.balance, 0) ?? 0;
const totalDebt    = data?.reduce((sum, w) => sum + w.debt,    0) ?? 0;
```

### 2e · Sales page — `src/app/dashboard/sales/page.tsx`

```tsx
// BEFORE
.eq('seller_id', userId)   // seller only sees their own sales

// AFTER — remove the filter so both see all sales
const { data: sales } = await supabase
  .from('sales')
  .select('*')
  .order('created_at', { ascending: false });
```

> **Permissions stay intact:** The `role` value still controls whether buttons like "Add Stock", "Delete User", "Approve Sale", etc. are rendered. Only the *data fetching* becomes shared.

---

## Change 3 · Remove demo accounts from Sign-in page

**File:** `src/app/login/page.tsx`

Find and delete the demo credentials block. It typically looks like one of these patterns:

```tsx
// PATTERN A — hardcoded credential cards/buttons
// DELETE the entire block:
<div className="demo-accounts">
  <p>Demo accounts:</p>
  <button onClick={() => fillCredentials('admin@demo.com', 'password123')}>
    Admin Demo
  </button>
  <button onClick={() => fillCredentials('seller@demo.com', 'password123')}>
    Seller Demo
  </button>
</div>

// PATTERN B — pre-filled default values on the inputs
// BEFORE
<input defaultValue="admin@demo.com" ... />
<input defaultValue="password123" ... />

// AFTER — clear the defaults
<input defaultValue="" placeholder="you@example.com" ... />
<input defaultValue="" placeholder="••••••••" ... />

// PATTERN C — helper text showing credentials
// DELETE lines like:
<p className="text-sm text-gray-400">
  Admin: admin@test.com / pass123
</p>
```

Also delete any `fillCredentials` / `setDemoAccount` helper functions that were only there to support those buttons:

```tsx
// DELETE this function entirely if it exists:
const fillCredentials = (email: string, password: string) => {
  setEmail(email);
  setPassword(password);
};
```

---

## Quick checklist

| # | File | What to change |
|---|------|----------------|
| 1 | `src/app/dashboard/inventory/page.tsx` | `Book Name` → `Category` in label, header, cell |
| 2a | `src/types/index.ts` | Ensure `DashboardStats` is shared / role-neutral |
| 2b | `src/store/index.ts` | Remove role forks from data-fetch functions |
| 2c | `src/app/dashboard/page.tsx` | Pass same `stats` to both role components |
| 2d | `src/app/dashboard/wallet/page.tsx` | Remove per-user wallet filter |
| 2e | `src/app/dashboard/sales/page.tsx` | Remove `seller_id` filter from sales query |
| 3 | `src/app/login/page.tsx` | Delete demo account UI block and helper function |
