"use client";
import { useEffect, useState } from "react";

interface Staff {
  id: string;
  name: string;
  phone: string;
  speciality: string;
  is_active: boolean;
}

const EMPTY = { name: "", phone: "", speciality: "" };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const load = () =>
    fetch("/api/admin/staff").then((r) => r.json()).then((d) => { setStaff(d); setLoading(false); });

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
        {/* Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100">
          <h2 className="font-semibold text-[#2D1B1E] mb-4">
            {editing ? "✏️ Edit Staff" : "➕ Add Staff"}
          </h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
                placeholder="e.g. Siti"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
                placeholder="e.g. 0123456789"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Speciality</label>
              <input
                value={form.speciality}
                onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
                placeholder="e.g. Hair Colouring & Styling"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#B76E79] hover:bg-[#8B4E57] text-white text-sm font-medium py-2 rounded-xl transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update" : "Add Staff"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setForm(EMPTY); }}
                  className="px-4 py-2 border border-rose-200 text-gray-500 text-sm rounded-xl hover:bg-rose-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Staff cards */}
        <div className="lg:col-span-2 space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rose-50 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white font-bold shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2D1B1E]">{s.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {s.speciality || "—"} {s.phone ? `· ${s.phone}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(s)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => del(s.id)}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
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
