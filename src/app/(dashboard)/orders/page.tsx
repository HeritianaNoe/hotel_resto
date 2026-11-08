import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { OrderForm } from "./OrderForm";
import { OrderStatusButtons } from "./OrderStatusButtons";
import { Pagination } from "@/components/Pagination";
import { PdfExportButton } from "@/components/PdfExportButton";

const PAGE_SIZE = 10;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (
    !session ||
    !hasRole(
      session.user.roles,
      "ADMIN",
      "MANAGER",
      "WAITER",
      "CHEF",
      "CASHIER",
      "GUEST"
    )
  ) {
    redirect("/dashboard");
  }

  const roles = session.user.roles;
  const canCreate = hasRole(roles, "ADMIN", "MANAGER", "WAITER", "GUEST");
  const canChangeStatus = hasRole(
    roles,
    "ADMIN",
    "MANAGER",
    "WAITER",
    "CHEF",
    "CASHIER"
  );

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [orders, total, tables, menuItems] = await Promise.all([
    prisma.foodOrder.findMany({
      include: {
        diningTable: true,
        waiter: { select: { fullName: true, username: true } },
        orderItems: { include: { menuItem: true } },
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.foodOrder.count(),
    prisma.diningTable.findMany({ orderBy: { number: "asc" } }),
    prisma.menuItem.findMany({
      where: { available: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PREPARING: "bg-blue-100 text-blue-800",
    READY: "bg-emerald-100 text-emerald-800",
    SERVED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-800",
    PAID: "bg-teal-100 text-teal-800",
  };

  const pdfRows = orders.map((order) => {
    const orderTotal = order.orderItems.reduce(
      (sum, oi) => sum + Number(oi.unitPrice) * oi.quantity,
      0
    );
    const items = order.orderItems
      .map((oi) => `${oi.quantity}× ${oi.menuItem.name}`)
      .join(", ");
    return {
      table: `Table ${order.diningTable.number}`,
      statut: order.status,
      items,
      total: formatMoney(orderTotal),
      date: formatDate(order.createdAt),
      serveur: order.waiter?.fullName || order.waiter?.username || "—",
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
          <p className="text-slate-500">Commandes restaurant — tables</p>
        </div>
        {canCreate && (
          <OrderForm
            tables={tables.map((t) => ({
              id: t.id.toString(),
              number: t.number,
              seats: t.seats,
            }))}
            menuItems={menuItems.map((m) => ({
              id: m.id.toString(),
              name: m.name,
              price: Number(m.price),
              category: m.category,
            }))}
          />
        )}
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderTotal = order.orderItems.reduce(
            (sum, oi) => sum + Number(oi.unitPrice) * oi.quantity,
            0
          );
          return (
            <div key={order.id.toString()} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">
                      Table {order.diningTable.number}
                    </span>
                    <span
                      className={`badge ${statusColor[order.status] || "bg-slate-100"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(order.createdAt)}
                    {order.waiter &&
                      ` · Serveur: ${order.waiter.fullName || order.waiter.username}`}
                  </p>
                </div>
                <p className="text-xl font-bold text-teal-700">
                  {formatMoney(orderTotal)}
                </p>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {order.orderItems.map((oi) => (
                  <li key={oi.id.toString()} className="flex justify-between">
                    <span>
                      {oi.quantity}× {oi.menuItem.name}
                    </span>
                    <span className="text-slate-600">
                      {formatMoney(Number(oi.unitPrice) * oi.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {canChangeStatus &&
                order.status !== "PAID" &&
                order.status !== "CANCELLED" && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <OrderStatusButtons
                      orderId={order.id.toString()}
                      current={order.status}
                    />
                  </div>
                )}
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="p-8 text-center text-slate-400">Aucune commande</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/orders"
        />
        <PdfExportButton
          title="Liste des commandes"
          filename={`commandes-${new Date().toISOString().slice(0, 10)}.pdf`}
          columns={[
            { header: "Table", dataKey: "table" },
            { header: "Statut", dataKey: "statut" },
            { header: "Articles", dataKey: "items" },
            { header: "Total", dataKey: "total" },
            { header: "Date", dataKey: "date" },
            { header: "Serveur", dataKey: "serveur" },
          ]}
          rows={pdfRows}
          label="Exporter PDF"
        />
      </div>
    </div>
  );
}
