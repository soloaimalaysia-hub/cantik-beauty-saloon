import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [todayRes, monthRes, pendingRes, recentRes] = await Promise.all([
    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .eq("booking_date", today)
      .neq("status", "cancelled"),

    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .gte("booking_date", firstOfMonth)
      .neq("status", "cancelled"),

    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .eq("status", "pending"),

    supabaseAdmin
      .from("saloon_bookings")
      .select(`
        id, booking_date, booking_time, status,
        saloon_customers(name, phone),
        saloon_services(service_name),
        saloon_staff(name)
      `)
      .eq("tenant_id", TENANT_ID)
      .neq("status", "cancelled")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(5),
  ]);

  return NextResponse.json({
    todayCount: todayRes.count ?? 0,
    monthCount: monthRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    recentBookings: recentRes.data ?? [],
  });
}
