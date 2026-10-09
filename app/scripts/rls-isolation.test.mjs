/**
 * Tenant isolation test.
 *
 * This is the assumption the whole platform rests on: a merchant can never see
 * or touch another merchant's data. RLS policies are easy to write, easy to get
 * subtly wrong, and impossible to eyeball — a missing `with check` or a policy
 * that reads `true` looks fine right up until it leaks customer records.
 *
 * Creates two real tenants, then has each one try the things they must not be
 * able to do. Every assertion is "this MUST fail" or "this MUST return nothing".
 *
 *   node scripts/rls-isolation.test.mjs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY. Run it against a dev project — it creates and then
 * deletes two users. Exits non-zero on any failure, so CI can gate on it.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// --- env (reads .env.local so it works without a dotenv dependency) ----------
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* fall back to the real environment */ }

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SVC) {
  console.error("Missing Supabase env. Copy .env.example to .env.local and fill it in.");
  process.exit(2);
}

const svc = createClient(URL_, SVC, { auth: { persistSession: false } });

let pass = 0;
const failures = [];
const ok = (name) => { pass++; console.log("  PASS  " + name); };
const bad = (name, detail) => { failures.push(name); console.log("  FAIL  " + name + (detail ? "  → " + detail : "")); };

/** The row must NOT come back. */
const mustBeEmpty = async (name, q) => {
  const { data, error } = await q;
  if (error) return ok(`${name} (blocked: ${error.code})`);
  Array.isArray(data) && data.length === 0 ? ok(name) : bad(name, `returned ${JSON.stringify(data)?.slice(0, 120)}`);
};

/** The write must be rejected, or silently affect nothing. */
const mustNotWrite = async (name, q, verify) => {
  const { error } = await q;
  if (error) return ok(`${name} (rejected: ${error.code})`);
  const leaked = await verify();
  leaked ? bad(name, "write went through") : ok(`${name} (no rows affected)`);
};

async function makeTenant(tag) {
  const email = `rls-${tag}-${Date.now()}@example.test`;
  const { data: u, error: ue } = await svc.auth.admin.createUser({
    email, password: "test-" + Math.random().toString(36).slice(2), email_confirm: true,
  });
  if (ue) throw new Error("could not create user: " + ue.message);

  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: se } = await client.auth.signInWithPassword({
    email, password: "x",
  }).catch(() => ({ error: true }));
  // password sign-in needs the password we generated; simpler to mint a session
  const { data: link } = await svc.auth.admin.generateLink({ type: "magiclink", email });
  const token = link?.properties?.hashed_token;
  if (token) {
    await client.auth.verifyOtp({ type: "magiclink", token_hash: token });
  } else if (se) {
    throw new Error("could not sign in as " + tag);
  }

  const slug = `rls-${tag}-${Date.now().toString(36)}`;
  const { data: store, error: cse } = await client
    .from("stores").insert({ owner_id: u.user.id, name: `Store ${tag}`, slug }).select("id").single();
  if (cse) throw new Error("could not create store: " + cse.message);

  const { data: product } = await svc.from("products")
    .insert({ store_id: store.id, title: `${tag} widget`, price_cents: 1000, stock: 5, active: true })
    .select("id").single();

  const { data: hidden } = await svc.from("products")
    .insert({ store_id: store.id, title: `${tag} draft`, price_cents: 1000, stock: 0, active: false })
    .select("id").single();

  const { data: order } = await svc.from("orders")
    .insert({ store_id: store.id, number: "#1", email: `buyer-${tag}@example.test`,
              status: "paid", total_cents: 1000, payment_ref: `rls_${tag}_${Date.now()}` })
    .select("id").single();

  return { userId: u.user.id, client, storeId: store.id, productId: product.id, hiddenId: hidden.id, orderId: order.id };
}

