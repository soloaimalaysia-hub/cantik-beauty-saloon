"use client";
import { useEffect, useState, useMemo } from "react";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  saloon_customers: { name: string; phone: string } | null;
  saloon_services: { service_name: string; duration_minutes: number; price: number } | null;
  saloon_staff: { name: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#22c55e",
  pending:   "#f59e0b",
  completed: "#9ca3af",
  cancelled: "#ef4444",
};

const STATUS_BG: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9am–9pm

// ── Helpers ──────────────────────────────────────────────────────────────────
function localDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const days: Date[] = [];

  // Leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  // Trailing days to complete grid
  const rem = days.length % 7;
  if (rem > 0) for (let i = 1; i <= 7 - rem; i++) days.push(new Date(year, month + 1, i));

  return days;
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState<"list" | "calendar">("list");
  const [calMode, setCalMode]     = useState<"month" | "week" | "day">("month");
  const [current, setCurrent]     = useState(new Date());
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filter, setFilter]       = useState("all");
  const [updating, setUpdating]   = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/bookings")
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(load, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    // Optimistic update on modal
    setSelected(prev => prev?.id === id ? { ...prev, status: status as Booking["status"] } : prev);
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    load();
  }

  // Group bookings by date string
  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) (map[b.booking_date] ??= []).push(b);
    return map;
  }, [bookings]);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  // Calendar navigation
  function navigate(dir: -1 | 1) {
    const d = new Date(current);
    if (calMode === "month")     d.setMonth(d.getMonth() + dir);
    else if (calMode === "week") d.setDate(d.getDate() + dir * 7);
    else                         d.setDate(d.getDate() + dir);
    setCurrent(d);
  }

  function navLabel() {
    if (calMode === "month") return current.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
    if (calMode === "week") {
      const days = getWeekDays(current);
      return `${days[0].toLocaleDateString("en-MY", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return current.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  const todayStr   = localDateStr(new Date());
  const monthDays  = useMemo(() => getMonthDays(current.getFullYear(), current.getMonth()), [current]);
  const weekDays   = useMemo(() => getWeekDays(current), [current]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Bookings</h1>
        <p className="text-gray-500 text-sm">{bookings.length} total bookings</p>
      </div>

      {/* ── View Toggle ── */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-rose-100 shadow-sm w-fit">
        <button onClick={() => setView("list")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "list" ? "bg-[#B76E79] text-white shadow-sm" : "text-gray-500 hover:text-[#B76E79]"}`}>
          📋 List
        </button>
        <button onClick={() => setView("calendar")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "calendar" ? "bg-[#B76E79] text-white shadow-sm" : "text-gray-500 hover:text-[#B76E79]"}`}>
          📅 Calendar
        </button>
      </div>

      {/* ══════════════ LIST VIEW ══════════════ */}
      {view === "list" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filter === s ? "bg-[#B76E79] text-white shadow-sm" : "bg-white text-gray-500 border border-rose-100 hover:border-[#B76E79]"}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">No bookings found</div>
            ) : filtered.map(b => (
              <BookingCard key={b.id} booking={b} updating={updating} onSelect={() => setSelected(b)} onUpdate={updateStatus} />
            ))}
          </div>
        </>
      )}

      {/* ══════════════ CALENDAR VIEW ══════════════ */}
      {view === "calendar" && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-rose-50 flex-wrap gap-3">
            {/* Mode toggle */}
            <div className="flex gap-1 bg-rose-50 rounded-xl p-1">
              {(["month", "week", "day"] as const).map(m => (
                <button key={m} onClick={() => setCalMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${calMode === m ? "bg-[#B76E79] text-white shadow-sm" : "text-gray-500 hover:text-[#B76E79]"}`}>
                  {m}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-500 hover:text-[#B76E79] transition-all text-lg leading-none">‹</button>
              <span className="font-semibold text-[#2D1B1E] text-sm min-w-[190px] text-center">{navLabel()}</span>
              <button onClick={() => navigate(1)}
                className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-gray-500 hover:text-[#B76E79] transition-all text-lg leading-none">›</button>
            </div>

            <button onClick={() => setCurrent(new Date())}
              className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-[#B76E79] hover:bg-rose-50 transition-all">
              Today
            </button>
          </div>

          {/* Calendar body */}
          {calMode === "month" && (
            <MonthView days={monthDays} byDate={byDate} todayStr={todayStr}
              currentMonth={current.getMonth()} onSelect={setSelected} />
          )}
          {calMode === "week" && (
            <WeekView days={weekDays} byDate={byDate} todayStr={todayStr} onSelect={setSelected} />
          )}
          {calMode === "day" && (
            <DayView bookings={byDate[localDateStr(current)] ?? []} onSelect={setSelected} />
          )}

          {/* Legend */}
          <div className="flex gap-5 px-4 py-3 border-t border-rose-50 flex-wrap">
            {STATUSES.map(s => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[s] }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <BookingModal booking={selected} updating={updating}
          onClose={() => setSelected(null)} onUpdate={updateStatus} />
      )}
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────
function MonthView({ days, byDate, todayStr, currentMonth, onSelect }: {
  days: Date[];
  byDate: Record<string, Booking[]>;
  todayStr: string;
  currentMonth: number;
  onSelect: (b: Booking) => void;
}) {
  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-rose-50">
        {DOW_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const ds = localDateStr(day);
          const dayBookings = byDate[ds] ?? [];
          const isToday = ds === todayStr;
          const inMonth = day.getMonth() === currentMonth;
          const MAX = 3;
          return (
            <div key={i}
              className={`min-h-[86px] p-1.5 border-b border-r border-rose-50 last:border-r-0 ${!inMonth ? "bg-gray-50/60" : ""}`}>
              {/* Date number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mx-auto mb-1 ${
                isToday ? "bg-[#B76E79] text-white" : inMonth ? "text-[#2D1B1E]" : "text-gray-300"
              }`}>
                {day.getDate()}
              </div>

              {/* Booking pills */}
              <div className="space-y-0.5">
                {dayBookings.slice(0, MAX).map(b => (
                  <button key={b.id} onClick={() => onSelect(b)}
                    title={`${b.booking_time?.slice(0, 5)} ${b.saloon_customers?.name ?? ""}`}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate block leading-tight hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: STATUS_COLOR[b.status] ?? "#9ca3af" }}>
                    {b.booking_time?.slice(0, 5)} {b.saloon_customers?.name?.split(" ")[0]}
                  </button>
                ))}
                {dayBookings.length > MAX && (
                  <p className="text-[10px] text-gray-400 pl-1">+{dayBookings.length - MAX} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ days, byDate, todayStr, onSelect }: {
  days: Date[];
  byDate: Record<string, Booking[]>;
  todayStr: string;
  onSelect: (b: Booking) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-rose-50 sticky top-0 bg-white z-10">
          <div />
          {days.map((day, i) => {
            const isToday = localDateStr(day) === todayStr;
            return (
              <div key={i} className="py-2 text-center border-l border-rose-50">
                <p className="text-[11px] text-gray-400">{day.toLocaleDateString("en", { weekday: "short" })}</p>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mt-0.5 ${isToday ? "bg-[#B76E79] text-white" : "text-[#2D1B1E]"}`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {HOURS.map(h => (
          <div key={h} className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-rose-50 min-h-[52px]">
            {/* Time label */}
            <div className="pr-2 text-right text-[11px] text-gray-300 pt-1.5 select-none">
              {h}:00
            </div>
            {/* Day cells */}
            {days.map((day, di) => {
              const ds = localDateStr(day);
              const slotBookings = (byDate[ds] ?? []).filter(b => {
                const bh = parseInt(b.booking_time?.slice(0, 2) ?? "0");
                return bh === h;
              });
              return (
                <div key={di} className="p-0.5 border-l border-rose-50">
                  {slotBookings.map(b => (
                    <button key={b.id} onClick={() => onSelect(b)}
                      className="w-full text-left px-1.5 py-1 rounded text-[10px] text-white font-medium mb-0.5 truncate block hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: STATUS_COLOR[b.status] ?? "#9ca3af" }}>
                      {b.saloon_customers?.name?.split(" ")[0]}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ bookings, onSelect }: {
  bookings: Booking[];
  onSelect: (b: Booking) => void;
}) {
  const sorted = [...bookings].sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  return (
    <div className="p-4">
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No bookings for this day</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(b => (
            <button key={b.id} onClick={() => onSelect(b)}
              className="w-full text-left bg-white border border-rose-100 rounded-xl p-3 hover:shadow-md transition-all flex items-center gap-3 group">
              <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[b.status] ?? "#9ca3af" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2D1B1E] text-sm">
                  {b.booking_time?.slice(0, 5)} · {b.saloon_customers?.name ?? "—"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {b.saloon_services?.service_name} · {b.saloon_staff?.name ?? "—"}
                </p>
                <p className="text-xs capitalize mt-0.5 font-medium" style={{ color: STATUS_COLOR[b.status] ?? "#9ca3af" }}>
                  {b.status}
                </p>
              </div>
              {b.saloon_services?.price && (
                <p className="text-sm font-semibold text-[#B76E79] flex-shrink-0">RM {b.saloon_services.price}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Booking Card (List View) ──────────────────────────────────────────────────
function BookingCard({ booking: b, updating, onSelect, onUpdate }: {
  booking: Booking;
  updating: string | null;
  onSelect: () => void;
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50 flex gap-4 items-start flex-wrap">
      <button onClick={onSelect}
        className="bg-[#FFF5F7] rounded-xl p-3 text-center min-w-[60px] hover:bg-rose-100 transition-all flex-shrink-0">
        <p className="text-xs text-[#B76E79] font-medium uppercase">
          {new Date(b.booking_date + "T00:00:00").toLocaleDateString("en", { month: "short" })}
        </p>
        <p className="text-2xl font-bold text-[#2D1B1E] leading-tight">
          {new Date(b.booking_date + "T00:00:00").getDate()}
        </p>
        <p className="text-xs text-gray-500">{b.booking_time?.slice(0, 5)}</p>
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#2D1B1E]">{b.saloon_customers?.name ?? "—"}</p>
        <p className="text-sm text-gray-500">{b.saloon_customers?.phone}</p>
        <p className="text-sm text-[#8B4E57] mt-1">
          {b.saloon_services?.service_name} · {b.saloon_staff?.name ?? "—"}
          {b.saloon_services?.price ? ` · RM ${b.saloon_services.price}` : ""}
        </p>
        {b.notes && <p className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</p>}
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${STATUS_BG[b.status]}`}>
          {b.status}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {b.status === "pending" && (
            <button onClick={() => onUpdate(b.id, "confirmed")} disabled={updating === b.id}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded-lg transition-all disabled:opacity-50">
              Confirm
            </button>
          )}
          {b.status === "confirmed" && (
            <button onClick={() => onUpdate(b.id, "completed")} disabled={updating === b.id}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-all disabled:opacity-50">
              Complete
            </button>
          )}
          {b.status !== "cancelled" && b.status !== "completed" && (
            <button onClick={() => onUpdate(b.id, "cancelled")} disabled={updating === b.id}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg transition-all disabled:opacity-50">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingModal({ booking: b, updating, onClose, onUpdate }: {
  booking: Booking;
  updating: string | null;
  onClose: () => void;
  onUpdate: (id: string, status: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Top color bar */}
        <div className="h-1.5 rounded-t-2xl w-full" style={{ backgroundColor: STATUS_COLOR[b.status] ?? "#9ca3af" }} />

        <div className="p-6 space-y-4">
          {/* Close + status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[b.status] ?? "#9ca3af" }} />
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border capitalize ${STATUS_BG[b.status]}`}>
                {b.status}
              </span>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all text-sm">
              ✕
            </button>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Customer</p>
            <p className="font-bold text-[#2D1B1E] text-base">{b.saloon_customers?.name ?? "—"}</p>
            <p className="text-sm text-gray-500">{b.saloon_customers?.phone}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Date</p>
              <p className="font-medium text-[#2D1B1E]">
                {new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Time</p>
              <p className="font-medium text-[#2D1B1E]">{b.booking_time?.slice(0, 5)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Service</p>
              <p className="font-medium text-[#2D1B1E]">{b.saloon_services?.service_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-0.5">Staff</p>
              <p className="font-medium text-[#2D1B1E]">{b.saloon_staff?.name ?? "—"}</p>
            </div>
            {b.saloon_services?.price != null && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Price</p>
                <p className="font-semibold text-[#B76E79]">RM {b.saloon_services.price}</p>
              </div>
            )}
            {b.saloon_services?.duration_minutes != null && (
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Duration</p>
                <p className="font-medium text-[#2D1B1E]">{b.saloon_services.duration_minutes} min</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {b.notes && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-600 bg-rose-50 rounded-xl p-3 italic">"{b.notes}"</p>
            </div>
          )}

          {/* Actions */}
          {(b.status === "pending" || b.status === "confirmed") && (
            <div className="flex gap-2 pt-1">
              {b.status === "pending" && (
                <button onClick={() => onUpdate(b.id, "confirmed")} disabled={updating === b.id}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                  ✓ Confirm
                </button>
              )}
              {b.status === "confirmed" && (
                <button onClick={() => onUpdate(b.id, "completed")} disabled={updating === b.id}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                  ✓ Complete
                </button>
              )}
              <button onClick={() => onUpdate(b.id, "cancelled")} disabled={updating === b.id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
