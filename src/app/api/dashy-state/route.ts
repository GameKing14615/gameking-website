import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  StaffModel,
  VendorModel,
  ExpenseModel,
  AttendanceLogModel,
  RosterAssignmentModel
} from "@/lib/models/schema";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({});

  const state: Record<string, unknown> = {};

  try {
    // 1. Fetch Relational Data
    const [
      { data: staffData },
      { data: vendorData },
      { data: expenseData },
      { data: attendanceData },
      { data: rosterData },
    ] = await Promise.all([
      supabaseAdmin.from("staff").select("*"),
      supabaseAdmin.from("vendors").select("*"),
      supabaseAdmin.from("expenses").select("*"),
      supabaseAdmin.from("attendance_logs").select("*"),
      supabaseAdmin.from("roster_assignments").select("*"),
    ]);

    // 2. Transform Relational Data -> Vanilla JS State Shape
    if (staffData) {
      state["dashy-staff-attendance-v3"] = staffData.map((s: StaffModel) => ({
        id: s.id,
        name: s.full_name,
        pin: s.pin,
        role: s.role,
        active: s.active,
      }));
    }

    if (vendorData && expenseData) {
      state["dashy-vendors-v2"] = vendorData.map((v: VendorModel) => ({
        id: v.id,
        name: v.name,
        category: v.category || "",
        contact: v.contact_info || "",
        color: v.color_hex || "",
        bills: expenseData
          .filter((e: ExpenseModel) => e.vendor_id === v.id)
          .map((e: ExpenseModel) => ({
            id: e.id,
            amount: e.amount,
            date: e.date,
            category: e.category,
            description: e.description || "",
          })),
      }));
    }

    if (attendanceData) {
      state["dashy-attendance-log-v1"] = attendanceData.map((a: AttendanceLogModel) => ({
        id: a.id,
        staffId: a.staff_id,
        date: a.date,
        clockInAt: a.clock_in ? new Date(a.clock_in).getTime() : null,
        clockOutAt: a.clock_out ? new Date(a.clock_out).getTime() : null,
        totalMinutes: a.total_minutes || 0,
        qualified: a.is_qualified,
      }));
    }

    if (rosterData) {
      const rosterDrafts: Record<string, any> = {};
      rosterData.forEach((r: RosterAssignmentModel) => {
        // Find the week start (app.js uses Monday dates as keys)
        // For simplicity, we dump all assignments back into the UI format
        // This is a naive translation for demonstration of the API mapping
        // In reality, roster logic needs specific date buckets
      });
      // Skip roster for now unless specifically needed by UI, 
      // fallback to dashy_state for non-relational keys
    }

    // 3. Fallback for non-relational settings (e.g. column widths, themes)
    const { data: legacyState } = await supabaseAdmin.from("dashy_state").select("key, value");
    for (const row of legacyState || []) {
      if (!state[row.key]) state[row.key] = row.value;
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("GET Relational Error:", error);
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ success: true });

  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    // ROUTE TO PROPER DATABASE TABLES BASED ON KEY
    switch (key) {
      case "dashy-staff-attendance-v3":
        const staffModels: StaffModel[] = value.map((v: any) => ({
          id: String(v.id),
          full_name: v.name,
          pin: v.pin,
          role: v.role,
          active: v.active !== false,
        }));
        const { error: staffErr } = await supabaseAdmin.from("staff").upsert(staffModels);
        if (staffErr) throw staffErr;
        
        // Also dump to dashy_state so GET can retrieve it exactly as requested
        await supabaseAdmin.from("dashy_state").upsert({ key, value, updated_at: new Date().toISOString() });
        break;

      case "dashy-vendors-v2":
        const vendorModels: VendorModel[] = [];
        const expenseModels: ExpenseModel[] = [];
        value.forEach((v: any) => {
          vendorModels.push({
            id: String(v.id),
            name: v.name,
            category: v.category,
            contact_info: v.contact,
            color_hex: v.color,
          });
          if (v.bills) {
            v.bills.forEach((b: any) => {
              expenseModels.push({
                id: String(b.id),
                vendor_id: String(v.id),
                amount: Number(b.amount) || 0,
                date: b.date,
                category: b.category || 'other',
                description: b.description,
                recorded_by: null,
              });
            });
          }
        });
        const { error: vendErr } = await supabaseAdmin.from("vendors").upsert(vendorModels);
        if (vendErr) throw vendErr;
        
        if (expenseModels.length > 0) {
          const { error: expErr } = await supabaseAdmin.from("expenses").upsert(expenseModels);
          if (expErr) throw expErr;
        }

        // Also dump to dashy_state
        await supabaseAdmin.from("dashy_state").upsert({ key, value, updated_at: new Date().toISOString() });
        break;

      case "dashy-attendance-log-v1":
        const attendanceModels: AttendanceLogModel[] = value.map((a: any) => ({
          id: String(a.id),
          staff_id: String(a.staffId),
          date: a.date,
          clock_in: a.clockInAt ? new Date(a.clockInAt).toISOString() : null,
          clock_out: a.clockOutAt ? new Date(a.clockOutAt).toISOString() : null,
          total_minutes: a.totalMinutes || 0,
          status: a.clockOutAt ? 'clocked_out' : 'clocked_in',
          is_qualified: a.qualified || false,
          is_override: false,
          override_present: false,
        }));
        const { error: attErr } = await supabaseAdmin.from("attendance_logs").upsert(attendanceModels);
        if (attErr) throw attErr;
        break;

      case "dashy-roster-published-v2":
      case "dashy-roster-drafts-v1":
        // value is a dictionary of weekStartDate -> array of shifts
        const rosterModels: RosterAssignmentModel[] = [];
        for (const weekStart of Object.keys(value)) {
          const shifts = value[weekStart];
          if (Array.isArray(shifts)) {
            shifts.forEach((s: any) => {
              rosterModels.push({
                id: `${s.staffId}-${s.date}`, // Unique predictable ID based on staff and date
                staff_id: String(s.staffId),
                date: s.date,
                shift_type: s.type, // 'shift', 'holiday', etc.
                custom_start: s.start || null,
                custom_end: s.end || null,
              });
            });
          }
        }
        if (rosterModels.length > 0) {
          const { error: rosterErr } = await supabaseAdmin.from("roster_assignments").upsert(rosterModels);
          if (rosterErr) throw rosterErr;
        }
        
        // Also save to dashy_state so the UI can rebuild exactly as it expects (week buckets)
        const { error: stateRosterErr } = await supabaseAdmin.from("dashy_state").upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });
        if (stateRosterErr) throw stateRosterErr;
        break;

      default:
        // Any other config keys just save to dashy_state
        const { error: legacyErr } = await supabaseAdmin.from("dashy_state").upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });
        if (legacyErr) throw legacyErr;
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST Relational Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid payload or database permission denied" }, { status: 500 });
  }
}

