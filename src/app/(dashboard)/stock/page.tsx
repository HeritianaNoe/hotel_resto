import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StockForm, StockDeleteButton } from "./StockForm";

export default async function StockPage() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER", "CHEF")) {
    redirect("/dashboard");
  }

  const items = await prisma.stockItem.findMany({ orderBy: { name: "asc" } });
  const canEdit = hasRole(session.user.roles, "ADMIN", "MANAGER", "STOCK_KEEPER");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Stock</h1>
          <p className="page-subtitle">Gestion du stock cuisine &amp; bar</p>
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
    </div>
  );
}
