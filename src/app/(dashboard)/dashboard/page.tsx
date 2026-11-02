import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const roles = session?.user?.roles || [];

  const [
    roomsCount,
    availableRooms,
    reservationsCount,
    activeOrders,
    lowStock,
    usersCount,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { status: "AVAILABLE" } }),
    prisma.reservation.count({
      where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    }),
    prisma.foodOrder.count({
      where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
    }),
    prisma.stockItem.findMany({
      where: { minLevel: { not: null } },
    }),
    prisma.user.count(),
  ]);

  const lowStockItems = lowStock.filter(
    (s) => s.minLevel !== null && Number(s.quantity) <= Number(s.minLevel)
  );

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

  if (hasRole(roles, "ADMIN", "MANAGER", "STOCK_KEEPER", "CHEF")) {
    cards.push({
      title: "Stock bas",
      value: lowStockItems.length,
      subtitle: "à réapprovisionner",
      icon: Package,
      href: "/stock",
      gradient:
        lowStockItems.length > 0
          ? "from-red-500 to-rose-600"
          : "from-emerald-500 to-teal-600",
      iconBg:
        lowStockItems.length > 0
          ? "bg-red-50 text-red-600"
          : "bg-emerald-50 text-emerald-600",
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
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
          Tableau de bord en temps réel
        </div>
      </div>

      {/* Stats grid */}
      {cards.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="stat-card group">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">{c.title}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {c.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{c.subtitle}</p>
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-600 opacity-0 transition group-hover:opacity-100">
                Voir le détail
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {lowStockItems.length > 0 &&
        hasRole(roles, "ADMIN", "MANAGER", "STOCK_KEEPER", "CHEF") && (
          <div className="card mb-6 border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="mb-3 flex items-center gap-2.5 text-amber-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="font-semibold">Alertes stock bas</h2>
            </div>
            <ul className="space-y-2">
              {lowStockItems.map((s) => (
                <li
                  key={s.id.toString()}
                  className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-sm text-amber-900"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-amber-700">
                    {Number(s.quantity)} {s.unit || ""}{" "}
                    <span className="text-amber-500">
                      (min. {Number(s.minLevel)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/stock"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              Gérer le stock
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
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
