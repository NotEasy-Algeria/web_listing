# Supabase Initialization Scripts

This folder contains SQL scripts to initialize and configure the Supabase database for the Doctor App.

## 📋 Execution Order

Execute these scripts in the following order in your Supabase SQL Editor:

1. **001_tables_auth.sql** - Creates all tables (admins, doctors, abonnements)
2. **002_buckets.sql** - Storage buckets configuration (currently empty)
3. **003_functions_auth.sql** - Database functions (updated_at trigger)
4. **004_realtions_auth.sql** - Foreign key relationships
5. **005_triggers_auth.sql** - Triggers for auto-updating timestamps
6. **006_rls.sql** - Row Level Security (RLS) policies
7. **007_add_password_to_doctors.sql** - Adds password column to doctors table (migration) - *Optional: Can be skipped if using Supabase Auth*
8. **008_link_doctors_to_auth.sql** - Links doctors table to Supabase Auth users (adds user_id foreign key)

## 🗄️ Database Schema

### Tables

#### `admins`
- Admin users for the dashboard
- Fields: id, first_name, last_name, email, password, status, phone, timestamps
- Constraints: Email format validation, password minimum length (6 chars)

#### `doctors`
- Doctor accounts linked to Supabase Auth users
- Fields: id, first_name, last_name, email, field, status, phone, password (deprecated), user_id, timestamps
- Constraints: Email format validation (optional/nullable)
- **Relationship**: `user_id` references `auth.users(id)` with CASCADE delete
- **Note**: Password is stored in Supabase Auth, not in the doctors table. The `password` column is kept for backward compatibility but should not be used.

#### `abonnements`
- Subscription records for doctors
- Fields: id, id_doctor, price, type, start, end_date, timestamps
- Constraints: 
  - Price >= 0
  - end_date >= start_date
  - Foreign key to doctors table with CASCADE delete

## 📊 Indexes

### Performance Optimizations

#### `admins`
- `idx_admins_email` - Email lookups

#### `doctors`
- `idx_doctors_email` - Email lookups
- `idx_doctors_status` - Status filtering
- `idx_doctors_created_at` - Sorting and date filtering
- `idx_doctors_user_id` - Lookups by Supabase Auth user ID

#### `abonnements`
- `idx_abonnements_id_doctor` - Foreign key lookups
- `idx_abonnements_end_date` - Active/expired filtering (critical for statistics)
- `idx_abonnements_created_at` - Date-based queries and statistics
- `idx_abonnements_type` - Filtering by subscription type

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies allowing full access to authenticated users.

⚠️ **Security Note**: Current policies are permissive. For production environments, consider:
1. Implementing role-based access control (admin-only policies)
2. Using service role key for admin operations instead of anon key
3. Function-based policies with custom admin verification

## 🔧 Recent Improvements

### Added in Latest Update:

1. **Data Validation Constraints**:
   - Email format validation for admins and doctors
   - Password minimum length check for admins
   - Price validation (>= 0) for abonnements
   - Date validation (end_date >= start_date) for abonnements

2. **Performance Indexes**:
   - `idx_abonnements_end_date` - Critical for filtering active/expired subscriptions
   - `idx_abonnements_created_at` - Essential for statistics and date-based queries
   - `idx_abonnements_type` - For filtering by subscription type
   - `idx_doctors_created_at` - For sorting and date filtering

3. **Code Organization**:
   - Moved `idx_abonnements_id_doctor` index creation to 001_tables_auth.sql
   - Added comments for better documentation
   - Security recommendations added

## 🚀 Quick Start

1. Open Supabase Dashboard → SQL Editor
2. Execute scripts in order (001 → 008)
3. Verify tables are created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
4. Verify indexes: `SELECT * FROM pg_indexes WHERE schemaname = 'public';`
5. Verify user_id foreign key: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'user_id';`

## 📝 Notes

- All scripts use `IF NOT EXISTS` / `DROP IF EXISTS` for idempotency
- Triggers automatically update `updated_at` timestamps
- Foreign keys use `ON DELETE CASCADE` for data integrity
- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling

