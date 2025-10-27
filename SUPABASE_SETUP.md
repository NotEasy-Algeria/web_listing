# Doctor App - Supabase Integration

This project is now integrated with Supabase for authentication and database management.

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Variables

1. Copy `env.example` to `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'doctor', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  speciality TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  experience_years INTEGER DEFAULT 0,
  location TEXT NOT NULL,
  bio TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  price DECIMAL(10,2) NOT NULL,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Create Test Data (Optional)

```sql
-- Insert test admin user
INSERT INTO public.users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000000', 'admin@doctorapp.com', 'Dr. John Doe', 'admin');

-- Insert test doctor
INSERT INTO public.doctors (user_id, speciality, license_number, experience_years, location, bio, status) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Cardiologie', '123456789', 15, 'Paris', 'Médecin cardiologue expérimenté', 'active');
```

## 🔧 Features Implemented

### Authentication
- ✅ User login with email/password
- ✅ User registration
- ✅ Logout functionality
- ✅ Session management
- ✅ Error handling

### Database Services
- ✅ Users management (CRUD)
- ✅ Doctors management (CRUD)
- ✅ Subscriptions management (CRUD)
- ✅ Appointments management (CRUD)
- ✅ Dashboard statistics

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ User-specific data access
- ✅ Admin privileges
- ✅ Secure API endpoints

## 📱 Usage

### Login
Use the login form with valid Supabase credentials.

### Dashboard
The dashboard now connects to Supabase for real data:
- User management
- Doctor management
- Subscription tracking
- Appointment scheduling
- Statistics and analytics

## 🛠️ Development

### Available Services

```typescript
import { AuthService } from '../lib/auth'
import { DatabaseService } from '../lib/database'

// Authentication
await AuthService.signIn(email, password)
await AuthService.signOut()
await AuthService.getCurrentUser()

// Database operations
await DatabaseService.getUsers()
await DatabaseService.getDoctors()
await DatabaseService.getSubscriptions()
await DatabaseService.getAppointments()
```

## 🔒 Security Notes

- All database operations use Row Level Security
- User data is isolated by authentication
- Admin users have elevated privileges
- Sensitive operations require authentication

## 📞 Support

For issues or questions about the Supabase integration, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Project issues and discussions
