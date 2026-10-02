import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({});
  }
  
  const { data, error } = await supabaseAdmin.from("dashy_state").select("key, value");
  if (error) {
    console.error("Error fetching dashy_state:", error);
    return NextResponse.json({});
  }

  const state: Record<string, unknown> = {};
  for (const row of data || []) {
    state[row.key] = row.value;
  }
  
  return NextResponse.json(state);
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

    const { error } = await supabaseAdmin.from("dashy_state").upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error("Error upserting dashy_state:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
