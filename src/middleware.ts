import { NextRequest, NextResponse } from "next/server";

const ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES
  ? process.env.ALLOWED_COUNTRIES.split(",").map((c) => c.trim().toUpperCase())
  : [];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- 管理画面ルート ---
  if (pathname.startsWith("/admin")) {
    // ログインページと認証APIは認証不要
    if (
      pathname === "/admin/login" ||
      pathname.startsWith("/api/admin/auth/")
    ) {
      return NextResponse.next();
    }

    const adminToken = process.env.ADMIN_TOKEN ?? "";
    const sessionCookie = request.cookies.get("admin_session")?.value ?? "";

    if (!adminToken || sessionCookie !== adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // --- 海外アクセス制限（APIルートのみ。Cron は Vercel 米国リージョンから呼ばれる） ---
  if (
    ALLOWED_COUNTRIES.length > 0 &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/cron/")
  ) {
    const country = request.headers.get("x-vercel-ip-country") || "";
    if (country && !ALLOWED_COUNTRIES.includes(country.toUpperCase())) {
      return NextResponse.json(
        { error: "このサービスはご利用いただけない地域です。" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
