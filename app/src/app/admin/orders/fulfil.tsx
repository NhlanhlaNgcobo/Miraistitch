"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFulfilment } from "./actions";

export default function FulfilButton({ orderId, fulfilled }: { orderId: string; fulfilled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  return (
    <div style={{ textAlign: "right" }}>
      <button
        className={fulfilled ? "btn" : "btn-primary"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setFulfilment(orderId, !fulfilled);
            if (r.ok) router.refresh();
            else setErr(r.error);
          })
        }
      >
        {pending ? "Saving…" : fulfilled ? "Mark unfulfilled" : "Mark as fulfilled"}
      </button>
      {err && <p className="pe-err" style={{ marginTop: 8 }}>{err}</p>}
    </div>
  );
}
