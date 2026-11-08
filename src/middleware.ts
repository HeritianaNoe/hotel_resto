export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    /*
     * Protect dashboard routes only — never match /api/auth/*
     * or static assets, otherwise session fetch fails.
     */
    "/dashboard/:path*",
    "/rooms/:path*",
    "/reservations/:path*",
    "/menu/:path*",
    "/orders/:path*",
    "/users/:path*",
    "/invoices/:path*",
    "/profile/:path*",
  ],
};
