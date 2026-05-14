import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("saloon_website_sections")
    .select("id, section_key, label, icon, position, is_visible")
    .eq("tenant_id", TENANT_ID)
    .order("position");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: save full sections array (position + visibility)
export async function POST(req: Request) {
  const sections: { id: string; position: number; is_visible: boolean }[] = await req.json();
  const updates = sections.map((s) =>
    supabaseAdmin
      .from("saloon_website_sections")
      .update({ position: s.position, is_visible: s.is_visible })
      .eq("id", s.id)
      .eq("tenant_id", TENANT_ID)
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error);
  if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
