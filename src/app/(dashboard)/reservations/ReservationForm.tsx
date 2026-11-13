"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

type Room = { id: string; number: string; type: string; pricePerNight: number };
type Guest = { id: string; name: string };

type ReservationRow = {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

export function ReservationForm({
  rooms,
  guests,
  canSelectGuest,
  reservation,
}: {
  rooms: Room[];
  guests: Guest[];
  canSelectGuest: boolean;
  reservation?: ReservationRow;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const isEdit = !!reservation;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    roomId: reservation?.roomId || rooms[0]?.id || "",
    guestId: reservation?.guestId || guests[0]?.id || "",
    checkIn: reservation?.checkIn || "",
    checkOut: reservation?.checkOut || "",
    status: reservation?.status || "CONFIRMED",
  });

  function openModal() {
    if (reservation) {
      setForm({
        roomId: reservation.roomId,
        guestId: reservation.guestId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        status: reservation.status,
      });
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, string> = {
      roomId: form.roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      status: form.status,
    };
    if (canSelectGuest && form.guestId) body.guestId = form.guestId;
    if (isEdit) body.id = reservation!.id;

    const res = await fetch("/api/reservations", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      await dialog.error(err.error || "Erreur");
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
        <button onClick={openModal} className="btn-primary" disabled={rooms.length === 0}>
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {isEdit ? "Modifier la réservation" : "Nouvelle réservation"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Chambre</label>
                <select
                  className="input"
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  required
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.number} — {r.type} ({r.pricePerNight.toLocaleString()} Ar)
                    </option>
                  ))}
                </select>
              </div>
              {canSelectGuest && guests.length > 0 && (
                <div>
                  <label className="label">Client</label>
                  <select
                    className="input"
                    value={form.guestId}
                    onChange={(e) => setForm({ ...form, guestId: e.target.value })}
                  >
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Check-in</label>
                <input
                  type="date"
                  className="input"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Check-out</label>
                <input
                  type="date"
                  className="input"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  required
                />
              </div>
              {isEdit && (
                <div>
                  <label className="label">Statut</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="CHECKED_OUT">CHECKED_OUT</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              )}
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

export function ReservationDeleteButton({
  reservationId,
  label,
}: {
  reservationId: string;
  label: string;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = await dialog.confirm(`Supprimer la réservation « ${label} » ?`);
    if (!ok) return;
    setLoading(true);
    const res = await fetch(`/api/reservations?id=${reservationId}`, { method: "DELETE" });
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
