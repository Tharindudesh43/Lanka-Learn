import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedPaths = ["/dashboard", "/instructor", "/admin"];

// Routes that require specific roles
const roleProtectedPaths: Record<string, string[]> = {
  "/instructor": ["INSTRUCTOR", "ADMIN"],
  "/admin": ["ADMIN"],
};

// Public API routes (no auth needed)
const publicApiPaths = [
  "/api/auth",
  "/api/webhooks",
  "/api/courses",
  "/api/categories",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ─── API Route Protection ────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Allow public API routes
    const isPublicApi = publicApiPaths.some((p) => pathname.startsWith(p));

    // Allow GET requests to /api/courses (public browsing)
    if (pathname.startsWith("/api/courses") && request.method === "GET") {
      return NextResponse.next();
    }

    if (isPublicApi) {
      return NextResponse.next();
    }

    // All other API routes require auth
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check role for admin API routes
    if (pathname.startsWith("/api/admin") && token.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // ─── Page Route Protection ───────────────────────────────────────────
  const isProtectedPath = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Redirect to login if not authenticated
  if (!token) {
    const signInUrl = new URL("/auth/login", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role-based access
  for (const [path, allowedRoles] of Object.entries(roleProtectedPaths)) {
    if (pathname.startsWith(path)) {
      const userRole = token.role as string;
      if (!allowedRoles.includes(userRole)) {
        const redirectUrl = userRole === "INSTRUCTOR" ? "/instructor" : "/dashboard";
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.png.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
