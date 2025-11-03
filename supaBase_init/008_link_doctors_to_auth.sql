-- Migration: Link doctors table to Supabase Auth users
-- This migration adds a user_id column that references auth.users

-- Add user_id column to doctors table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE public.doctors 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Add index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
        
        -- Make email optional since it will come from auth.users
        -- (Keep email for backward compatibility and quick lookups)
        
        COMMENT ON COLUMN public.doctors.user_id IS 'Reference to Supabase Auth user ID';
    END IF;
END $$;

-- Optional: Remove password column from doctors table since passwords are handled by Supabase Auth
-- Uncomment the following if you want to remove password storage:
/*
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors' 
        AND column_name = 'password'
    ) THEN
        -- Drop the password constraint first
        ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_password_length;
        
        -- Drop the password column
        ALTER TABLE public.doctors DROP COLUMN password;
    END IF;
END $$;
*/

