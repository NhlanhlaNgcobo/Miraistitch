import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavLink from "./nav-link";
import "./admin.css";

export const dynamic = "force-dynamic";

/**
 * The admin shell.
 *
 * Until now every admin page stood on its own, which meant /admin/products and
 * /admin/credits existed but nothing linked to them — they were unreachable
 * unless you typed the URL. A merchant console needs persistent navigation to
 * feel like one product rather than a pile of pages.
 *
 * Laid out the way merchants already expect from Shopify: a dark top bar with
 * the store switcher, a left rail grouped by job, and the storefront one click
 * away at all times.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: stores } = await db.from("stores").select("id,name,slug").order("created_at");
  const store = stores?.[0] ?? null;

  // Badges that answer "is there anything waiting for me?" — the main reason to
  // look at a nav at all.
  let unfulfilled = 0;
  let credits = 0;
  if (store) {
    const [{ count }, { data: c }] = await Promise.all([
      db.from("orders").select("id", { count: "exact", head: true })
        .eq("store_id", store.id).eq("status", "paid").eq("fulfilment", "unfulfilled"),
      db.from("store_credits").select("balance").eq("store_id", store.id).maybeSingle(),
    ]);
    unfulfilled = count ?? 0;
    credits = c?.balance ?? 0;
  }

  const initials = (store?.name ?? user.email ?? "M").slice(0, 2).toUpperCase();

  return (
    <div className="ad">
      <header className="ad-top">
        <Link href="/admin" className="ad-brand">
          <span className="ad-mk">M</span> MiraiStitch
        </Link>
        {store && (
          <span className="ad-store">
            {store.name}
            <span className="ad-slug">/{store.slug}</span>
          </span>
        )}
        <div className="ad-spacer" />
        {store && (
          <a className="ad-view" href={`/s/${store.slug}`} target="_blank" rel="noreferrer">
            View store ↗
          </a>
        )}
        <span className="ad-avatar" title={user.email ?? ""}>{initials}</span>
      </header>

      <div className="ad-body">
        <nav className="ad-nav" aria-label="Admin">
          <NavLink href="/admin" exact>Home</NavLink>
          <NavLink href="/admin/orders" badge={unfulfilled || undefined}>Orders</NavLink>
          <NavLink href="/admin/products">Products</NavLink>

          <div className="ad-navlabel">Sales channel</div>
          <NavLink href="/admin/design">Design</NavLink>

          <div className="ad-navlabel">Account</div>
          <NavLink href="/admin/credits" badge={credits} badgeTone="quiet">Credits</NavLink>
          <NavLink href="/admin/settings">Settings</NavLink>
        </nav>

        <div className="ad-main">{children}</div>
      </div>
    </div>
  );
}
