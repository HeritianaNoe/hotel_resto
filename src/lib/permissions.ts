/** Rôles du personnel (hors GUEST). */
export const STAFF_ROLES = [
  "ADMIN",
  "DIRECTOR",
  "MANAGER",
  "RECEPTIONIST",
  "WAITER",
  "CHEF",
  "CASHIER",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  DIRECTOR: "Directeur",
  MANAGER: "Manager",
  RECEPTIONIST: "Réceptionniste",
  WAITER: "Serveur",
  CHEF: "Chef",
  CASHIER: "Caissier",
  GUEST: "Client",
};

/** Modules = entrées du menu. */
export const ACCESS_RESOURCES = [
  { key: "dashboard", label: "Tableau de bord", href: "/dashboard" },
  { key: "invoices", label: "Factures", href: "/invoices" },
  { key: "rooms", label: "Chambres", href: "/rooms" },
  { key: "reservations", label: "Réservations", href: "/reservations" },
  { key: "menu", label: "Menu restaurant", href: "/menu" },
  { key: "orders", label: "Commandes", href: "/orders" },
  { key: "users", label: "Utilisateurs", href: "/users" },
  { key: "parametres", label: "Paramètres", href: "/parametres" },
  { key: "access", label: "Gestion des accès", href: "/parametres#access" },
] as const;

export type ResourceKey = (typeof ACCESS_RESOURCES)[number]["key"];

/** Défauts alignés sur le menu actuel + DIRECTOR = comme ADMIN. */
export const DEFAULT_ACCESS: Record<string, Partial<Record<ResourceKey, boolean>>> = {
  ADMIN: Object.fromEntries(ACCESS_RESOURCES.map((r) => [r.key, true])),
  DIRECTOR: Object.fromEntries(ACCESS_RESOURCES.map((r) => [r.key, true])),
  MANAGER: {
    dashboard: true,
    invoices: true,
    rooms: true,
    reservations: true,
    menu: true,
    orders: true,
    users: true,
    parametres: true,
    access: false,
  },
  RECEPTIONIST: {
    dashboard: true,
    invoices: true,
    rooms: true,
    reservations: true,
    menu: false,
    orders: false,
    users: false,
    parametres: true,
    access: false,
  },
  WAITER: {
    dashboard: true,
    invoices: false,
    rooms: false,
    reservations: false,
    menu: true,
    orders: true,
    users: false,
    parametres: true,
    access: false,
  },
  CHEF: {
    dashboard: true,
    invoices: false,
    rooms: false,
    reservations: false,
    menu: true,
    orders: true,
    users: false,
    parametres: true,
    access: false,
  },
  CASHIER: {
    dashboard: true,
    invoices: true,
    rooms: false,
    reservations: false,
    menu: false,
    orders: true,
    users: false,
    parametres: true,
    access: false,
  },
  GUEST: {
    dashboard: true,
    invoices: false,
    rooms: false,
    reservations: true,
    menu: false,
    orders: false,
    users: false,
    parametres: true,
    access: false,
  },
};

export function canManageAccess(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.includes("ADMIN") || roles.includes("DIRECTOR");
}

export function canAccessResource(
  role: string,
  resource: ResourceKey,
  overrides?: Record<string, boolean>,
): boolean {
  const key = `${role}:${resource}`;
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key];
  }
  return DEFAULT_ACCESS[role]?.[resource] ?? false;
}

/** L'utilisateur a accès si AU MOINS un de ses rôles autorise la ressource. */
export function userCanAccess(
  userRoles: string[] | undefined,
  resource: ResourceKey,
  overrides?: Record<string, boolean>,
): boolean {
  if (!userRoles?.length) return false;
  return userRoles.some((r) => canAccessResource(r, resource, overrides));
}

export function resourceForHref(href: string): ResourceKey | null {
  const sorted = [...ACCESS_RESOURCES].sort((a, b) => b.href.length - a.href.length);
  for (const r of sorted) {
    if (r.key === "access") continue;
    if (href === r.href || href.startsWith(r.href + "/")) return r.key;
  }
  return null;
}
