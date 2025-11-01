-- ⚠️ SECURITY NOTE: Current RLS policies allow any authenticated user full access
-- For production, consider implementing role-based policies or admin-only access
-- Example: Only admins from admins table can access these resources

-- Enable RLS on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to read admins
DROP POLICY IF EXISTS admins_read_auth ON public.admins;
CREATE POLICY admins_read_auth
ON public.admins
FOR SELECT
TO authenticated
USING (true);

-- Policy: allow authenticated users to insert admins
DROP POLICY IF EXISTS admins_insert_auth ON public.admins;
CREATE POLICY admins_insert_auth
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: allow authenticated users to update admins
DROP POLICY IF EXISTS admins_update_auth ON public.admins;
CREATE POLICY admins_update_auth
ON public.admins
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: allow authenticated users to delete admins
DROP POLICY IF EXISTS admins_delete_auth ON public.admins;
CREATE POLICY admins_delete_auth
ON public.admins
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on doctors
ALTER TABLE IF EXISTS public.doctors ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to read doctors
DROP POLICY IF EXISTS doctors_read_auth ON public.doctors;
CREATE POLICY doctors_read_auth
ON public.doctors
FOR SELECT
TO authenticated
USING (true);

-- Policy: allow authenticated users to insert doctors
DROP POLICY IF EXISTS doctors_insert_auth ON public.doctors;
CREATE POLICY doctors_insert_auth
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: allow authenticated users to update doctors
DROP POLICY IF EXISTS doctors_update_auth ON public.doctors;
CREATE POLICY doctors_update_auth
ON public.doctors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: allow authenticated users to delete doctors
DROP POLICY IF EXISTS doctors_delete_auth ON public.doctors;
CREATE POLICY doctors_delete_auth
ON public.doctors
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS on abonnements
ALTER TABLE IF EXISTS public.abonnements ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to read abonnements
DROP POLICY IF EXISTS abonnements_read_auth ON public.abonnements;
CREATE POLICY abonnements_read_auth
ON public.abonnements
FOR SELECT
TO authenticated
USING (true);

-- Policy: allow authenticated users to insert abonnements
DROP POLICY IF EXISTS abonnements_insert_auth ON public.abonnements;
CREATE POLICY abonnements_insert_auth
ON public.abonnements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: allow authenticated users to update abonnements
DROP POLICY IF EXISTS abonnements_update_auth ON public.abonnements;
CREATE POLICY abonnements_update_auth
ON public.abonnements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: allow authenticated users to delete abonnements
DROP POLICY IF EXISTS abonnements_delete_auth ON public.abonnements;
CREATE POLICY abonnements_delete_auth
ON public.abonnements
FOR DELETE
TO authenticated
USING (true);

-- ⚠️ RECOMMENDATION: For better security, consider implementing:
-- 1. Role-based access control (admin-only policies)
-- 2. Service role key for admin operations instead of anon key
-- 3. Function-based policies with custom admin verification
