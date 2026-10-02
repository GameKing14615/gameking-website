export enum StaffRole {
  FLOOR_STAFF = 'floor_staff',
  SHIFT_LEAD = 'shift_lead',
  SUPERVISOR = 'supervisor',
  MANAGER = 'manager',
  MAINTENANCE = 'maintenance',
  ADMIN_STAFF = 'admin_staff',
}

export enum AttendanceStatus {
  CLOCKED_IN = 'clocked_in',
  ON_BREAK = 'on_break',
  CLOCKED_OUT = 'clocked_out',
  ON_LEAVE = 'on_leave',
}

export enum ShiftType {
  MORNING = 'morning',
  EVENING = 'evening',
  FULL_DAY = 'full_day',
  CUSTOM = 'custom',
  OFF = 'off',
}

export enum AdminActionType {
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_PASSWORD_RESET_REQUEST = 'AUTH_PASSWORD_RESET_REQUEST',
  AUTH_PASSWORD_RESET_COMPLETE = 'AUTH_PASSWORD_RESET_COMPLETE',
  CREATE_ADMIN = 'CREATE_ADMIN',
  CREATE_STAFF = 'CREATE_STAFF',
  UPDATE_STAFF = 'UPDATE_STAFF',
  UPDATE_STAFF_PIN = 'UPDATE_STAFF_PIN',
  DELETE_STAFF = 'DELETE_STAFF',
  UPDATE_ROSTER = 'UPDATE_ROSTER',
  UPDATE_CLEANING = 'UPDATE_CLEANING',
  CREATE_EXPENSE = 'CREATE_EXPENSE',
  UPDATE_EXPENSE = 'UPDATE_EXPENSE',
  DELETE_EXPENSE = 'DELETE_EXPENSE',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
}

export enum ExpenseCategory {
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  GAMING_HARDWARE = 'gaming_hardware',
  CAFE_SUPPLIES = 'cafe_supplies',
  UTILITIES = 'utilities',
  MARKETING = 'marketing',
  OTHER = 'other',
}
