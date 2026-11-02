"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateInvoiceButton({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pay(method: string) {
    setLoading(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodOrderId: orderId, amount, method }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("Erreur");
  }

  return (
    <div className="flex gap-1">
      <button
        disabled={loading}
        onClick={() => pay("CASH")}
        className="btn-primary text-xs"
      >
        Cash
      </button>
      <button
        disabled={loading}
        onClick={() => pay("CARD")}
        className="btn-secondary text-xs"
      >
        Carte
      </button>
      <button
        disabled={loading}
        onClick={() => pay("MOBILE")}
        className="btn-secondary text-xs"
      >
        Mobile
      </button>
    </div>
  );
}
