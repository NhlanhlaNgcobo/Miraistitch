import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Editor from "./editor";
import type { Store, Product } from "@/types";

export const dynamic = "force-dynamic";

const rand = (c: number) => "R" + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 });

/**
 * Products list, and the add/edit editor behind ?new=1 / ?edit=<id>.
 *
 * Reads go through RLS as the signed-in owner, so this page can only ever show
 * one tenant's catalogue — there is no store_id filter to forget.
 */
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: stores } = await db.from("stores").select("*").order("created_at");
  const store = (stores?.[0] as Store) ?? null;
  if (!store) {
    return (
      <main className="wrap">
        <h1>Products</h1>
        <p>Create your store first on the <Link href="/admin">dashboard</Link>.</p>
      </main>
    );
  }

  const [{ data: rows }, { data: credit }] = await Promise.all([
    db.from("products").select("*").eq("store_id", store.id).order("position").order("created_at"),
    db.from("store_credits").select("balance").eq("store_id", store.id).maybeSingle(),
  ]);
  const products = (rows ?? []) as Product[];
  const credits = credit?.balance ?? 0;

  const editing = sp.edit ? products.find((p) => p.id === sp.edit) : undefined;
  const showEditor = sp.new === "1" || !!editing;

  if (showEditor) {
    return (
      <main className="wrap">
        <nav className="crumbs"><Link href="/admin">Dashboard</Link> · <Link href="/admin/products">Products</Link> · {editing ? "Edit" : "New"}</nav>
        <h1>{editing ? editing.title : "Add a product"}</h1>
        <Editor storeId={store.id} product={editing} credits={credits} />
      </main>
    );
  }

  const live = products.filter((p) => p.active).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;

  return (
    <main className="wrap">
      <nav className="crumbs"><Link href="/admin">Dashboard</Link> · Products</nav>
      <header className="pagehead">
        <div>
          <h1>Products</h1>
          <p className="sub">{products.length} total · {live} live · {outOfStock} out of stock · {credits} image credit{credits === 1 ? "" : "s"}</p>
        </div>
        <Link className="btn-primary" href="/admin/products?new=1">Add product</Link>
      </header>

      {products.length === 0 ? (
        <div className="empty">
          <p>No products yet.</p>
          <Link className="btn-primary" href="/admin/products?new=1">Add your first product</Link>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr><th></th><th>Product</th><th>Price</th><th>Stock</th><th>SEO</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const seoDone = Boolean((p as Record<string, unknown>).seo_title && (p as Record<string, unknown>).seo_description);
              return (
                <tr key={p.id}>
                  <td className="thumb">{p.image ? <img src={p.image} alt="" /> : <span className="noimg" />}</td>
                  <td>
                    <Link href={`/admin/products?edit=${p.id}`}><strong>{p.title}</strong></Link>
                    <div className="muted">{(p as Record<string, unknown>).slug as string || "no slug"}</div>
                  </td>
                  <td className="num">{rand(p.price_cents)}</td>
                  <td className={p.stock <= 0 ? "num bad" : "num"}>{p.stock}</td>
                  <td>{seoDone ? <span className="pill ok">Done</span> : <span className="pill warn">Missing</span>}</td>
                  <td>{p.active ? <span className="pill ok">Live</span> : <span className="pill">Hidden</span>}</td>
                  <td className="right"><Link href={`/admin/products?edit=${p.id}`}>Edit</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
