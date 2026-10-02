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
      state["dashy-staff-v1"] = staffData.map((s: StaffModel) => ({
        id: s.id,
        name: s.full_name,
        pin: s.pin,
        role: s.role,
        active: s.active,
      }));
    }

    if (vendorData && expenseData) {
      state["dashy-vendors-v1"] = vendorData.map((v: VendorModel) => ({
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
      case "dashy-staff-v1":
        const staffModels: StaffModel[] = value.map((v: any) => ({
          id: v.id,
          full_name: v.name,
          pin: v.pin,
          role: v.role,
          active: v.active !== false,
        }));
        await supabaseAdmin.from("staff").upsert(staffModels);
        break;

      case "dashy-vendors-v1":
        const vendorModels: VendorModel[] = [];
        const expenseModels: ExpenseModel[] = [];
        value.forEach((v: any) => {
          vendorModels.push({
            id: v.id,
            name: v.name,
            category: v.category,
            contact_info: v.contact,
            color_hex: v.color,
          });
          if (v.bills) {
            v.bills.forEach((b: any) => {
              expenseModels.push({
                id: b.id,
                vendor_id: v.id,
                amount: Number(b.amount) || 0,
                date: b.date,
                category: b.category || 'other',
                description: b.description,
                recorded_by: null,
              });
            });
          }
        });
        await supabaseAdmin.from("vendors").upsert(vendorModels);
        if (expenseModels.length > 0) {
          await supabaseAdmin.from("expenses").upsert(expenseModels);
        }
        break;

      case "dashy-attendance-log-v1":
        const attendanceModels: AttendanceLogModel[] = value.map((a: any) => ({
          id: a.id,
          staff_id: a.staffId,
          date: a.date,
          clock_in: a.clockInAt ? new Date(a.clockInAt).toISOString() : null,
          clock_out: a.clockOutAt ? new Date(a.clockOutAt).toISOString() : null,
          total_minutes: a.totalMinutes || 0,
          status: a.clockOutAt ? 'clocked_out' : 'clocked_in',
          is_qualified: a.qualified || false,
          is_override: false,
          override_present: false,
        }));
        await supabaseAdmin.from("attendance_logs").upsert(attendanceModels);
        break;

      default:
        // Any other config keys just save to dashy_state
        await supabaseAdmin.from("dashy_state").upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST Relational Error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
