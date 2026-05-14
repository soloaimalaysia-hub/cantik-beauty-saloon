"use client";
import { useEffect, useState } from "react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  total_visits: number;
  last_visit_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => { setCustomers(d); setLoading(false); });
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Customers</h1>
        <p className="text-gray-500 text-sm">{customers.length} customers total</p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-rose-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B76E79]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFF5F7] border-b border-rose-100">
              <tr>
                {["Customer", "Phone", "Visits", "Last Visit", "Member Since"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#8B4E57] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FFF5F7] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white text-xs font-bold">
                          {c.name?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-[#2D1B1E]">{c.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-[#FFF0F3] text-[#B76E79] px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {c.total_visits ?? 0}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.last_visit_at
                        ? new Date(c.last_visit_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleDateString("en-MY", { month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
