export { auth as middleware } from "@/auth/auth";

// Apply the middleware to the /admin routes
export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
};