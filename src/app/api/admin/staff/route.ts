import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saloon_staff")
    .select("id, name, phone, speciality, is_active")
    .eq("tenant_id", TENANT_ID)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { error } = await supabaseAdmin.from("saloon_staff").insert({
    tenant_id: TENANT_ID,
    name: body.name,
    phone: body.phone,
    speciality: body.speciality,
    is_active: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  const { error } = await supabaseAdmin
    .from("saloon_staff")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from("saloon_staff")
    .delete()
    .eq("id", id)
    .eq("tenant_id", TENANT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
