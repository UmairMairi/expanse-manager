import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/utils/jwt";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/expenses",
  "/income",
  "/clients",
  "/projects",
  "/savings",
  "/invoices",
  "/budgets",
  "/reports",
  "/ai",
  "/settings",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    // If already logged in, bounce to dashboard.
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token && (await verifySession(token))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const valid = token ? await verifySession(token) : null;
    return NextResponse.redirect(new URL(valid ? "/dashboard" : "/login", req.url));
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = token ? await verifySession(token) : null;
  if (!claims) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude Next internals, static, and public assets.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
