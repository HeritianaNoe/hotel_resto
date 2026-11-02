import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { OrderForm } from "./OrderForm";
import { OrderStatusButtons } from "./OrderStatusButtons";

export default async function OrdersPage() {
  const session = await auth();
  if (
    !session ||
    !hasRole(session.user.roles, "ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER", "GUEST")
  ) {
    redirect("/dashboard");
  }

  const roles = session.user.roles;
  const canCreate = hasRole(roles, "ADMIN", "MANAGER", "WAITER", "GUEST");
  const canChangeStatus = hasRole(roles, "ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER");

  const orders = await prisma.foodOrder.findMany({
    include: {
      diningTable: true,
      waiter: { select: { fullName: true, username: true } },
      orderItems: { include: { menuItem: true } },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const tables = await prisma.diningTable.findMany({ orderBy: { number: "asc" } });
  const menuItems = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { name: "asc" },
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PREPARING: "bg-blue-100 text-blue-800",
    READY: "bg-emerald-100 text-emerald-800",
    SERVED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-800",
    PAID: "bg-teal-100 text-teal-800",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
          <p className="text-slate-500">Commandes sakafo — tables</p>
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
          const total = order.orderItems.reduce(
            (sum, oi) => sum + Number(oi.unitPrice) * oi.quantity,
            0
          );
          return (
            <div key={order.id.toString()} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">Table {order.diningTable.number}</span>
                    <span className={`badge ${statusColor[order.status] || "bg-slate-100"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(order.createdAt)}
                    {order.waiter && ` · Serveur: ${order.waiter.fullName || order.waiter.username}`}
                  </p>
                </div>
                <p className="text-xl font-bold text-teal-700">{formatMoney(total)}</p>
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

              {canChangeStatus && order.status !== "PAID" && order.status !== "CANCELLED" && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <OrderStatusButtons orderId={order.id.toString()} current={order.status} />
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="p-8 text-center text-slate-400">Tsy misy commande</p>
        )}
      </div>
    </div>
  );
}
