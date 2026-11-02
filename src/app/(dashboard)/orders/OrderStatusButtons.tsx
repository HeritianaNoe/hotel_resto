"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const transitions: Record<string, string[]> = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED", "CANCELLED"],
  SERVED: ["PAID"],
};

export function OrderStatusButtons({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const next = transitions[current] || [];

  async function update(status: string) {
    setLoading(true);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    setLoading(false);
    router.refresh();
  }

  if (next.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <button
          key={s}
          disabled={loading}
          onClick={() => update(s)}
          className={
            s === "CANCELLED"
              ? "btn-danger text-xs"
              : s === "PAID"
                ? "btn-primary text-xs"
                : "btn-secondary text-xs"
          }
        >
          → {s}
        </button>
      ))}
    </div>
  );
}
