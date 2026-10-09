export type Store = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string;
  currency: string;
  vat_rate: number;
  shipping: { name: string; cents: number }[];
  status: string;
  order_seq: number;
  created_at: string;
};

export type Product = {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price_cents: number;
  stock: number;
  image: string;
  active: boolean;
  position: number;
  created_at: string;
};

export type Block = { type: string; props: Record<string, unknown> };

export type Order = {
  id: string;
  store_id: string;
  number: string;
  customer: { name?: string; email?: string; phone?: string; address?: string };
  email: string | null;
  status: "pending" | "paid" | "cancelled";
  fulfilment: "unfulfilled" | "fulfilled";
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  ship_method: string | null;
  provider: string | null;
  payment_ref: string | null;
  pf_payment_id: string | null;
  created_at: string;
};
