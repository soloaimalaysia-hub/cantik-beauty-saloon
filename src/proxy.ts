import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_TOKEN = Buffer.from("KennyNgui88").toString("base64");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin/* except /admin (login page)
  if (pathname.startsWith("/admin/")) {
    const token = request.cookies.get("cantik_admin")?.value;
    if (token !== ADMIN_TOKEN) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
