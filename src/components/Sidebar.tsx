"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  UtensilsCrossed,
  ClipboardList,
  Users,
  Receipt,
  LogOut,
  Building2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Général",
    items: [
      {
        href: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        roles: [
          "ADMIN",
          "MANAGER",
          "RECEPTIONIST",
          "WAITER",
          "CHEF",
          "CASHIER",
          "GUEST",
        ],
      },
      {
        href: "/invoices",
        label: "Factures",
        icon: Receipt,
        roles: ["ADMIN", "MANAGER", "CASHIER", "RECEPTIONIST"],
      },
    ],
  },
  {
    title: "Hôtel",
    items: [
      {
        href: "/rooms",
        label: "Chambres",
        icon: BedDouble,
        roles: ["ADMIN", "MANAGER", "RECEPTIONIST"],
      },
      {
        href: "/reservations",
        label: "Réservations",
        icon: CalendarCheck,
        roles: ["ADMIN", "MANAGER", "RECEPTIONIST", "GUEST"],
      },
    ],
  },
  {
    title: "Restaurant",
    items: [
      {
        href: "/menu",
        label: "Menu",
        icon: UtensilsCrossed,
        roles: ["ADMIN", "MANAGER", "CHEF", "WAITER"],
      },
      {
        href: "/orders",
        label: "Commandes",
        icon: ClipboardList,
        roles: ["ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/users",
        label: "Utilisateurs",
        icon: Users,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const roles = session?.user?.roles || [];
  const [open, setOpen] = useState(false);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.roles.some((r) => roles.includes(r))
      ),
    }))
    .filter((section) => section.items.length > 0);

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm shadow-teal-600/30">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Hotel & Resto</p>
          <p className="truncate text-[11px] font-medium text-teal-600">
            Gestion intégrée
          </p>
        </div>
      </div>

      {/* Navigation with sections */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-teal-50 text-teal-700 shadow-sm shadow-teal-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        active
                          ? "text-teal-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="h-4 w-4 text-teal-500" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile link only (logout is in TopNav) */}
      <div className="border-t border-slate-200/80 p-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl p-2 -m-2 transition hover:bg-slate-50 group"
          title="Modifier mon profil"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-sm font-bold text-white ring-2 ring-transparent transition group-hover:ring-teal-300">
            {(session?.user?.name || session?.user?.username || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-teal-700">
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {roles.join(" · ")} · Mon profil
            </p>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Hotel & Resto</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <NavContent />
      </aside>

      {/* Desktop sidebar - fixed */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <NavContent />
      </aside>
      {/* Spacer to offset fixed sidebar */}
      <div className="hidden w-64 shrink-0 lg:block" aria-hidden="true" />
    </>
  );
}
