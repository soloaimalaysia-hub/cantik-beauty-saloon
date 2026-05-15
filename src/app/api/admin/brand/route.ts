import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

const FIELDS = "business_name,slogan,logo_url,brand_color_primary,brand_color_secondary,whatsapp,address,operating_hours";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(FIELDS)
    .eq("id", TENANT_ID)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const allowed = [
    "business_name","slogan","logo_url",
    "brand_color_primary","brand_color_secondary",
    "whatsapp","address","operating_hours",
  ];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const { error } = await supabaseAdmin
    .from("tenants")
    .update(updates)
    .eq("id", TENANT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/"); // immediately refresh landing page cache
  return NextResponse.json({ ok: true });
}
