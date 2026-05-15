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

// POST — create a new booking (admin manual)
export async function POST(req: Request) {
  const { customer_name, customer_phone, service_id, staff_id, booking_date, booking_time, notes } =
    await req.json();

  if (!customer_name || !service_id || !booking_date || !booking_time)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  // Find or create customer by phone
  let customerId: string;
  if (customer_phone) {
    const { data: existingCustomer } = await supabaseAdmin
      .from("saloon_customers")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("phone", customer_phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error } = await supabaseAdmin
        .from("saloon_customers")
        .insert({ tenant_id: TENANT_ID, name: customer_name, phone: customer_phone })
        .select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      customerId = newCustomer.id;
    }
  } else {
    // No phone — always create new
    const { data: newCustomer, error } = await supabaseAdmin
      .from("saloon_customers")
      .insert({ tenant_id: TENANT_ID, name: customer_name, phone: null })
      .select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    customerId = newCustomer.id;
  }

  const { error } = await supabaseAdmin.from("saloon_bookings").insert({
    tenant_id:    TENANT_ID,
    customer_id:  customerId,
    service_id,
    staff_id:     staff_id || null,
    booking_date,
    booking_time,
    status:       "confirmed", // admin-created bookings are auto-confirmed
    notes:        notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