async function run() {
  console.log("Creating two tenants…\n");
  const A = await makeTenant("a");
  const B = await makeTenant("b");
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } });

  console.log("B must not READ A's data");
  await mustBeEmpty("B cannot read A's orders", B.client.from("orders").select("*").eq("store_id", A.storeId));
  await mustBeEmpty("B cannot read A's order_items", B.client.from("order_items").select("*").eq("store_id", A.storeId));
  await mustBeEmpty("B cannot read A's hidden product", B.client.from("products").select("*").eq("id", A.hiddenId));
  await mustBeEmpty("B cannot read A's credit balance", B.client.from("store_credits").select("*").eq("store_id", A.storeId));
  await mustBeEmpty("B cannot read A's credit ledger", B.client.from("credit_ledger").select("*").eq("store_id", A.storeId));
  await mustBeEmpty("B cannot read A's AI jobs", B.client.from("ai_jobs").select("*").eq("store_id", A.storeId));

  console.log("\nB must not WRITE A's data");
  await mustNotWrite("B cannot edit A's product",
    B.client.from("products").update({ title: "HACKED" }).eq("id", A.productId),
    async () => (await svc.from("products").select("title").eq("id", A.productId).single()).data?.title === "HACKED");
  await mustNotWrite("B cannot delete A's product",
    B.client.from("products").delete().eq("id", A.productId),
    async () => !(await svc.from("products").select("id").eq("id", A.productId).maybeSingle()).data);
  await mustNotWrite("B cannot insert into A's store",
    B.client.from("products").insert({ store_id: A.storeId, title: "injected", price_cents: 1, stock: 1 }),
    async () => ((await svc.from("products").select("id").eq("store_id", A.storeId)).data ?? []).length > 2);
  await mustNotWrite("B cannot rename A's store",
    B.client.from("stores").update({ name: "HACKED" }).eq("id", A.storeId),
    async () => (await svc.from("stores").select("name").eq("id", A.storeId).single()).data?.name === "HACKED");
  await mustNotWrite("B cannot publish a layout to A's store",
    B.client.from("layouts").upsert({ store_id: A.storeId, blocks: [], published_at: new Date().toISOString() }),
    async () => !!(await svc.from("layouts").select("store_id").eq("store_id", A.storeId).maybeSingle()).data);
  await mustNotWrite("B cannot mark A's order fulfilled",
    B.client.from("orders").update({ fulfilment: "fulfilled" }).eq("id", A.orderId),
    async () => (await svc.from("orders").select("fulfilment").eq("id", A.orderId).single()).data?.fulfilment === "fulfilled");

  console.log("\nNobody may mint their own credits");
  await mustNotWrite("B cannot grant itself credits (insert)",
    B.client.from("store_credits").insert({ store_id: B.storeId, balance: 9999 }),
    async () => ((await svc.from("store_credits").select("balance").eq("store_id", B.storeId).maybeSingle()).data?.balance ?? 0) > 100);
  await mustNotWrite("B cannot top up its own balance (update)",
    B.client.from("store_credits").update({ balance: 9999 }).eq("store_id", B.storeId),
    async () => ((await svc.from("store_credits").select("balance").eq("store_id", B.storeId).maybeSingle()).data?.balance ?? 0) > 100);
  await mustNotWrite("B cannot forge a ledger entry",
    B.client.from("credit_ledger").insert({ store_id: B.storeId, delta: 9999, reason: "purchase", balance_after: 9999 }),
    async () => ((await svc.from("credit_ledger").select("id").eq("store_id", B.storeId).eq("delta", 9999)).data ?? []).length > 0);

  console.log("\nAnonymous visitors");
  await mustBeEmpty("anon cannot read orders", anon.from("orders").select("*"));
  await mustBeEmpty("anon cannot read order_items", anon.from("order_items").select("*"));
  await mustBeEmpty("anon cannot read credit balances", anon.from("store_credits").select("*"));
  await mustBeEmpty("anon cannot read AI jobs", anon.from("ai_jobs").select("*"));
  await mustBeEmpty("anon cannot read inactive products", anon.from("products").select("*").eq("active", false));

  console.log("\nStorefronts must still work");
  const { data: pub } = await anon.from("products").select("id").eq("id", A.productId);
  pub?.length === 1 ? ok("anon CAN read an active product") : bad("anon CAN read an active product", "storefront would be empty");
  const { data: own } = await A.client.from("products").select("id").eq("id", A.hiddenId);
  own?.length === 1 ? ok("A CAN read its own hidden product") : bad("A CAN read its own hidden product", "admin would be broken");

  // cleanup — cascades remove stores, products, orders, credits
  await svc.auth.admin.deleteUser(A.userId);
  await svc.auth.admin.deleteUser(B.userId);

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nTENANT ISOLATION IS BROKEN:");
    failures.forEach((f) => console.log("  - " + f));
    process.exit(1);
  }
  console.log("Tenant isolation holds.");
}

run().catch((e) => { console.error("\nTest harness error:", e.message); process.exit(2); });
