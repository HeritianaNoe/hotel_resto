"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

type MenuItemData = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
};

const emptyForm: MenuItemData = {
  name: "",
  description: "",
  price: "",
  category: "Plat",
  available: true,
};

export function MenuForm({
  item,
  trigger,
}: {
  item?: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    category: string | null;
    available: boolean;
  };
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const isEdit = !!item;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<MenuItemData>(
    item
      ? {
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: String(item.price),
          category: item.category || "Plat",
          available: item.available,
        }
      : emptyForm
  );

  function openModal() {
    if (item) {
      setForm({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: String(item.price),
        category: item.category || "Plat",
        available: item.available,
      });
    } else {
      setForm(emptyForm);
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/menu", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: form.id,
        price: Number(form.price),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      if (!isEdit) setForm(emptyForm);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      await dialog.error(data.error || "Erreur");
    }
  }

  return (
    <>
      {trigger ? (
        <button type="button" onClick={openModal} className="contents">
          {trigger}
        </button>
      ) : (
        <button onClick={openModal} className="btn-primary">
          {isEdit ? (
            <>
              <Pencil className="h-4 w-4" />
              Modifier
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Ajouter
            </>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {isEdit ? "Modifier l'élément" : "Nouvel élément de menu"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nom</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label">Prix (Ar)</label>
                <input
                  type="number"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option>Plat</option>
                  <option>Entrée</option>
                  <option>Snack</option>
                  <option>Boisson</option>
                  <option>Dessert</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.available}
                  onChange={(e) =>
                    setForm({ ...form, available: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="available" className="text-sm text-slate-700">
                  Disponible
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
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
