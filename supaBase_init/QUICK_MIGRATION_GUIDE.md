# Quick Migration Guide - Add user_id to Doctors Table

## ⚠️ Error Fix

If you see this error:
```
Could not find the 'user_id' column of 'doctors' in the schema cache
```

You need to run the migration script to add the `user_id` column.

## 🚀 Quick Fix Steps

### Option 1: Run via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the contents of `008_link_doctors_to_auth.sql`
   - Paste it into the SQL editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify it worked**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'doctors' 
   AND column_name = 'user_id';
   ```
   You should see `user_id` with type `uuid`.

### Option 2: Manual SQL Command

If you prefer, you can run this directly:

```sql
-- Add user_id column to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
```

## ✅ What This Does

- Adds `user_id` column to link doctors to Supabase Auth users
- Creates foreign key relationship with `auth.users(id)`
- Adds index for faster queries
- Enables CASCADE delete (if auth user is deleted, doctor record is deleted too)

## 📝 After Migration

Once the migration is complete:
- Doctor creation will automatically link to Supabase Auth users
- Passwords are stored securely in Supabase Auth (not in doctors table)
- Doctors can login using their Supabase Auth credentials

