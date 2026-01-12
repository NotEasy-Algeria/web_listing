-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admins table for Doctor App
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Email format validation
  CONSTRAINT admins_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  -- Password minimum length check (basic security)
  CONSTRAINT admins_password_length CHECK (length(password) >= 6)
);

-- Helpful index for lookups by email
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins (email);

-- Doctors table for Doctor App
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  field TEXT,
  status BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Optional: Add email validation constraint
  CONSTRAINT doctors_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Helpful index for lookups by email
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors (email);
-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_doctors_status ON public.doctors (status);
-- Index for created_at for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_doctors_created_at ON public.doctors (created_at);

-- Abonnements (Subscriptions) table for Doctor App
CREATE TABLE IF NOT EXISTS public.abonnements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_doctor UUID NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
  start DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure end_date is after start_date
  CONSTRAINT abonnements_date_check CHECK (end_date >= start)
);

-- Indexes for abonnements table for better query performance
CREATE INDEX IF NOT EXISTS idx_abonnements_id_doctor ON public.abonnements(id_doctor);
CREATE INDEX IF NOT EXISTS idx_abonnements_end_date ON public.abonnements(end_date);
CREATE INDEX IF NOT EXISTS idx_abonnements_created_at ON public.abonnements(created_at);
CREATE INDEX IF NOT EXISTS idx_abonnements_type ON public.abonnements(type);

-- Types table for Doctor App
CREATE TABLE IF NOT EXISTS public.fileds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_fileds_name ON public.fileds (name);

-- Sub_type table for Doctor App
CREATE TABLE IF NOT EXISTS public.sub_type (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  duration INTEGER NOT NULL CHECK (duration > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sub_type table for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_type_name ON public.sub_type (name);
CREATE INDEX IF NOT EXISTS idx_sub_type_price ON public.sub_type (price);
CREATE INDEX IF NOT EXISTS idx_sub_type_duration ON public.sub_type (duration);

