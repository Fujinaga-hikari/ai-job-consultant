import { NextRequest, NextResponse } from "next/server";

const BASIC_USER = process.env.BASIC_AUTH_USER || "";
const BASIC_PASS = process.env.BASIC_AUTH_PASS || "";
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

  // --- 海外アクセス制限（APIルートのみ） ---
  if (ALLOWED_COUNTRIES.length > 0 && pathname.startsWith("/api/")) {
    const country = request.headers.get("x-vercel-ip-country") || "";
    if (country && !ALLOWED_COUNTRIES.includes(country.toUpperCase())) {
      return NextResponse.json(
        { error: "このサービスはご利用いただけない地域です。" },
        { status: 403 }
      );
    }
  }

  // --- ベーシック認証（本番公開前の一時的な全体ロック） ---
  if (!BASIC_USER || !BASIC_PASS) return NextResponse.next();

  const auth = request.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      if (user === BASIC_USER && pass === BASIC_PASS) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
