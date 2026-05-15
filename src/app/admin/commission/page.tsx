"use client";
import { useEffect, useState } from "react";

interface StaffCommission {
  id: string;
  name: string;
  speciality: string | null;
  commission_rate: number;
  completed_bookings: number;
  revenue: number;
  commission: number;
}

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Use local date parts — avoid toISOString() which shifts timezone to UTC
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

export default function CommissionPage() {
  const months = getMonthOptions();
  const [month, setMonth] = useState(months[0].value);
  const [data, setData] = useState<StaffCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = (m: string) => {
    setLoading(true);
    fetch(`/api/admin/commission?month=${m}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(month); }, [month]);

  async function saveRate(id: string) {
    setSaving(true);
    await fetch("/api/admin/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, commission_rate: editRate }),
    });
    setEditingId(null);
    setSaving(false);
    load(month);
  }

  const totalRevenue    = data.reduce((s, d) => s + d.revenue, 0);
  const totalCommission = data.reduce((s, d) => s + d.commission, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Staff Commission</h1>
          <p className="text-gray-500 text-sm">Track earnings & commission by staff</p>
        </div>
        {/* Month picker */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-rose-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B76E79] bg-white"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-[#B76E79] to-[#8B4E57] rounded-2xl p-4 text-white shadow-md">
          <p className="text-white/70 text-xs">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">RM {totalRevenue.toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-1">Completed bookings</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-md">
          <p className="text-white/70 text-xs">Total Commission</p>
          <p className="text-2xl font-bold mt-1">RM {totalCommission.toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-1">All staff combined</p>
        </div>
        <div className="bg-gradient-to-br from-[#8B4E57] to-[#2D1B1E] rounded-2xl p-4 text-white shadow-md col-span-2 lg:col-span-1">
          <p className="text-white/70 text-xs">Net (After Commission)</p>
          <p className="text-2xl font-bold mt-1">RM {(totalRevenue - totalCommission).toFixed(2)}</p>
          <p className="text-white/60 text-xs mt-1">Salon earnings</p>
        </div>
      </div>

      {/* Staff table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
              No staff found
            </div>
          ) : (
            data.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50">
                <div className="flex flex-wrap items-start gap-4">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {s.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2D1B1E]">{s.name}</p>
                      <p className="text-xs text-gray-400 truncate">{s.speciality || "—"}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-center">
                    <div className="bg-rose-50 rounded-xl px-3 py-2 min-w-[70px]">
                      <p className="text-lg font-bold text-[#2D1B1E]">{s.completed_bookings}</p>
                      <p className="text-xs text-gray-400">Bookings</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl px-3 py-2 min-w-[80px]">
                      <p className="text-lg font-bold text-[#B76E79]">RM {s.revenue.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">Revenue</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-3 py-2 min-w-[80px]">
                      <p className="text-lg font-bold text-emerald-600">RM {s.commission.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Commission</p>
                    </div>
                  </div>

                  {/* Commission rate */}
                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          min={0}
                          max={100}
                          className="w-16 border border-rose-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
                        />
                        <span className="text-sm text-gray-500">%</span>
                        <button
                          onClick={() => saveRate(s.id)}
                          disabled={saving}
                          className="text-xs bg-[#B76E79] text-white px-3 py-1.5 rounded-lg hover:bg-[#8B4E57] transition-all disabled:opacity-60"
                        >
                          {saving ? "..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-50 text-purple-600 text-sm font-semibold px-3 py-1.5 rounded-xl">
                          {s.commission_rate}% comm.
                        </span>
                        <button
                          onClick={() => { setEditingId(s.id); setEditRate(String(s.commission_rate)); }}
                          className="text-xs text-gray-400 hover:text-[#B76E79] px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-gray-400 text-center pb-2">
        * Commission calculated from completed bookings only. Click &quot;Edit&quot; to update rate per staff.
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
