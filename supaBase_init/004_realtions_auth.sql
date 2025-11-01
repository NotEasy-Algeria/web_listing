-- Foreign Key Relations

-- Abonnements references doctors table
-- Note: This assumes the doctors table exists. If it doesn't exist yet, create it first.
-- If doctors table uses a different structure, adjust the foreign key constraint accordingly.
ALTER TABLE IF EXISTS public.abonnements
DROP CONSTRAINT IF EXISTS abonnements_id_doctor_fkey;

ALTER TABLE IF EXISTS public.abonnements
ADD CONSTRAINT abonnements_id_doctor_fkey
FOREIGN KEY (id_doctor) 
REFERENCES public.doctors(id) 
ON DELETE CASCADE;

-- Note: Index idx_abonnements_id_doctor is created in 001_tables_auth.sql
-- This ensures the foreign key constraint exists for referential integrity
