"use client";
import { useEffect, useState } from "react";

interface Service { id: string; service_name: string; price: number; duration_minutes: number }
interface Staff   { id: string; name: string }
interface Conflict { type: string; message: string }

const EMPTY = {
  customer_name: "", customer_phone: "",
  service_id: "", staff_id: "",
  booking_date: "", booking_time: "", notes: "",
};

// 30-min time slots: 09:00 – 20:30
const TIME_SLOTS: string[] = [];
for (let h = 9; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_SLOTS.push("20:30");

export default function AddBookingModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm]           = useState(EMPTY);
  const [services, setServices]   = useState<Service[]>([]);
  const [staff, setStaff]         = useState<Staff[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [conflicts, setConflicts]       = useState<Conflict[]>([]);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictChecked, setConflictChecked]   = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // Load services + staff on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/services").then(r => r.json()),
      fetch("/api/admin/staff").then(r => r.json()),
    ]).then(([svcs, stf]) => {
      setServices(Array.isArray(svcs) ? svcs : []);
      setStaff(Array.isArray(stf) ? stf : []);
      setLoadingMeta(false);
    });
  }, []);

  // Auto-check conflict when staff + date + time are set
  useEffect(() => {
    if (!form.staff_id || !form.booking_date || !form.booking_time) {
      setConflicts([]);
      setConflictChecked(false);
      return;
    }
    setCheckingConflict(true);
    const params = new URLSearchParams({
      staff_id:     form.staff_id,
      booking_date: form.booking_date,
      booking_time: form.booking_time,
    });
    fetch(`/api/admin/bookings/conflict?${params}`)
      .then(r => r.json())
      .then(d => {
        setConflicts(d.conflicts ?? []);
        setConflictChecked(true);
        setCheckingConflict(false);
      });
  }, [form.staff_id, form.booking_date, form.booking_time]);

  function set(key: keyof typeof EMPTY, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim()) { setError("Customer name is required"); return; }
    setSubmitting(true);
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) { setError(data.error); return; }
    onCreated();
    onClose();
  }

  const hasConflict    = conflicts.length > 0;
  const selectedService = services.find(s => s.id === form.service_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Top bar */}
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#B76E79] to-[#8B4E57]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-playfair text-lg font-bold text-[#2D1B1E]">➕ Add Booking</h2>
              <p className="text-xs text-gray-400 mt-0.5">Admin manual booking · auto-confirmed</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all text-sm">
              ✕
            </button>
          </div>

          {loadingMeta ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">

              {/* Customer */}
              <div className="bg-rose-50/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#B76E79] uppercase tracking-wide">👤 Customer</p>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Name <span className="text-red-400">*</span></label>
                  <input value={form.customer_name} onChange={e => set("customer_name", e.target.value)}
                    required placeholder="e.g. Nurul Ain"
                    className={inp} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Phone (optional · used to match existing)</label>
                  <input value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)}
                    placeholder="e.g. 0123456789"
                    className={inp} />
                </div>
              </div>

              {/* Service + Staff */}
              <div className="bg-rose-50/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#B76E79] uppercase tracking-wide">✂️ Service & Staff</p>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Service <span className="text-red-400">*</span></label>
                  <select value={form.service_id} onChange={e => set("service_id", e.target.value)}
                    required className={inp}>
                    <option value="">— Select service —</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.service_name}{s.price ? ` · RM ${s.price}` : ""}
                        {s.duration_minutes ? ` · ${s.duration_minutes}min` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Staff</label>
                  <select value={form.staff_id} onChange={e => set("staff_id", e.target.value)}
                    className={inp}>
                    <option value="">— Any staff —</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div className="bg-rose-50/50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#B76E79] uppercase tracking-wide">📅 Date & Time</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Date <span className="text-red-400">*</span></label>
                    <input type="date" value={form.booking_date} onChange={e => set("booking_date", e.target.value)}
                      required className={inp}
                      min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Time <span className="text-red-400">*</span></label>
                    <select value={form.booking_time} onChange={e => set("booking_time", e.target.value)}
                      required className={inp}>
                      <option value="">— Time —</option>
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Conflict check result ── */}
              {form.staff_id && form.booking_date && form.booking_time && (
                <div>
                  {checkingConflict ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Checking availability...
                    </div>
                  ) : conflictChecked && hasConflict ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-base">⚠️</span>
                        <p className="text-xs font-semibold text-amber-700">Conflict detected — you can still override</p>
                      </div>
                      {conflicts.map((c, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs rounded-lg p-2 ${
                          c.type === "leave"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          <span>{c.type === "leave" ? "🏖️" : "📅"}</span>
                          <span>{c.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : conflictChecked ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl p-3">
                      <span>✅</span>
                      <span>Staff is available at this time slot</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 font-medium">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  rows={2} placeholder="Special requests..."
                  className={`${inp} resize-none`} />
              </div>

              {/* Booking summary */}
              {selectedService && form.booking_date && form.booking_time && (
                <div className="bg-[#FFF5F7] rounded-xl p-3 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-[#2D1B1E] text-sm">Booking Summary</p>
                  <p>📅 {new Date(form.booking_date + "T00:00:00").toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })} at {form.booking_time}</p>
                  <p>✂️ {selectedService.service_name}{selectedService.price ? ` · RM ${selectedService.price}` : ""}</p>
                  {form.staff_id && <p>💼 {staff.find(s => s.id === form.staff_id)?.name}</p>}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-600 text-xs rounded-xl p-3">⚠️ {error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-rose-200 text-gray-500 text-sm py-2.5 rounded-xl hover:bg-rose-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 ${
                    hasConflict
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-[#B76E79] hover:bg-[#8B4E57]"
                  }`}>
                  {submitting ? "Saving..." : hasConflict ? "⚠️ Override & Book" : "✓ Confirm Booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79] bg-white";
