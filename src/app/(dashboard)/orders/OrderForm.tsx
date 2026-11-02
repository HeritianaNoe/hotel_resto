"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "lucide-react";

type Table = { id: string; number: number; seats: number };
type MenuItem = { id: string; name: string; price: number; category: string | null };

export function OrderForm({
  tables,
  menuItems,
}: {
  tables: Table[];
  menuItems: MenuItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableId, setTableId] = useState(tables[0]?.id || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function setQty(id: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (items.length === 0) {
      alert("Misafidiana sakafo farafahakeliny 1");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diningTableId: tableId, items }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setQuantities({});
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Commande vaovao
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nouvelle commande</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Table</label>
                <select
                  className="input"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  required
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} ({t.seats} places)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Sakafo</label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {menuItems.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-slate-500">
                          {m.price.toLocaleString()} Ar
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-slate-100 p-1 hover:bg-slate-200"
                          onClick={() => setQty(m.id, -1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {quantities[m.id] || 0}
                        </span>
                        <button
                          type="button"
                          className="rounded-full bg-teal-100 p-1 text-teal-700 hover:bg-teal-200"
                          onClick={() => setQty(m.id, 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "..." : "Créer commande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
