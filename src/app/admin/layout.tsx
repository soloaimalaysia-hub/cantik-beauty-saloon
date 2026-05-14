"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/bookings",  label: "Bookings",  icon: "📅" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/services",  label: "Services",  icon: "✂️" },
  { href: "/admin/staff",     label: "Staff",     icon: "💼" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Login page uses its own layout
  if (pathname === "/admin") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  }

  const navLinks = (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#B76E79] text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white text-xs rounded-lg hover:bg-white/10 transition-all"
        >
          🌐 View Website
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-red-300 text-xs rounded-lg hover:bg-white/10 transition-all"
        >
          🚪 Logout
        </button>
      </div>
    </>
  );

  const logoBlock = (
    <div className="p-5 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B76E79] to-[#E8A0A9] flex items-center justify-center text-white font-bold text-sm shrink-0">
          C
        </div>
        <div>
          <p className="font-playfair font-bold text-sm leading-tight">Cantik Beauty</p>
          <p className="text-[#B76E79] text-xs">Admin</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF5F7]">

      {/* ── DESKTOP sidebar (lg and above) ── */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#2D1B1E] text-white fixed h-full z-20 shadow-xl">
        {logoBlock}
        {navLinks}
      </aside>

      {/* ── MOBILE top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 bg-[#2D1B1E] text-white flex items-center justify-between px-4 h-14 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#B76E79] to-[#E8A0A9] flex items-center justify-center text-white font-bold text-xs">
            C
          </div>
          <span className="font-playfair font-bold text-sm">Cantik Beauty</span>
        </div>
        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── MOBILE slide-out drawer ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative flex flex-col w-64 max-w-[80vw] bg-[#2D1B1E] text-white h-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B76E79] to-[#E8A0A9] flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <div>
                  <p className="font-playfair font-bold text-sm leading-tight">Cantik Beauty</p>
                  <p className="text-[#B76E79] text-xs">Admin</p>
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {navLinks}
          </aside>
        </div>
      )}

      {/* ── MAIN content ── */}
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

    </div>
  );
}
