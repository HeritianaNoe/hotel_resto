import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { CreateInvoiceButton } from "./CreateInvoiceButton";
import { Pagination } from "@/components/Pagination";
import { PdfExportButton } from "@/components/PdfExportButton";

const PAGE_SIZE = 10;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (
    !session ||
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER", "RECEPTIONIST")
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [invoices, total, unpaidOrders, unpaidReservations] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        foodOrder: { include: { diningTable: true } },
        reservation: {
          include: {
            room: true,
            guest: { select: { fullName: true, username: true } },
          },
        },
        cashier: { select: { fullName: true, username: true } },
      },
      orderBy: { paidAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count(),
    prisma.foodOrder.findMany({
      where: {
        status: { in: ["SERVED", "READY"] },
        invoice: null,
      },
      include: {
        diningTable: true,
        orderItems: true,
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        invoice: null,
        totalPrice: { not: null },
      },
      include: {
        room: true,
        guest: { select: { fullName: true, username: true } },
      },
      orderBy: { checkOut: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pdfRows = invoices.map((inv) => {
    const isRoom = inv.type === "ROOM" || inv.reservationId;
    let detail = "—";
    if (isRoom && inv.reservation) {
      detail = `Chambre ${inv.reservation.room.number} (${inv.reservation.guest.fullName || inv.reservation.guest.username})`;
    } else if (inv.foodOrder) {
      detail = `Table ${inv.foodOrder.diningTable.number}`;
    }
    return {
      type: isRoom ? "Chambre" : "Restaurant",
      detail,
      amount: formatMoney(inv.amount),
      method: inv.method,
      cashier: inv.cashier?.fullName || inv.cashier?.username || "—",
      date: formatDate(inv.paidAt),
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Factures</h1>
        <p className="page-subtitle">Paiements restaurant et chambres</p>
      </div>

      {/* Unpaid food orders */}
      {unpaidOrders.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 font-semibold text-slate-800">
            🍽️ Commandes restaurant à encaisser
          </h2>
          <div className="space-y-2">
            {unpaidOrders.map((o) => {
              const totalAmt = o.orderItems.reduce(
                (s, oi) => s + Number(oi.unitPrice) * oi.quantity,
                0
              );
              return (
                <div
                  key={o.id.toString()}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium">Table {o.diningTable.number}</span>
                    <span className="ml-2 text-sm text-slate-500">{o.status}</span>
                    <span className="ml-3 font-semibold text-teal-700">
                      {formatMoney(totalAmt)}
                    </span>
                  </div>
                  <CreateInvoiceButton orderId={o.id.toString()} amount={totalAmt} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unpaid room reservations */}
      {unpaidReservations.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 font-semibold text-slate-800">
            🛏️ Chambres à encaisser
          </h2>
          <div className="space-y-2">
            {unpaidReservations.map((r) => (
              <div
                key={r.id.toString()}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">
                    Chambre {r.room.number} ({r.room.type})
                  </span>
                  <span className="ml-2 text-sm text-slate-500">
                    {r.guest.fullName || r.guest.username}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                  </span>
                  <span className="ml-3 font-semibold text-teal-700">
                    {formatMoney(r.totalPrice || 0)}
                  </span>
                  <span
                    className={`ml-2 badge ${
                      r.status === "CHECKED_IN"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <CreateInvoiceButton
                  reservationId={r.id.toString()}
                  amount={Number(r.totalPrice || 0)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All invoices */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-5 py-3.5 font-semibold">Détail</th>
                <th className="px-5 py-3.5 font-semibold">Montant</th>
                <th className="px-5 py-3.5 font-semibold">Méthode</th>
                <th className="px-5 py-3.5 font-semibold">Caissier</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const isRoom = inv.type === "ROOM" || inv.reservationId;
                return (
                  <tr
                    key={inv.id.toString()}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`badge ${
                          isRoom
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {isRoom ? "Chambre" : "Restaurant"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {isRoom && inv.reservation ? (
                        <>
                          Chambre {inv.reservation.room.number}
                          <span className="ml-1 text-sm font-normal text-slate-500">
                            (
                            {inv.reservation.guest.fullName ||
                              inv.reservation.guest.username}
                            )
                          </span>
                        </>
                      ) : inv.foodOrder ? (
                        <>Table {inv.foodOrder.diningTable.number}</>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-teal-700">
                      {formatMoney(inv.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{inv.method}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {inv.cashier?.fullName || inv.cashier?.username || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(inv.paidAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucune facture</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/invoices"
        />
        <PdfExportButton
          title="Liste des factures"
          filename={`factures-${new Date().toISOString().slice(0, 10)}.pdf`}
          columns={[
            { header: "Type", dataKey: "type" },
            { header: "Détail", dataKey: "detail" },
            { header: "Montant", dataKey: "amount" },
            { header: "Méthode", dataKey: "method" },
            { header: "Caissier", dataKey: "cashier" },
            { header: "Date", dataKey: "date" },
          ]}
          rows={pdfRows}
          label="Exporter PDF"
        />
      </div>
    </div>
  );
}
