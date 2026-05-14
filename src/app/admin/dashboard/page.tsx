"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  saloon_customers: { name: string; phone: string } | null;
  saloon_services: { service_name: string } | null;
  saloon_staff: { name: string } | null;
}

interface BreakdownItem {
  name: string;
  revenue: number;
  count: number;
}

interface DashboardData {
  todayCount: number;
  monthCount: number;
  pendingCount: number;
  todayRevenue: number;
  monthRevenue: number;
  serviceBreakdown: BreakdownItem[];
  staffBreakdown: BreakdownItem[];
  recentBookings: RecentBooking[];
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

  const d = data!;
  const maxServiceRev = Math.max(...d.serviceBreakdown.map((s) => s.revenue), 1);
  const maxStaffRev   = Math.max(...d.staffBreakdown.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats — 2 rows: bookings + revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="📅" label="Today's Bookings" value={d.todayCount}        color="from-[#B76E79] to-[#8B4E57]" />
        <StatCard icon="📆" label="Month Bookings"   value={d.monthCount}        color="from-[#8B4E57] to-[#2D1B1E]" />
        <StatCard icon="⏳" label="Pending"          value={d.pendingCount}      color="from-amber-400 to-amber-600" />
        <StatCard icon="💰" label="Today Revenue"    value={`RM ${Number(d.todayRevenue).toFixed(0)}`} color="from-emerald-500 to-teal-600" />
      </div>

      {/* Month revenue highlight */}
      <div className="bg-gradient-to-r from-[#B76E79] to-[#8B4E57] rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
        <div>
          <p className="text-white/70 text-sm">This Month Revenue</p>
          <p className="text-4xl font-bold mt-1">RM {Number(d.monthRevenue).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</p>
          <p className="text-white/60 text-xs mt-1">From {d.monthCount} bookings (completed only)</p>
        </div>
        <div className="text-6xl opacity-30">💅</div>
      </div>

      {/* Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Service Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-base font-semibold text-[#2D1B1E]">Revenue by Service</h2>
            <span className="text-xs text-gray-400">This month</span>
          </div>
          {d.serviceBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No completed bookings yet</p>
          ) : (
            <div className="space-y-3">
              {d.serviceBreakdown.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[#2D1B1E] font-medium truncate flex-1 mr-2">{s.name}</span>
                    <span className="text-[#B76E79] font-semibold shrink-0">RM {Number(s.revenue).toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-rose-50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#B76E79] to-[#E8A0A9] h-2 rounded-full transition-all"
                      style={{ width: `${(s.revenue / maxServiceRev) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.count} bookings</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-base font-semibold text-[#2D1B1E]">Revenue by Staff</h2>
            <Link href="/admin/commission" className="text-xs text-[#B76E79] hover:underline">
              Commission →
            </Link>
          </div>
          {d.staffBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No completed bookings yet</p>
          ) : (
            <div className="space-y-3">
              {d.staffBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-[#2D1B1E] truncate">{s.name}</span>
                      <span className="text-[#B76E79] font-semibold shrink-0 ml-2">RM {Number(s.revenue).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-rose-50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#8B4E57] to-[#B76E79] h-2 rounded-full transition-all"
                        style={{ width: `${(s.revenue / maxStaffRev) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.count} completed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100">
        <div className="p-5 border-b border-rose-100 flex items-center justify-between">
          <h2 className="font-playfair text-lg font-semibold text-[#2D1B1E]">Upcoming Bookings</h2>
          <a href="/admin/bookings" className="text-[#B76E79] text-sm hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-rose-50">
          {d.recentBookings.length === 0 ? (
            <p className="p-6 text-gray-400 text-center text-sm">No upcoming bookings</p>
          ) : (
            d.recentBookings.map((b) => (
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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-md`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl lg:text-3xl font-bold leading-tight">{value}</div>
      <div className="text-white/75 text-xs mt-1">{label}</div>
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
