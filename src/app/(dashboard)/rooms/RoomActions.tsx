"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function RoomActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    number: "",
    type: "SINGLE",
    pricePerNight: "",
    status: "AVAILABLE",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pricePerNight: Number(form.pricePerNight),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ number: "", type: "SINGLE", pricePerNight: "", status: "AVAILABLE" });
      router.refresh();
    } else {
      alert("Erreur lors de la création");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        Hanampy efitrano
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Efitrano vaovao</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Numéro</label>
                <input
                  className="input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                  placeholder="101"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="SINGLE">SINGLE</option>
                  <option value="DOUBLE">DOUBLE</option>
                  <option value="FAMILY">FAMILY</option>
                  <option value="SUITE">SUITE</option>
                </select>
              </div>
              <div>
                <label className="label">Prix / nuit (Ar)</label>
                <input
                  type="number"
                  className="input"
                  value={form.pricePerNight}
                  onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="RESERVED">RESERVED</option>
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
