-- Stark Edu Wallet - Supabase Schema
-- Run this in your Supabase SQL Editor to set up the backend.

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'seller');
CREATE TYPE payment_status AS ENUM ('paid', 'pending');
CREATE TYPE debt_status AS ENUM ('pending', 'cleared');

-- 2. Create Users Table (Extending Supabase Auth if needed)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Books Table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
  sale_price NUMERIC NOT NULL CHECK (sale_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Inventory Table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Wallet Table (Singleton table for Admin Wallet)
CREATE TABLE public.wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance NUMERIC NOT NULL DEFAULT 0,
  total_debt NUMERIC NOT NULL DEFAULT 0
);
-- Initialize wallet with 0 balance
INSERT INTO public.wallet (balance, total_debt) VALUES (0, 0);

-- 6. Create Sales History Table
CREATE TABLE public.sales_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  book_id UUID REFERENCES public.books(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC NOT NULL,
  status payment_status NOT NULL,
  seller_id UUID REFERENCES public.users(id),
  date TIMESTAMPTZ DEFAULT now()
);

-- 7. Create Purchase History Table
CREATE TABLE public.purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES public.books(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_cost NUMERIC NOT NULL,
  admin_id UUID REFERENCES public.users(id),
  date TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Debts Table
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC NOT NULL,
  description TEXT,
  status debt_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: In a production environment, you should also set up Row Level Security (RLS) policies 
-- to restrict access such that only admins can write to books/inventory, 
-- and sellers can only insert into sales_history.
