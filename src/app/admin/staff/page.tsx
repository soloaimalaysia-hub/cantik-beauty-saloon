"use client";
import { useEffect, useState, useCallback } from "react";

interface Staff {
  id: string;
  name: string;
  phone: string;
  speciality: string;
  is_active: boolean;
}

interface LeaveRecord {
  id: string;
  leave_date: string;
  reason: string | null;
}

const EMPTY = { name: "", phone: "", speciality: "" };
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const days: Date[] = [];
  for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  const rem = days.length % 7;
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) days.push(new Date(year, month + 1, i));
  return days;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff, setStaff]     = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [leaveStaff, setLeaveStaff] = useState<Staff | null>(null); // which staff's leave modal is open

  const load = () =>
    fetch("/api/admin/staff").then(r => r.json()).then(d => { setStaff(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      setEditing(null);
    } else {
      await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(EMPTY);
    setSaving(false);
    load();
  }

  async function del(id: string) {
    if (!confirm("Remove this staff member?")) return;
    await fetch("/api/admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(s: Staff) {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone ?? "", speciality: s.speciality ?? "" });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Staff</h1>
        <p className="text-gray-500 text-sm">{staff.length} team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Add / Edit Form ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100">
          <h2 className="font-semibold text-[#2D1B1E] mb-4">
            {editing ? "✏️ Edit Staff" : "➕ Add Staff"}
          </h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                required className={inp} placeholder="e.g. Siti" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className={inp} placeholder="e.g. 0123456789" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Speciality</label>
              <input value={form.speciality} onChange={e => setForm({ ...form, speciality: e.target.value })}
                className={inp} placeholder="e.g. Hair Colouring & Styling" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 bg-[#B76E79] hover:bg-[#8B4E57] text-white text-sm font-medium py-2 rounded-xl transition-all disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update" : "Add Staff"}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }}
                  className="px-4 py-2 border border-rose-200 text-gray-500 text-sm rounded-xl hover:bg-rose-50 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Staff Cards ── */}
        <div className="lg:col-span-2 space-y-3">
          {staff.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
              No staff yet — add your first team member!
            </div>
          )}
          {staff.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50 flex items-center gap-4 flex-wrap">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white font-bold shrink-0 text-lg">
                {s.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2D1B1E]">{s.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {s.speciality || "—"}{s.phone ? ` · ${s.phone}` : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button onClick={() => setLeaveStaff(s)}
                  className="text-xs px-3 py-1.5 bg-rose-50 text-[#B76E79] rounded-lg hover:bg-rose-100 transition-all font-medium">
                  🏖️ 休假
                </button>
                <button onClick={() => startEdit(s)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                  Edit
                </button>
                <button onClick={() => del(s.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leave Modal ── */}
      {leaveStaff && (
        <LeaveModal staff={leaveStaff} onClose={() => setLeaveStaff(null)} />
      )}
    </div>
  );
}

// ── Leave Modal ───────────────────────────────────────────────────────────────
function LeaveModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth() + 1); // 1-based
  const [leaves, setLeaves] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadLeaves = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/staff-leave?staff_id=${staff.id}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((data: LeaveRecord[]) => {
        setLeaves(new Set(data.map(d => d.leave_date)));
        setLoading(false);
      });
  }, [staff.id, year, month]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  async function toggleDate(dateStr: string) {
    setToggling(dateStr);
    // Optimistic update
    setLeaves(prev => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });

    await fetch("/api/admin/staff-leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staff.id, leave_date: dateStr }),
    });
    setToggling(null);
  }

  function navigate(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  const monthDays = getMonthDays(year, month - 1); // month is 1-based, getMonthDays needs 0-based
  const currentMonthNum = month - 1;
  const todayStr = localDateStr(today);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  const leaveCount = leaves.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white font-bold">
              {staff.name[0]}
            </div>
            <div>
              <p className="font-semibold text-[#2D1B1E]">{staff.name}</p>
              <p className="text-xs text-gray-400">
                🏖️ 休假管理 · {leaveCount > 0 ? `${leaveCount} hari cuti bulan ini` : "Tiada cuti"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all text-sm">
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-500 hover:text-[#B76E79] transition-all text-xl leading-none">
              ‹
            </button>
            <span className="font-semibold text-[#2D1B1E] text-sm">{monthLabel}</span>
            <button onClick={() => navigate(1)}
              className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-500 hover:text-[#B76E79] transition-all text-xl leading-none">
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-3 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, i) => {
                const ds = localDateStr(day);
                const inMonth = day.getMonth() === currentMonthNum;
                const isLeave = leaves.has(ds);
                const isToday = ds === todayStr;
                const isToggling = toggling === ds;
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <button key={i} onClick={() => inMonth && toggleDate(ds)}
                    disabled={!inMonth || isToggling}
                    className={`
                      aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all relative
                      ${!inMonth ? "opacity-20 cursor-default" : "cursor-pointer"}
                      ${isLeave
                        ? "bg-red-500 text-white shadow-sm hover:bg-red-600"
                        : isToday
                        ? "bg-[#B76E79] text-white"
                        : isPast && inMonth
                        ? "bg-gray-50 text-gray-400 hover:bg-red-100"
                        : inMonth
                        ? "bg-rose-50 text-[#2D1B1E] hover:bg-red-100"
                        : ""}
                      ${isToggling ? "opacity-60" : ""}
                    `}>
                    {day.getDate()}
                    {isLeave && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>休假 (cuti)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#B76E79]" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-50 border border-rose-200" />
              <span>点击标记/取消</span>
            </div>
          </div>

          {/* Summary */}
          {leaveCount > 0 && (
            <div className="mt-3 bg-red-50 rounded-xl p-3 text-xs text-red-600">
              ⚠️ {staff.name} 这个月有 <strong>{leaveCount} 天</strong>休假
              {" · "}预约系统会自动显示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = "w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
