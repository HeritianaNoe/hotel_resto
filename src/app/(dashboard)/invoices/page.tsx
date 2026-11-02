import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { CreateInvoiceButton } from "./CreateInvoiceButton";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER", "CASHIER")) {
    redirect("/dashboard");
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      foodOrder: { include: { diningTable: true } },
      cashier: { select: { fullName: true, username: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const unpaidOrders = await prisma.foodOrder.findMany({
    where: {
      status: { in: ["SERVED", "READY"] },
      invoice: null,
    },
    include: {
      diningTable: true,
      orderItems: true,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
        <p className="text-slate-500">Paiements des commandes</p>
      </div>

      {unpaidOrders.length > 0 && (
        <div className="card mb-6">
          <h2 className="mb-3 font-semibold text-slate-800">Commandes à encaisser</h2>
          <div className="space-y-2">
            {unpaidOrders.map((o) => {
              const total = o.orderItems.reduce(
                (s, oi) => s + Number(oi.unitPrice) * oi.quantity,
                0
              );
              return (
                <div
                  key={o.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <span className="font-medium">Table {o.diningTable.number}</span>
                    <span className="ml-2 text-sm text-slate-500">{o.status}</span>
                    <span className="ml-3 font-semibold text-teal-700">
                      {formatMoney(total)}
                    </span>
                  </div>
                  <CreateInvoiceButton orderId={o.id.toString()} amount={total} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Méthode</th>
              <th className="px-4 py-3 font-medium">Caissier</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id.toString()} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  Table {inv.foodOrder.diningTable.number}
                </td>
                <td className="px-4 py-3 font-semibold text-teal-700">
                  {formatMoney(inv.amount)}
                </td>
                <td className="px-4 py-3">{inv.method}</td>
                <td className="px-4 py-3">
                  {inv.cashier?.fullName || inv.cashier?.username || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(inv.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <p className="p-8 text-center text-slate-400">Tsy misy faktiora</p>
        )}
      </div>
    </div>
  );
}
