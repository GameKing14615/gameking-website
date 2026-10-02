export type StaffRole = 'floor_staff' | 'shift_lead' | 'supervisor' | 'manager' | 'maintenance' | 'admin_staff';
export type AttendanceStatus = 'clocked_in' | 'on_break' | 'clocked_out' | 'on_leave';
export type ShiftType = 'morning' | 'evening' | 'full_day' | 'custom' | 'off';
export type ExpenseCategory = 'maintenance' | 'cleaning' | 'gaming_hardware' | 'cafe_supplies' | 'utilities' | 'marketing' | 'other';

export interface StaffModel {
  id: string; // UUID
  full_name: string;
  pin: string;
  role: StaffRole;
  created_at?: string;
  active: boolean;
}

export interface AttendanceLogModel {
  id: string; // UUID
  staff_id: string;
  date: string; // YYYY-MM-DD
  clock_in: string | null; // ISO time
  clock_out: string | null; // ISO time
  total_minutes: number;
  status: AttendanceStatus;
  is_qualified: boolean;
  is_override: boolean;
  override_present: boolean;
}

export interface RosterAssignmentModel {
  id: string; // UUID
  staff_id: string;
  date: string; // YYYY-MM-DD
  shift_type: ShiftType;
  custom_start: string | null; // HH:MM
  custom_end: string | null; // HH:MM
}

export interface VendorModel {
  id: string; // UUID
  name: string;
  category: string | null;
  contact_info: string | null;
  color_hex: string | null;
}

export interface ExpenseModel {
  id: string; // UUID
  vendor_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string | null;
  recorded_by: string | null;
  created_at?: string;
}

export interface CleaningTaskModel {
  id: string; // UUID
  task_name: string;
  frequency: string;
  category: string;
}

export interface CleaningLogModel {
  id: string; // UUID
  task_id: string;
  staff_id: string;
  completed_at: string; // ISO timestamp
  status: string;
}
