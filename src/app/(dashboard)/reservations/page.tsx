import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ReservationForm, ReservationDeleteButton } from "./ReservationForm";
import { Pagination } from "@/components/Pagination";
import { PdfExportButton } from "@/components/PdfExportButton";

const PAGE_SIZE = 10;

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const roles = session.user.roles;
  const canManage = hasRole(roles, "ADMIN", "MANAGER", "RECEPTIONIST");
  const isGuestOnly = hasRole(roles, "GUEST") && !canManage;

  if (!canManage && !isGuestOnly) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = isGuestOnly ? { guestId: BigInt(session.user.id) } : undefined;

  const [reservations, total, rooms, guests] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        room: true,
        guest: { select: { id: true, fullName: true, username: true } },
        invoice: true,
      },
      orderBy: { checkIn: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.reservation.count({ where }),
    prisma.room.findMany({ orderBy: { number: "asc" } }),
    canManage
      ? prisma.user.findMany({
          where: { roles: { some: { role: { name: "GUEST" } } } },
          select: { id: true, fullName: true, username: true },
        })
      : Promise.resolve([] as { id: bigint; fullName: string | null; username: string }[]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-emerald-100 text-emerald-800",
    CHECKED_OUT: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-800",
  };

  function toDateInput(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const roomsPayload = rooms.map((r) => ({
    id: r.id.toString(),
    number: r.number,
    type: r.type,
    pricePerNight: Number(r.pricePerNight),
  }));
  const guestsPayload = guests.map((g) => ({
    id: g.id.toString(),
    name: g.fullName || g.username,
  }));

  const pdfRows = reservations.map((r) => ({
    chambre: `${r.room.number} (${r.room.type})`,
    client: r.guest.fullName || r.guest.username,
    checkIn: formatDate(r.checkIn),
    checkOut: formatDate(r.checkOut),
    total: r.totalPrice ? formatMoney(r.totalPrice) : "—",
    statut: r.status,
    paiement: r.invoice ? "Payé" : "Non payé",
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Réservations</h1>
          <p className="page-subtitle">
            {isGuestOnly
              ? "Vos réservations"
              : "Gestion des réservations de chambres"}
          </p>
        </div>
        {canManage && (
          <ReservationForm
            rooms={roomsPayload}
            guests={guestsPayload}
            canSelectGuest={canManage}
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {reservations.map((r) => (
          <div key={r.id.toString()} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {r.room.number} ({r.room.type})
                </p>
                {!isGuestOnly && (
                  <p className="text-sm text-slate-500">
                    {r.guest.fullName || r.guest.username}
                  </p>
                )}
              </div>
              <span className={`badge ${statusColor[r.status] || "bg-slate-100"}`}>
                {r.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>
                {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
              </span>
              <span className="font-semibold text-teal-700">
                {r.totalPrice ? formatMoney(r.totalPrice) : "—"}
              </span>
              {r.invoice && (
                <span className="badge bg-emerald-100 text-emerald-800">Payé</span>
              )}
            </div>
            {canManage && (
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                <ReservationForm
                  rooms={roomsPayload}
                  guests={guestsPayload}
                  canSelectGuest={canManage}
                  reservation={{
                    id: r.id.toString(),
                    roomId: r.roomId.toString(),
                    guestId: r.guestId.toString(),
                    checkIn: toDateInput(r.checkIn),
                    checkOut: toDateInput(r.checkOut),
                    status: r.status,
                  }}
                />
                <ReservationDeleteButton
                  reservationId={r.id.toString()}
                  label={`${r.room.number} (${formatDate(r.checkIn)})`}
                />
              </div>
            )}
          </div>
        ))}
        {reservations.length === 0 && (
          <p className="py-12 text-center text-slate-400">Aucune réservation</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="table-container hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Chambre</th>
                {!isGuestOnly && (
                  <th className="px-5 py-3.5 font-semibold">Client</th>
                )}
                <th className="px-5 py-3.5 font-semibold">Check-in</th>
                <th className="px-5 py-3.5 font-semibold">Check-out</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Statut</th>
                <th className="px-5 py-3.5 font-semibold">Paiement</th>
                {canManage && (
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r) => (
                <tr
                  key={r.id.toString()}
                  className="transition hover:bg-slate-50/80"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {r.room.number} ({r.room.type})
                  </td>
                  {!isGuestOnly && (
                    <td className="px-5 py-3.5 text-slate-600">
                      {r.guest.fullName || r.guest.username}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatDate(r.checkIn)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatDate(r.checkOut)}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-teal-700">
                    {r.totalPrice ? formatMoney(r.totalPrice) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`badge ${statusColor[r.status] || "bg-slate-100"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {r.invoice ? (
                      <span className="badge bg-emerald-100 text-emerald-800">
                        Payé
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-800">
                        Non payé
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <ReservationForm
                          rooms={roomsPayload}
                          guests={guestsPayload}
                          canSelectGuest={canManage}
                          reservation={{
                            id: r.id.toString(),
                            roomId: r.roomId.toString(),
                            guestId: r.guestId.toString(),
                            checkIn: toDateInput(r.checkIn),
                            checkOut: toDateInput(r.checkOut),
                            status: r.status,
                          }}
                        />
                        <ReservationDeleteButton
                          reservationId={r.id.toString()}
                          label={`${r.room.number} (${formatDate(r.checkIn)})`}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reservations.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucune réservation</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/reservations"
        />
        <PdfExportButton
          title="Liste des réservations"
          filename={`reservations-${new Date().toISOString().slice(0, 10)}.pdf`}
          columns={[
            { header: "Chambre", dataKey: "chambre" },
            { header: "Client", dataKey: "client" },
            { header: "Check-in", dataKey: "checkIn" },
            { header: "Check-out", dataKey: "checkOut" },
            { header: "Total", dataKey: "total" },
            { header: "Statut", dataKey: "statut" },
            { header: "Paiement", dataKey: "paiement" },
          ]}
          rows={pdfRows}
          label="Exporter PDF"
        />
      </div>
    </div>
  );
}
