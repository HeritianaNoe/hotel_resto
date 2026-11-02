"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

type StockRow = {
  id: string;
  name: string;
  quantity: string | number;
  unit: string | null;
  minLevel: string | number | null;
  supplier: string | null;
};

export function StockForm({
  item,
  trigger,
}: {
  item?: StockRow;
  trigger?: "button" | "icon";
}) {
  const router = useRouter();
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: item?.name || "",
    quantity: item ? String(item.quantity) : "",
    unit: item?.unit || "kg",
    minLevel: item?.minLevel != null ? String(item.minLevel) : "",
    supplier: item?.supplier || "",
  });

  function openModal() {
    if (item) {
      setForm({
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit || "kg",
        minLevel: item.minLevel != null ? String(item.minLevel) : "",
        supplier: item.supplier || "",
      });
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit || null,
      minLevel: form.minLevel ? Number(form.minLevel) : null,
      supplier: form.supplier || null,
    };

    if (isEdit) payload.id = item!.id;

    const res = await fetch("/api/stock", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      setOpen(false);
      if (!isEdit) {
        setForm({ name: "", quantity: "", unit: "kg", minLevel: "", supplier: "" });
      }
      router.refresh();
    } else {
      alert("Erreur lors de l'enregistrement");
    }
  }

  return (
    <>
      {trigger === "icon" ? (
        <button
          onClick={openModal}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={openModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouvel article
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {isEdit ? "Modifier l'article" : "Nouvel article de stock"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom de l&apos;article</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Unité</label>
                  <input
                    className="input"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="kg, L, pcs..."
                  />
                </div>
              </div>
              <div>
                <label className="label">Niveau minimum (alerte)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.minLevel}
                  onChange={(e) => setForm({ ...form, minLevel: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
              <div>
                <label className="label">Fournisseur</label>
                <input
                  className="input"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "..." : isEdit ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function StockDeleteButton({
  itemId,
  name,
}: {
  itemId: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer l'article « ${name} » ? Cette action est irréversible.`)) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/stock?id=${itemId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Erreur lors de la suppression");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      title="Supprimer"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
