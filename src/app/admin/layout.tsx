"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  // Login page has its own layout
  if (pathname === "/admin") return <>{children}</>;

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#2D1B1E] text-white flex flex-col fixed h-full z-10 shadow-xl">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B76E79] to-[#E8A0A9] flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <div>
              <p className="font-playfair font-bold text-sm leading-tight">Cantik Beauty</p>
              <p className="text-[#B76E79] text-xs">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white text-xs rounded-lg hover:bg-white/10 transition-all">
            🌐 View Website
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-red-300 text-xs rounded-lg hover:bg-white/10 transition-all"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
