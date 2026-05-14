import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [todayRes, monthRes, pendingRes, recentRes, completedMonthRes, completedTodayRes] =
    await Promise.all([
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
        .select(`id, booking_date, booking_time, status,
          saloon_customers(name, phone),
          saloon_services(service_name),
          saloon_staff(name)`)
        .eq("tenant_id", TENANT_ID)
        .neq("status", "cancelled")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true })
        .limit(5),

      // Completed this month — for revenue/breakdown
      supabaseAdmin
        .from("saloon_bookings")
        .select(`staff_id, saloon_services(service_name, price), saloon_staff(name)`)
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .gte("booking_date", firstOfMonth),

      // Completed today — for today revenue
      supabaseAdmin
        .from("saloon_bookings")
        .select(`saloon_services(price)`)
        .eq("tenant_id", TENANT_ID)
        .eq("status", "completed")
        .eq("booking_date", today),
    ]);

  // ── Revenue calculations ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayRevenue = (completedTodayRes.data ?? []).reduce((sum: number, b: any) => {
    return sum + Number(b?.saloon_services?.price ?? 0);
  }, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthRevenue = (completedMonthRes.data ?? []).reduce((sum: number, b: any) => {
    return sum + Number(b?.saloon_services?.price ?? 0);
  }, 0);

  // ── Service breakdown ─────────────────────────────────
  const serviceMap: Record<string, { name: string; revenue: number; count: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (completedMonthRes.data ?? []) as any[]) {
    const name: string = b?.saloon_services?.service_name;
    const price: number = Number(b?.saloon_services?.price ?? 0);
    if (!name) continue;
    if (!serviceMap[name]) serviceMap[name] = { name, revenue: 0, count: 0 };
    serviceMap[name].revenue += price;
    serviceMap[name].count += 1;
  }
  const serviceBreakdown = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // ── Staff breakdown ───────────────────────────────────
  const staffMap: Record<string, { name: string; revenue: number; count: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (completedMonthRes.data ?? []) as any[]) {
    const name: string = b?.saloon_staff?.name;
    const price: number = Number(b?.saloon_services?.price ?? 0);
    if (!name) continue;
    if (!staffMap[name]) staffMap[name] = { name, revenue: 0, count: 0 };
    staffMap[name].revenue += price;
    staffMap[name].count += 1;
  }
  const staffBreakdown = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    todayCount:      todayRes.count ?? 0,
    monthCount:      monthRes.count ?? 0,
    pendingCount:    pendingRes.count ?? 0,
    todayRevenue,
    monthRevenue,
    serviceBreakdown,
    staffBreakdown,
    recentBookings:  recentRes.data ?? [],
  });
}
