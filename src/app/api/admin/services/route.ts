import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saloon_services")
    .select("id, service_name, duration_minutes, price, is_active")
    .eq("tenant_id", TENANT_ID)
    .order("service_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { error } = await supabaseAdmin.from("saloon_services").insert({
    tenant_id: TENANT_ID,
    service_name: body.service_name,
    duration_minutes: body.duration_minutes,
    price: body.price,
    is_active: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  const { error } = await supabaseAdmin
    .from("saloon_services")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from("saloon_services")
    .delete()
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
