"use client";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  saloon_customers: { name: string; phone: string } | null;
  saloon_services: { service_name: string; price: number } | null;
  saloon_staff: { name: string } | null;
}

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((d) => { setBookings(d); setLoading(false); });
  };
  useEffect(load, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    load();
  }

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Bookings</h1>
          <p className="text-gray-500 text-sm">{bookings.length} total bookings</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === s
                ? "bg-[#B76E79] text-white shadow-sm"
                : "bg-white text-gray-500 border border-rose-100 hover:border-[#B76E79]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
            No bookings found
          </div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50 flex gap-4 items-start flex-wrap">
              {/* Date/Time */}
              <div className="bg-[#FFF5F7] rounded-xl p-3 text-center min-w-[60px]">
                <p className="text-xs text-[#B76E79] font-medium uppercase">
                  {new Date(b.booking_date).toLocaleDateString("en", { month: "short" })}
                </p>
                <p className="text-2xl font-bold text-[#2D1B1E] leading-tight">
                  {new Date(b.booking_date).getDate()}
                </p>
                <p className="text-xs text-gray-500">{b.booking_time?.slice(0, 5)}</p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2D1B1E]">{b.saloon_customers?.name ?? "—"}</p>
                <p className="text-sm text-gray-500">{b.saloon_customers?.phone}</p>
                <p className="text-sm text-[#8B4E57] mt-1">
                  {b.saloon_services?.service_name} · {b.saloon_staff?.name}
                  {b.saloon_services?.price ? ` · RM ${b.saloon_services.price}` : ""}
                </p>
              </div>

              {/* Status + Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_STYLE[b.status]}`}>
                  {b.status}
                </span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {b.status === "pending" && (
                    <button
                      onClick={() => updateStatus(b.id, "confirmed")}
                      disabled={updating === b.id}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => updateStatus(b.id, "completed")}
                      disabled={updating === b.id}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                    >
                      Complete
                    </button>
                  )}
                  {b.status !== "cancelled" && b.status !== "completed" && (
                    <button
                      onClick={() => updateStatus(b.id, "cancelled")}
                      disabled={updating === b.id}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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
