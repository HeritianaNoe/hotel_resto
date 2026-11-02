import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ReservationForm } from "./ReservationForm";

export default async function ReservationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const roles = session.user.roles;
  const canManage = hasRole(roles, "ADMIN", "MANAGER", "RECEPTIONIST");
  const isGuestOnly =
    hasRole(roles, "GUEST") && !canManage;

  if (!canManage && !isGuestOnly) {
    redirect("/dashboard");
  }

  const reservations = await prisma.reservation.findMany({
    where: isGuestOnly ? { guestId: BigInt(session.user.id) } : undefined,
    include: {
      room: true,
      guest: { select: { fullName: true, username: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  const rooms = await prisma.room.findMany({
    where: { status: { in: ["AVAILABLE", "RESERVED"] } },
    orderBy: { number: "asc" },
  });

  const guests = canManage
    ? await prisma.user.findMany({
        where: {
          roles: { some: { role: { name: "GUEST" } } },
        },
        select: { id: true, fullName: true, username: true },
      })
    : [];

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-emerald-100 text-emerald-800",
    CHECKED_OUT: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Réservations</h1>
          <p className="text-slate-500">
            {isGuestOnly ? "Ny réservation-nao" : "Fitantanana réservation efitrano"}
          </p>
        </div>
        <ReservationForm
          rooms={rooms.map((r) => ({
            id: r.id.toString(),
            number: r.number,
            type: r.type,
            pricePerNight: Number(r.pricePerNight),
          }))}
          guests={guests.map((g) => ({
            id: g.id.toString(),
            name: g.fullName || g.username,
          }))}
          canSelectGuest={canManage}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Efitrano</th>
              {!isGuestOnly && <th className="px-4 py-3 font-medium">Client</th>}
              <th className="px-4 py-3 font-medium">Check-in</th>
              <th className="px-4 py-3 font-medium">Check-out</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reservations.map((r) => (
              <tr key={r.id.toString()} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  {r.room.number} ({r.room.type})
                </td>
                {!isGuestOnly && (
                  <td className="px-4 py-3">{r.guest.fullName || r.guest.username}</td>
                )}
                <td className="px-4 py-3">{formatDate(r.checkIn)}</td>
                <td className="px-4 py-3">{formatDate(r.checkOut)}</td>
                <td className="px-4 py-3">
                  {r.totalPrice ? formatMoney(r.totalPrice) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusColor[r.status] || "bg-slate-100"}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && (
          <p className="p-8 text-center text-slate-400">Tsy misy réservation</p>
        )}
      </div>
    </div>
  );
}
