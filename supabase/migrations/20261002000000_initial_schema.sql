-- 1. Create Enums
CREATE TYPE attendance_status_enum AS ENUM (
  'clocked_in',
  'on_break',
  'clocked_out',
  'on_leave'
);

CREATE TYPE shift_type_enum AS ENUM (
  'morning',
  'evening',
  'full_day',
  'custom',
  'off'
);

CREATE TYPE expense_category_enum AS ENUM (
  'maintenance',
  'cleaning',
  'gaming_hardware',
  'cafe_supplies',
  'utilities',
  'marketing',
  'other'
);

-- 2. Admin Accounts
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_primary_admin BOOLEAN DEFAULT false,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff Profiles (IDs as TEXT to match Vanilla JS increment IDs)
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  active BOOLEAN DEFAULT true
);

-- 5. Attendance
CREATE TABLE attendance_logs (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_minutes INTEGER DEFAULT 0,
  status attendance_status_enum DEFAULT 'clocked_in',
  is_qualified BOOLEAN DEFAULT false,
  is_override BOOLEAN DEFAULT false,
  override_present BOOLEAN DEFAULT false
);

-- 6. Rosters & Shifts
CREATE TABLE roster_assignments (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT DEFAULT 'morning',
  custom_start TIME,
  custom_end TIME,
  UNIQUE(staff_id, date)
);

-- 7. Cleaning Schedule
CREATE TABLE cleaning_tasks (
  id TEXT PRIMARY KEY,
  task_name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE cleaning_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
  staff_id TEXT REFERENCES staff(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  status TEXT DEFAULT 'completed'
);

-- 8. Vendors & Expenses
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  contact_info TEXT,
  color_hex TEXT
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT DEFAULT 'other',
  description TEXT,
  recorded_by TEXT REFERENCES admins(username) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 9. Key-Value Sync State Store
CREATE TABLE IF NOT EXISTS dashy_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
