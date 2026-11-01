import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    if (path.startsWith("/api/admin") && req.nextauth.token?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (path.startsWith("/dashboard") && req.nextauth.token?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/auth/signin" },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/api/admin") || path.startsWith("/dashboard")) {
          // Authenticated users reach middleware; role is checked there.
          return !!token;
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
