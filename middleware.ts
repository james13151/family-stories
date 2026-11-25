import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session-token";

const PUBLIC_PAGES = new Set(["/", "/sign-in", "/sign-up"]);
const PUBLIC_API = new Set(["/api/auth/sign-in", "/api/auth/sign-up", "/api/locale"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-hl-path", pathname);

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.has(pathname) || userId) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!userId && !PUBLIC_PAGES.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (userId && (pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)"],
};
