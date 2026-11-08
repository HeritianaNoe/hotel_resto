"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/components/DialogProvider";

export function CreateInvoiceButton({
  orderId,
  reservationId,
  amount,
}: {
  orderId?: string;
  reservationId?: string;
  amount: number;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [loading, setLoading] = useState(false);

  async function pay(method: string) {
    setLoading(true);
    const body: Record<string, unknown> = { amount, method };
    if (reservationId) body.reservationId = reservationId;
    else if (orderId) body.foodOrderId = orderId;

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      await dialog.error(data.error || "Erreur");
    }
  }

  return (
    <div className="flex gap-1">
      <button
        disabled={loading}
        onClick={() => pay("CASH")}
        className="btn-primary text-xs"
      >
        Espèces
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
