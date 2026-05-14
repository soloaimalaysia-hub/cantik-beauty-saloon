import { NextResponse } from "next/server";
import { supabaseAdmin, TENANT_ID } from "@/lib/supabase-server";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [todayRes, monthRes, pendingRes, recentRes, completedMonthRes] = await Promise.all([
    // Today bookings count
    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .eq("booking_date", today)
      .neq("status", "cancelled"),

    // Month bookings count
    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .gte("booking_date", firstOfMonth)
      .neq("status", "cancelled"),

    // Pending count
    supabaseAdmin
      .from("saloon_bookings")
      .select("id", { count: "exact" })
      .eq("tenant_id", TENANT_ID)
      .eq("status", "pending"),

    // Recent upcoming bookings
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

    // Completed bookings this month with service prices + staff
    supabaseAdmin
      .from("saloon_bookings")
      .select(`
        id, booking_date,
        saloon_services(service_name, price),
        saloon_staff(id, name)
      `)
      .eq("tenant_id", TENANT_ID)
      .eq("status", "completed")
      .gte("booking_date", firstOfMonth),
  ]);

  // Completed bookings today for revenue
  const { data: completedTodayData } = await supabaseAdmin
    .from("saloon_bookings")
    .select("saloon_services(price)")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "completed")
    .eq("booking_date", today);

  // Calculate today revenue
  const todayRevenue = (completedTodayData ?? []).reduce((sum: number, b: { saloon_services: { price: number } | null }) => {
    return sum + (b.saloon_services?.price ?? 0);
  }, 0);

  const completedMonth = completedMonthRes.data ?? [];

  // Calculate month revenue
  const monthRevenue = completedMonth.reduce((sum: number, b: { saloon_services: { service_name: string; price: number } | null; saloon_staff: { id: string; name: string } | null }) => {
    return sum + (b.saloon_services?.price ?? 0);
  }, 0);

  // Service breakdown
  const serviceMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const b of completedMonth) {
    const svc = b.saloon_services as { service_name: string; price: number } | null;
    if (!svc) continue;
    if (!serviceMap[svc.service_name]) {
      serviceMap[svc.service_name] = { name: svc.service_name, revenue: 0, count: 0 };
    }
    serviceMap[svc.service_name].revenue += Number(svc.price);
    serviceMap[svc.service_name].count += 1;
  }
  const serviceBreakdown = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Staff breakdown
  const staffMap: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const b of completedMonth) {
    const staff = b.saloon_staff as { id: string; name: string } | null;
    const svc = b.saloon_services as { price: number } | null;
    if (!staff) continue;
    if (!staffMap[staff.name]) {
      staffMap[staff.name] = { name: staff.name, revenue: 0, count: 0 };
    }
    staffMap[staff.name].revenue += Number(svc?.price ?? 0);
    staffMap[staff.name].count += 1;
  }
  const staffBreakdown = Object.values(staffMap)
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    todayCount: todayRes.count ?? 0,
    monthCount: monthRes.count ?? 0,
    pendingCount: pendingRes.count ?? 0,
    todayRevenue,
    monthRevenue,
    serviceBreakdown,
    staffBreakdown,
    recentBookings: recentRes.data ?? [],
  });
}
