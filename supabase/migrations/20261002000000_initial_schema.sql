-- 1. Create Enums
CREATE TYPE staff_role_enum AS ENUM (
  'floor_staff',
  'shift_lead',
  'supervisor',
  'manager',
  'maintenance',
  'admin_staff'
);

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

CREATE TYPE admin_action_enum AS ENUM (
  'AUTH_LOGIN',
  'AUTH_LOGOUT',
  'AUTH_PASSWORD_RESET_REQUEST',
  'AUTH_PASSWORD_RESET_COMPLETE',
  'CREATE_ADMIN',
  'CREATE_STAFF',
  'UPDATE_STAFF',
  'UPDATE_STAFF_PIN',
  'DELETE_STAFF',
  'UPDATE_ROSTER',
  'UPDATE_CLEANING',
  'CREATE_EXPENSE',
  'UPDATE_EXPENSE',
  'DELETE_EXPENSE',
  'UPDATE_SETTINGS'
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

-- 2. Admin Accounts (With embedded access/refresh/reset tokens)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt (salt rounds: 12)
  is_primary_admin BOOLEAN DEFAULT false,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  refresh_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  admin_username TEXT NOT NULL,
  action_type admin_action_enum NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff Profiles (Plaintext PINs for Admin Viewing/Editing)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  pin TEXT NOT NULL, -- 4-digit plaintext PIN (e.g. '1111')
  role staff_role_enum NOT NULL DEFAULT 'floor_staff',
  current_status attendance_status_enum NOT NULL DEFAULT 'clocked_out',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Punch Logs
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  action attendance_status_enum NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT
);

-- 6. Weekly Shift Roster
CREATE TABLE roster_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL, -- Monday of ISO week
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  shift_type shift_type_enum NOT NULL DEFAULT 'morning',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bathroom Cleaning Schedule
CREATE TABLE cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. "12:00 PM", "04:00 PM", "08:00 PM"
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vendors & Expense Ledger
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category expense_category_enum NOT NULL DEFAULT 'other',
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount_npr NUMERIC(12, 2) NOT NULL, -- Currency in Rs (Nepalese Rupees)
  category expense_category_enum NOT NULL DEFAULT 'other',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  line_items JSONB DEFAULT '[]'::jsonb, -- e.g. [{"desc": "HDMI Cables", "qty": 3, "rate": 500, "total": 1500}]
  notes TEXT,
  paid_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS dashy_state ( key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL );
