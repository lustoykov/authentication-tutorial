import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "./lib/supabase/server-client";
/**
 * Next.js proxy (formerly middleware) entry point responsible for basic auth gating.
 *
 * Runtime assumptions due to conflicting docs (Next.js 16):
 * - Proxy runs in the Node.js runtime by default (not Edge)
 * - Node runtime grants access to the shared cookie store used by Supabase
 *
 * What happens per request:
 * - Instantiate the Supabase server client (shares cookies via `NextResponse`)
 * - Call `supabase.auth.getUser()` which refreshes tokens if necessary
 * - Redirect anonymous users away from `/protected` routes to `/login`
 *
 * Add extra path checks or redirects here when you need more complex routing rules.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect non-authenticated users away from protected routes
  if (!user && request.nextUrl.pathname.startsWith("/protected")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}
