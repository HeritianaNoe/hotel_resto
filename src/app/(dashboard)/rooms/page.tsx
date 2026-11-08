import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RoomActions, RoomDeleteButton } from "./RoomActions";
import { RoomTypeFilter } from "./RoomTypeFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 10;

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

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "RECEPTIONIST")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const typeFilter = params.type?.trim() || "";
  const skip = (page - 1) * PAGE_SIZE;

  const where = typeFilter ? { type: typeFilter } : {};

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: { number: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.room.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canEdit = hasRole(session.user.roles, "ADMIN", "MANAGER");

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (typeFilter) q.set("type", typeFilter);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/rooms?${qs}` : "/rooms";
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Chambres</h1>
          <p className="page-subtitle">
            Gestion des chambres de l&apos;hôtel · {total} chambre
            {total !== 1 ? "s" : ""}
            {typeFilter ? ` · ${typeFilter}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={<div className="input w-[160px] animate-pulse bg-slate-100" />}>
            <RoomTypeFilter />
          </Suspense>
          {canEdit && <RoomActions />}
        </div>
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
            {canEdit && (
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                <RoomActions
                  room={{
                    id: r.id.toString(),
                    number: r.number,
                    type: r.type,
                    pricePerNight: Number(r.pricePerNight),
                    status: r.status,
                  }}
                />
                <RoomDeleteButton roomId={r.id.toString()} number={r.number} />
              </div>
            )}
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
                {canEdit && <th className="px-5 py-3.5 font-semibold text-right">Actions</th>}
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
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <RoomActions
                          room={{
                            id: r.id.toString(),
                            number: r.number,
                            type: r.type,
                            pricePerNight: Number(r.pricePerNight),
                            status: r.status,
                          }}
                        />
                        <RoomDeleteButton roomId={r.id.toString()} number={r.number} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rooms.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucune chambre enregistrée</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">
                Suivant
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
