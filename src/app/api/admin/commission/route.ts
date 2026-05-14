import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

// GET: staff commission summary for a given month (YYYY-MM)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const firstDay = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).toISOString().split("T")[0];

  // 1. All active staff with commission rates
  const { data: staffList, error: staffErr } = await supabaseAdmin
    .from("saloon_staff")
    .select("id, name, speciality, commission_rate")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("name");

  if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });

  // 2. Use SQL RPC to get earnings — avoids all JS type issues with joins
  const { data: earnings, error: earnErr } = await supabaseAdmin.rpc("get_staff_earnings", {
    p_tenant_id: TENANT_ID,
    p_start: firstDay,
    p_end: lastDay,
  });

  if (earnErr) return NextResponse.json({ error: earnErr.message }, { status: 500 });

  // Build earnings lookup map: staff_id → { revenue, count }
  const earningsMap: Record<string, { revenue: number; count: number }> = {};
  for (const row of earnings ?? []) {
    earningsMap[row.staff_id] = {
      revenue: Number(row.revenue),
      count: Number(row.booking_count),
    };
  }

  // 3. Build final result — merge staff list with earnings
  const result = (staffList ?? []).map((s) => {
    const earn = earningsMap[s.id] ?? { revenue: 0, count: 0 };
    const commission = (earn.revenue * Number(s.commission_rate)) / 100;
    return {
      id: s.id,
      name: s.name,
      speciality: s.speciality,
      commission_rate: Number(s.commission_rate),
      completed_bookings: earn.count,
      revenue: earn.revenue,
      commission,
    };
  });

  return NextResponse.json(result);
}

// PATCH: update commission_rate for a staff member
export async function PATCH(req: Request) {
  const { id, commission_rate } = await req.json();
  if (!id || commission_rate === undefined) {
    return NextResponse.json({ error: "Missing id or commission_rate" }, { status: 400 });
  }
  const rate = Math.min(100, Math.max(0, Number(commission_rate)));
  const { error } = await supabaseAdmin
    .from("saloon_staff")
    .update({ commission_rate: rate })
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
