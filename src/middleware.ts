import { NextRequest, NextResponse } from "next/server";

const BASIC_USER = process.env.BASIC_AUTH_USER || "";
const BASIC_PASS = process.env.BASIC_AUTH_PASS || "";

// 許可する国コード（空なら全国許可）
// Vercel が x-vercel-ip-country ヘッダーで国コードを付与
const ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES
  ? process.env.ALLOWED_COUNTRIES.split(",").map((c) => c.trim().toUpperCase())
  : [];

export function middleware(request: NextRequest) {
  // --- 海外アクセス制限（API ルートのみ） ---
  if (
    ALLOWED_COUNTRIES.length > 0 &&
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    const country = request.headers.get("x-vercel-ip-country") || "";
    if (country && !ALLOWED_COUNTRIES.includes(country.toUpperCase())) {
      return NextResponse.json(
        { error: "このサービスはご利用いただけない地域です。" },
        { status: 403 }
      );
    }
  }

  // --- ベーシック認証 ---
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
