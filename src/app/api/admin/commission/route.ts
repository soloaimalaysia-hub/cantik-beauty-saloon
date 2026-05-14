import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

// GET: staff commission summary for a given month (YYYY-MM)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const firstDay = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).toISOString().split("T")[0];

  // 1. All active staff
  const { data: staffList, error: staffErr } = await supabaseAdmin
    .from("saloon_staff")
    .select("id, name, speciality, commission_rate")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("name");

  if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });

  // 2. Completed bookings this month — raw columns only (no join, avoids type issues)
  const { data: bookings, error: bookErr } = await supabaseAdmin
    .from("saloon_bookings")
    .select("staff_id, service_id")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "completed")
    .gte("booking_date", firstDay)
    .lte("booking_date", lastDay);

  if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });

  // 3. Service prices lookup
  const { data: services } = await supabaseAdmin
    .from("saloon_services")
    .select("id, price")
    .eq("tenant_id", TENANT_ID);

  const priceMap: Record<string, number> = {};
  for (const s of services ?? []) {
    priceMap[s.id] = Number(s.price);
  }

  // 4. Aggregate earnings per staff_id
  const earningsMap: Record<string, { count: number; revenue: number }> = {};
  for (const b of bookings ?? []) {
    if (!b.staff_id) continue;
    const price = priceMap[b.service_id ?? ""] ?? 0;
    if (!earningsMap[b.staff_id]) earningsMap[b.staff_id] = { count: 0, revenue: 0 };
    earningsMap[b.staff_id].count += 1;
    earningsMap[b.staff_id].revenue += price;
  }

  // 5. Build final result
  const result = (staffList ?? []).map((s) => {
    const earn = earningsMap[s.id] ?? { count: 0, revenue: 0 };
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
