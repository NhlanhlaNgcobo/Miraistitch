import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Two jobs, in order:
 *
 *   1. Resolve the tenant from the hostname, so <slug>.miraistitch.co.za serves
 *      that store without the slug appearing in the path.
 *   2. Refresh the Supabase auth session (required by @supabase/ssr).
 *
 * The rewrite is deliberately dumb: it maps host → path and nothing else. It does
 * NOT decide whether the store exists or is active — that stays in the page, where
 * RLS applies and a missing store can render a proper 404. A middleware that
 * queried the database would add a round-trip to every request including assets,
 * and would be a second place where tenant access is decided.
 */

/** Apex domains that are the platform itself, not a tenant. */
const PLATFORM_HOSTS = new Set([
  "miraistitch.co.za",
  "www.miraistitch.co.za",
  "app.miraistitch.co.za",
  "localhost",
]);

/** Subdomains reserved for the platform, so no tenant can claim them. */
const RESERVED = new Set([
  "www", "app", "admin", "api", "auth", "login", "dashboard", "cdn", "static",
  "assets", "mail", "smtp", "ftp", "blog", "docs", "help", "support", "status",
  "staging", "dev", "test", "demo",
]);

/** Paths that belong to the platform even when reached on a tenant host. */
const PLATFORM_PATHS = /^\/(admin|login|auth|api|_next|favicon|images|vendor)(\/|$)/;

function tenantSlug(host: string): string | null {
  const name = host.split(":")[0].toLowerCase();
  if (PLATFORM_HOSTS.has(name)) return null;

  // *.miraistitch.co.za
  const base = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "miraistitch.co.za";
  if (name.endsWith(`.${base}`)) {
    const sub = name.slice(0, -(base.length + 1));
    if (!sub || sub.includes(".") || RESERVED.has(sub)) return null;
    return sub;
  }

  // <slug>.localhost:3000 — lets subdomain routing be tested locally
  if (name.endsWith(".localhost")) {
    const sub = name.slice(0, -".localhost".length);
    return sub && !RESERVED.has(sub) ? sub : null;
  }

  // A fully custom domain a merchant has pointed at us. Resolving it needs a
  // lookup, so it is handled by the page rather than guessed at here.
  return null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const slug = tenantSlug(host);
  const path = request.nextUrl.pathname;

  let response: NextResponse;

  if (slug && !PLATFORM_PATHS.test(path)) {
    // shop.example.co.za/thank-you  →  /s/shop/thank-you
    const url = request.nextUrl.clone();
    url.pathname = `/s/${slug}${path === "/" ? "" : path}`;
    response = NextResponse.rewrite(url);
    // let the storefront know which tenant it is serving without re-parsing host
    response.headers.set("x-mirai-store", slug);
  } else {
    response = NextResponse.next({ request });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Preserve the rewrite — recreating the response here would drop it and
          // silently send every tenant request to the platform homepage.
          const next = slug && !PLATFORM_PATHS.test(path)
            ? NextResponse.rewrite(new URL(`/s/${slug}${path === "/" ? "" : path}`, request.url))
            : NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => next.cookies.set(name, value, options));
          response.headers.forEach((v, k) => next.headers.set(k, v));
          response = next;
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  // everything except static assets and the PayFast webhook (which has no session)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/payfast).*)"],
};
