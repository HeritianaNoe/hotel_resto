import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StockForm, StockDeleteButton } from "./StockForm";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER", "CHEF")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    prisma.stockItem.findMany({
      orderBy: { name: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.stockItem.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canEdit = hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Stock</h1>
          <p className="page-subtitle">
            Gestion du stock cuisine &amp; bar · {total} article{total !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && <StockForm />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {items.map((s) => {
          const low =
            s.minLevel !== null && Number(s.quantity) <= Number(s.minLevel);
          return (
            <div
              key={s.id.toString()}
              className={`card ${low ? "border-red-200 bg-red-50/50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {Number(s.quantity)} {s.unit || ""}
                    {s.minLevel !== null && (
                      <span className="text-slate-400">
                        {" "}
                        · min. {Number(s.minLevel)}
                      </span>
                    )}
                  </p>
                  {s.supplier && (
                    <p className="mt-0.5 text-xs text-slate-400">{s.supplier}</p>
                  )}
                </div>
                {low ? (
                  <span className="badge bg-red-100 text-red-800">Bas</span>
                ) : (
                  <span className="badge bg-emerald-100 text-emerald-800">OK</span>
                )}
              </div>
              {canEdit && (
                <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                  <StockForm
                    item={{
                      id: s.id.toString(),
                      name: s.name,
                      quantity: Number(s.quantity),
                      unit: s.unit,
                      minLevel: s.minLevel !== null ? Number(s.minLevel) : null,
                      supplier: s.supplier,
                    }}
                    trigger="icon"
                  />
                  <StockDeleteButton itemId={s.id.toString()} name={s.name} />
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="py-12 text-center text-slate-400">Aucun article en stock</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="table-container hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Article</th>
                <th className="px-5 py-3.5 font-semibold">Quantité</th>
                <th className="px-5 py-3.5 font-semibold">Minimum</th>
                <th className="px-5 py-3.5 font-semibold">Fournisseur</th>
                <th className="px-5 py-3.5 font-semibold">État</th>
                {canEdit && (
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((s) => {
                const low =
                  s.minLevel !== null && Number(s.quantity) <= Number(s.minLevel);
                return (
                  <tr
                    key={s.id.toString()}
                    className={`transition ${low ? "bg-red-50/60" : "hover:bg-slate-50/80"}`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {Number(s.quantity)} {s.unit || ""}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {s.minLevel !== null
                        ? `${Number(s.minLevel)} ${s.unit || ""}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{s.supplier || "—"}</td>
                    <td className="px-5 py-3.5">
                      {low ? (
                        <span className="badge bg-red-100 text-red-800">Bas</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-800">OK</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <StockForm
                            item={{
                              id: s.id.toString(),
                              name: s.name,
                              quantity: Number(s.quantity),
                              unit: s.unit,
                              minLevel:
                                s.minLevel !== null ? Number(s.minLevel) : null,
                              supplier: s.supplier,
                            }}
                            trigger="icon"
                          />
                          <StockDeleteButton
                            itemId={s.id.toString()}
                            name={s.name}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucun article en stock</p>
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
                href={`/stock?page=${page - 1}`}
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
                href={`/stock?page=${page + 1}`}
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
