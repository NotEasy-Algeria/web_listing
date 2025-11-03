-- Migration: Add password column to doctors table
-- This migration adds a password field to the doctors table

-- Add password column to doctors table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE public.doctors 
        ADD COLUMN password TEXT;
        
        -- Add password length constraint (same as admins)
        ALTER TABLE public.doctors
        ADD CONSTRAINT doctors_password_length CHECK (password IS NULL OR length(password) >= 6);
        
        COMMENT ON COLUMN public.doctors.password IS 'Password for doctor account (minimum 6 characters)';
    END IF;
END $$;

