import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/account-deleted",
];

const publicApiPaths = [
  "/api/auth/callback",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/) ||
    pathname === "/favicon.ico"
  ) {
    return;
  }

  // Update session and verify authentication via Supabase
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
