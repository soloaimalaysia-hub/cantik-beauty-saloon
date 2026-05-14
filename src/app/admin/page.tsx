"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("密码错误，请再试");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D1B1E] via-[#8B4E57] to-[#B76E79] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B76E79] to-[#8B4E57] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
            C
          </div>
          <h1 className="font-playfair text-2xl font-bold text-[#2D1B1E]">Admin Panel</h1>
          <p className="text-[#B76E79] text-sm mt-1">Cantik Beauty Saloon</p>
        </div>

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border border-rose-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#B76E79] text-[#2D1B1E]"
              placeholder="Enter admin password"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B76E79] hover:bg-[#8B4E57] text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:text-[#B76E79]">← Back to website</a>
        </p>
      </div>
    </div>
  );
}
