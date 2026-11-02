export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rooms/:path*",
    "/reservations/:path*",
    "/menu/:path*",
    "/orders/:path*",
    "/stock/:path*",
    "/users/:path*",
    "/invoices/:path*",
  ],
};
