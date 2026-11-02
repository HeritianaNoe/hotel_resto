"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function MenuForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Plat",
    available: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ name: "", description: "", price: "", category: "Plat", available: true });
      router.refresh();
    } else {
      alert("Erreur");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Hanampy
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Menu item vaovao</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Anarana</label>
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
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>Plat</option>
                  <option>Entrée</option>
                  <option>Snack</option>
                  <option>Boisson</option>
                  <option>Dessert</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
