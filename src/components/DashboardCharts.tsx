"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export type MonthlyRevenue = {
  month: string;
  monthKey: string;
  revenue: number;
  orders: number;
  newGuests: number;
};

export type CategorySales = {
  name: string;
  value: number;
  color: string;
};

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const CATEGORY_COLORS = [
  "#0d9488", // teal
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#10b981", // emerald
  "#6366f1", // indigo
];

function formatAr(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Ar`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k Ar`;
  return `${value.toLocaleString("fr-FR")} Ar`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name} :{" "}
          <span className="font-medium text-slate-900">
            {p.name.toLowerCase().includes("chiffre") || p.name.toLowerCase().includes("revenu")
              ? formatAr(p.value)
              : p.value.toLocaleString("fr-FR")}
          </span>
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  monthly,
  categories,
}: {
  monthly: MonthlyRevenue[];
  categories: CategorySales[];
}) {
  const hasRevenue = monthly.some((m) => m.revenue > 0);
  const hasOrders = monthly.some((m) => m.orders > 0 || m.newGuests > 0);
  const hasCategories = categories.length > 0 && categories.some((c) => c.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Analyse commerciale</h2>
          <p className="text-sm text-slate-500">Visualisation interactive des performances</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Chiffre d'affaires mensuel */}
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Chiffre d&apos;affaires mensuel</h3>
              <p className="text-xs text-slate-500">Revenus (factures) par mois — année en cours</p>
            </div>
            {hasRevenue && (
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                Total : {formatAr(monthly.reduce((s, m) => s + m.revenue, 0))}
              </span>
            )}
          </div>
          {hasRevenue ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatAr(v)}
                    width={72}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="Chiffre d'affaires"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Aucune facture enregistrée cette année" />
          )}
        </div>

        {/* Line Chart - Volume commandes + nouveaux clients */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Évolution des ventes & clients</h3>
            <p className="text-xs text-slate-500">
              Nombre de commandes et nouveaux clients par mois
            </p>
          </div>
          {hasOrders ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Commandes"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newGuests"
                    name="Nouveaux clients"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Pas encore de données de commandes / clients" />
          )}
        </div>

        {/* Donut Chart - Répartition par catégorie */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">Ventes par catégorie</h3>
            <p className="text-xs text-slate-500">Répartition du chiffre d&apos;affaires menu</p>
          </div>
          {hasCategories ? (
            <div className="flex h-64 flex-col items-center sm:flex-row">
              <div className="h-48 w-full sm:h-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categories.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatAr(value), "Montant"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex w-full flex-col gap-2 sm:mt-0 sm:w-1/2 sm:pl-2">
                {categories.map((c, i) => {
                  const total = categories.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: c.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }}
                      />
                      <span className="flex-1 truncate text-slate-700">{c.name}</span>
                      <span className="font-medium text-slate-900">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState message="Aucune vente par catégorie pour le moment" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export { MONTHS_FR, CATEGORY_COLORS };
