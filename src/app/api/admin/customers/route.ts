import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saloon_customers")
    .select("id, name, phone, total_visits, last_visit_at, notes, created_at")
    .eq("tenant_id", TENANT_ID)
    .order("last_visit_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
