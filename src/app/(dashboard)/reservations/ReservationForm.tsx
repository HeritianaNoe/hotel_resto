"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type Room = { id: string; number: string; type: string; pricePerNight: number };
type Guest = { id: string; name: string };

export function ReservationForm({
  rooms,
  guests,
  canSelectGuest,
}: {
  rooms: Room[];
  guests: Guest[];
  canSelectGuest: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    roomId: rooms[0]?.id || "",
    guestId: guests[0]?.id || "",
    checkIn: "",
    checkOut: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, string> = {
      roomId: form.roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
    };
    if (canSelectGuest && form.guestId) body.guestId = form.guestId;

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary" disabled={rooms.length === 0}>
        <Plus className="h-4 w-4" />
        Réservation vaovao
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Nouvelle réservation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Efitrano</label>
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
