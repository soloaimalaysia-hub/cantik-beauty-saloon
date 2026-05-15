import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

// GET /api/admin/bookings/conflict
// ?staff_id=xxx&booking_date=2026-05-15&booking_time=10:00&exclude_id=xxx
//
// Returns:
// { has_conflict: bool, conflicts: [{ type: "booking"|"leave", message }] }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const staff_id    = searchParams.get("staff_id");
  const booking_date = searchParams.get("booking_date");
  const booking_time = searchParams.get("booking_time");
  const exclude_id  = searchParams.get("exclude_id"); // skip when editing existing booking

  if (!staff_id || !booking_date || !booking_time)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const conflicts: { type: string; message: string }[] = [];

  // ── 1. Check staff leave ────────────────────────────────────────────
  const { data: leave } = await supabaseAdmin
    .from("staff_leave")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("staff_id", staff_id)
    .eq("leave_date", booking_date)
    .maybeSingle();

  if (leave) {
    const { data: s } = await supabaseAdmin
      .from("saloon_staff").select("name").eq("id", staff_id).single();
    conflicts.push({
      type: "leave",
      message: `${s?.name ?? "Staff"} is on leave on ${booking_date}`,
    });
  }

  // ── 2. Check booking overlap ────────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from("saloon_bookings")
    .select(`
      id, booking_time,
      saloon_customers(name),
      saloon_services(service_name, duration_minutes)
    `)
    .eq("tenant_id", TENANT_ID)
    .eq("staff_id", staff_id)
    .eq("booking_date", booking_date)
    .neq("status", "cancelled");

  const [ih, im] = booking_time.split(":").map(Number);
  const newStart = ih * 60 + im;
  const newEnd   = newStart + 60; // assume 60 min for new booking

  for (const b of existing ?? []) {
    if (exclude_id && b.id === exclude_id) continue;

    const [bh, bm] = (b.booking_time as string).split(":").map(Number);
    const existStart = bh * 60 + bm;
    const existDur   = (b.saloon_services as { duration_minutes?: number } | null)?.duration_minutes ?? 60;
    const existEnd   = existStart + existDur;

    // Overlap: newStart < existEnd AND existStart < newEnd
    if (newStart < existEnd && existStart < newEnd) {
      const custName = (b.saloon_customers as { name?: string } | null)?.name ?? "customer";
      const svcName  = (b.saloon_services  as { service_name?: string } | null)?.service_name ?? "service";
      conflicts.push({
        type: "booking",
        message: `Already booked at ${(b.booking_time as string).slice(0, 5)} for ${custName} (${svcName})`,
      });
    }
  }

  return NextResponse.json({ has_conflict: conflicts.length > 0, conflicts });
}
