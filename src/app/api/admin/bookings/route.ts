import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saloon_bookings")
    .select(`
      id, booking_date, booking_time, status, notes, created_at,
      saloon_customers(id, name, phone),
      saloon_services(id, service_name, duration_minutes, price),
      saloon_staff(id, name)
    `)
    .eq("tenant_id", TENANT_ID)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json();
  const { error } = await supabaseAdmin
    .from("saloon_bookings")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
