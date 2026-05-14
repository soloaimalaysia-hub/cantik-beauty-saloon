"use client";
import { useEffect, useState } from "react";

interface DashboardData {
  todayCount: number;
  monthCount: number;
  pendingCount: number;
  recentBookings: RecentBooking[];
}

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  saloon_customers: { name: string; phone: string } | null;
  saloon_services: { service_name: string } | null;
  saloon_staff: { name: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = [
    { label: "Today's Bookings", value: data!.todayCount, icon: "📅", color: "from-[#B76E79] to-[#8B4E57]" },
    { label: "This Month",       value: data!.monthCount, icon: "📆", color: "from-[#8B4E57] to-[#2D1B1E]" },
    { label: "Pending",          value: data!.pendingCount, icon: "⏳", color: "from-amber-400 to-amber-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-4xl font-bold mb-1">{s.value}</div>
            <div className="text-white/80 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100">
        <div className="p-5 border-b border-rose-100 flex items-center justify-between">
          <h2 className="font-playfair text-lg font-semibold text-[#2D1B1E]">Upcoming Bookings</h2>
          <a href="/admin/bookings" className="text-[#B76E79] text-sm hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-rose-50">
          {data!.recentBookings.length === 0 ? (
            <p className="p-6 text-gray-400 text-center text-sm">No upcoming bookings</p>
          ) : (
            data!.recentBookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D1B1E] text-sm truncate">
                    {b.saloon_customers?.name ?? "Unknown"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {b.saloon_services?.service_name} · {b.saloon_staff?.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-[#2D1B1E]">
                    {new Date(b.booking_date).toLocaleDateString("en-MY", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-gray-400">{b.booking_time?.slice(0, 5)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[b.status]}`}>
                  {b.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
