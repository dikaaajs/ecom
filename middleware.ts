import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    // if (req.nextUrl.pathname.startsWith("/dashboard")) {
    //   // Check if user has admin role
    //   if (req.nextauth.token?.role !== "admin") {
    //     return NextResponse.redirect(new URL("/auth/signin", req.url))
    //   }
    // }

    // Check if user is trying to access admin API routes
    // if (req.nextUrl.pathname.startsWith("/api/admin")) {
    //   // Check if user has admin role
    //   if (req.nextauth.token?.role !== "admin") {
    //     return NextResponse.json(
    //       { error: "Unauthorized", message: "Admin access required" },
    //       { status: 401 }
    //     );
    //   }
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // // Allow access to auth pages without token
        // if (req.nextUrl.pathname.startsWith("/auth/")) {
        //   return true;
        // }

        // // Require token for dashboard and admin API routes
        // if (
        //   req.nextUrl.pathname.startsWith("/dashboard") ||
        //   req.nextUrl.pathname.startsWith("/api/admin")
        // ) {
        //   return !!token;
        // }

        // Allow all other routes
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/auth/:path*"],
};
