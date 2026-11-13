"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

type RoomRow = {
  id: string;
  number: string;
  type: string;
  pricePerNight: number;
  status: string;
};

export function RoomActions({ room }: { room?: RoomRow }) {
  const router = useRouter();
  const dialog = useDialog();
  const isEdit = !!room;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    number: room?.number || "",
    type: room?.type || "SINGLE",
    pricePerNight: room?.pricePerNight?.toString() || "",
    status: room?.status || "AVAILABLE",
  });

  function openModal() {
    if (room) {
      setForm({
        number: room.number,
        type: room.type,
        pricePerNight: room.pricePerNight.toString(),
        status: room.status,
      });
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...(isEdit ? { id: room!.id } : {}),
      number: form.number,
      type: form.type,
      pricePerNight: Number(form.pricePerNight),
      status: form.status,
    };
    const res = await fetch("/api/rooms", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      if (!isEdit) {
        setForm({ number: "", type: "SINGLE", pricePerNight: "", status: "AVAILABLE" });
      }
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      await dialog.error(data.error || "Erreur lors de l'enregistrement");
    }
  }

  return (
    <>
      {isEdit ? (
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
          Ajouter une chambre
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {isEdit ? "Modifier la chambre" : "Nouvelle chambre"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Numéro</label>
                <input
                  className="input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                  placeholder="101"
                  autoFocus={!isEdit}
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

export function RoomDeleteButton({
  roomId,
  number,
}: {
  roomId: string;
  number: string;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = await dialog.confirm(
      `Supprimer la chambre « ${number} » ? Cette action est irréversible.`
    );
    if (!ok) return;
    setLoading(true);
    const res = await fetch(`/api/rooms?id=${roomId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      await dialog.error(data.error || "Erreur lors de la suppression");
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
