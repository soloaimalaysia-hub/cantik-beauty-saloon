import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

// GET /api/admin/staff-leave?staff_id=xxx&year=2025&month=5
// Returns array of leave_date strings for that staff in that month
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const staff_id = searchParams.get("staff_id");
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  if (!staff_id) return NextResponse.json({ error: "staff_id required" }, { status: 400 });

  // First day and last day of the requested month
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabaseAdmin
    .from("staff_leave")
    .select("id, leave_date, reason")
    .eq("tenant_id", TENANT_ID)
    .eq("staff_id", staff_id)
    .gte("leave_date", from)
    .lte("leave_date", to)
    .order("leave_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST { staff_id, leave_date, reason? }
// Toggle: if date already exists → delete it; if not → insert it
export async function POST(req: Request) {
  const { staff_id, leave_date, reason } = await req.json();
  if (!staff_id || !leave_date)
    return NextResponse.json({ error: "staff_id and leave_date required" }, { status: 400 });

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from("staff_leave")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("staff_id", staff_id)
    .eq("leave_date", leave_date)
    .maybeSingle();

  if (existing) {
    // Already a leave day → remove it
    const { error } = await supabaseAdmin
      .from("staff_leave")
      .delete()
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "removed", leave_date });
  } else {
    // Not a leave day → mark it
    const { error } = await supabaseAdmin
      .from("staff_leave")
      .insert({ tenant_id: TENANT_ID, staff_id, leave_date, reason: reason ?? null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "added", leave_date });
  }
}

// DELETE { staff_id, leave_date }  — explicit removal (used by bulk clear)
export async function DELETE(req: Request) {
  const { staff_id, leave_date } = await req.json();
  if (!staff_id || !leave_date)
    return NextResponse.json({ error: "staff_id and leave_date required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("staff_leave")
    .delete()
    .eq("tenant_id", TENANT_ID)
    .eq("staff_id", staff_id)
    .eq("leave_date", leave_date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
