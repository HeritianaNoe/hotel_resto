import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { redirect } from "next/navigation";
import { RoomActions } from "./RoomActions";

const statusLabel: Record<string, string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Occupée",
  MAINTENANCE: "Maintenance",
  RESERVED: "Réservée",
};

const statusColor: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  OCCUPIED: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  RESERVED: "bg-blue-100 text-blue-800",
};

export default async function RoomsPage() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST")) {
    redirect("/dashboard");
  }

  const rooms = await prisma.room.findMany({ orderBy: { number: "asc" } });
  const canEdit = hasRole(session.user.roles, "ADMIN", "MANAGER");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Chambres</h1>
          <p className="page-subtitle">Gestion des chambres de l&apos;hôtel</p>
        </div>
        {canEdit && <RoomActions />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {rooms.map((r) => (
          <div key={r.id.toString()} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">Chambre {r.number}</p>
                <p className="text-sm text-slate-500">{r.type}</p>
              </div>
              <span className={`badge ${statusColor[r.status] || "bg-slate-100 text-slate-700"}`}>
                {statusLabel[r.status] || r.status}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-teal-700">
              {formatMoney(r.pricePerNight)}
              <span className="font-normal text-slate-400"> / nuit</span>
            </p>
          </div>
        ))}
        {rooms.length === 0 && (
          <p className="py-12 text-center text-slate-400">Aucune chambre enregistrée</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="table-container hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">N°</th>
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-5 py-3.5 font-semibold">Prix / nuit</th>
                <th className="px-5 py-3.5 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((r) => (
                <tr key={r.id.toString()} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{r.number}</td>
                  <td className="px-5 py-3.5 text-slate-600">{r.type}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {formatMoney(r.pricePerNight)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${statusColor[r.status] || "bg-slate-100 text-slate-700"}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rooms.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucune chambre enregistrée</p>
        )}
      </div>
    </div>
  );
}
