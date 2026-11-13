import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  DashboardCharts,
  MONTHS_FR,
  CATEGORY_COLORS,
  type MonthlyRevenue,
  type CategorySales,
} from "@/components/DashboardCharts";

export default async function DashboardPage() {
  const session = await auth();
  const roles = session?.user?.roles || [];

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const [
    roomsCount,
    availableRooms,
    reservationsCount,
    activeOrders,
    usersCount,
    invoices,
    foodOrders,
    guests,
    orderItemsWithMenu,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: "AVAILABLE" } }),
    prisma.reservation.count({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    }),
    prisma.foodOrder.count({
      where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
    }),
    prisma.user.count(),
    // Invoices for revenue by month
    prisma.invoice.findMany({
      where: {
        paidAt: { gte: yearStart, lte: yearEnd },
      },
      select: { amount: true, paidAt: true },
    }),
    // Orders for volume by month
    prisma.foodOrder.findMany({
      where: {
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      select: { createdAt: true },
    }),
    // New guests (GUEST role) created this year
    prisma.user.findMany({
      where: {
        createdAt: { gte: yearStart, lte: yearEnd },
        roles: { some: { role: { name: "GUEST" } } },
      },
      select: { createdAt: true },
    }),
    // Order items + menu category for pie chart
    prisma.orderItem.findMany({
      where: {
        foodOrder: {
          createdAt: { gte: yearStart, lte: yearEnd },
        },
      },
      select: {
        quantity: true,
        unitPrice: true,
        menuItem: { select: { category: true, name: true } },
      },
    }),
  ]);

  // Build monthly series (Jan–Dec)
  const monthlyMap: Record<
    number,
    { revenue: number; orders: number; newGuests: number }
  > = {};
  for (let m = 0; m < 12; m++) {
    monthlyMap[m] = { revenue: 0, orders: 0, newGuests: 0 };
  }

  for (const inv of invoices) {
    const m = inv.paidAt.getMonth();
    monthlyMap[m].revenue += Number(inv.amount);
  }
  for (const o of foodOrders) {
    const m = o.createdAt.getMonth();
    monthlyMap[m].orders += 1;
  }
  for (const g of guests) {
    const m = g.createdAt.getMonth();
    monthlyMap[m].newGuests += 1;
  }

  const monthly: MonthlyRevenue[] = Array.from({ length: 12 }, (_, i) => ({
    month: MONTHS_FR[i],
    monthKey: `${year}-${String(i + 1).padStart(2, "0")}`,
    revenue: Math.round(monthlyMap[i].revenue),
    orders: monthlyMap[i].orders,
    newGuests: monthlyMap[i].newGuests,
  }));

  // Category aggregation
  const catMap: Record<string, number> = {};
  for (const item of orderItemsWithMenu) {
    const cat = item.menuItem.category || "Autre";
    const amount = Number(item.unitPrice) * item.quantity;
    catMap[cat] = (catMap[cat] || 0) + amount;
  }
  const categories: CategorySales[] = Object.entries(catMap)
    .map(([name, value], i) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  type StatCard = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: typeof BedDouble;
    href: string;
    gradient: string;
    iconBg: string;
  };

  const cards: StatCard[] = [];

  if (hasRole(roles, "ADMIN", "MANAGER", "RECEPTIONIST")) {
    cards.push({
      title: "Chambres",
      value: `${availableRooms} / ${roomsCount}`,
      subtitle: "disponibles",
      icon: BedDouble,
      href: "/rooms",
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-50 text-blue-600",
    });
    cards.push({
      title: "Réservations",
      value: reservationsCount,
      subtitle: "confirmées / en cours",
      icon: CalendarCheck,
      href: "/reservations",
      gradient: "from-violet-500 to-violet-600",
      iconBg: "bg-violet-50 text-violet-600",
    });
  }

  if (hasRole(roles, "ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER")) {
    cards.push({
      title: "Commandes",
      value: activeOrders,
      subtitle: "en cours de traitement",
      icon: ClipboardList,
      href: "/orders",
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-50 text-amber-600",
    });
  }

  if (hasRole(roles, "ADMIN", "MANAGER")) {
    cards.push({
      title: "Utilisateurs",
      value: usersCount,
      subtitle: "comptes actifs",
      icon: Users,
      href: "/users",
      gradient: "from-slate-600 to-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
    });
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const showCharts = hasRole(roles, "ADMIN", "MANAGER", "CASHIER");

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-600">{greeting}</p>
          <h1 className="page-title mt-0.5">
            {session?.user?.name || session?.user?.username}
          </h1>
          <p className="page-subtitle">
            Rôles :{" "}
            <span className="font-medium text-slate-700">
              {roles.join(" · ")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-xs">
          <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
          Tableau de bord en temps réel
        </div>
      </div>

      {/* Stats grid — 4 KPI on one row */}
      {cards.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="stat-card group !p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.iconBg}`}
                >
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-500">{c.title}</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900">
                    {c.value}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{c.subtitle}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-teal-500 opacity-0 transition group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Commercial charts - ADMIN / MANAGER / CASHIER */}
      {showCharts && (
        <div className="mb-8">
          <DashboardCharts monthly={monthly} categories={categories} />
        </div>
      )}

      {/* Guest area */}
      {hasRole(roles, "GUEST") && (
        <div className="card">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Espace client
          </h2>
          <p className="text-sm text-slate-600">
            Consultez vos réservations et passez des commandes depuis votre
            espace personnel.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/reservations" className="btn-primary">
              Mes réservations
            </Link>
            <Link href="/orders" className="btn-secondary">
              Mes commandes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
