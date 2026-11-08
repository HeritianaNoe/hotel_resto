"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

export function TopNav() {
  const { data: session } = useSession();
  const roles = session?.user?.roles || [];

  return (
    <header className="sticky top-0 z-20 hidden h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md lg:flex">
      <div className="text-sm text-slate-500">
        Hotel & Resto ·{" "}
        <span className="font-medium text-slate-700">Gestion intégrée</span>
      </div>

      <div className="flex items-center gap-3">

        <div className="h-6 w-px bg-slate-200" />

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          title="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Se déconnecter</span>
        </button>
      </div>
    </header>
  );
}
