import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { setThemeAction } from "@/app/actions/settings";
import { DEFAULT_THEME, THEMES, THEME_COOKIE, isTheme, type ThemeKey } from "@/lib/theme";
import { canManageAccess } from "@/lib/permissions";
import { getRoleAccessMap, resolveAccessMatrix } from "@/lib/settings";
import { AccessMatrix } from "./access-matrix";

export const dynamic = "force-dynamic";

const SWATCH: Record<ThemeKey, { sidebar: string; primary: string; soft: string }> = {
  teal: { sidebar: "#0f766e", primary: "#0d9488", soft: "#ccfbf1" },
  gray: { sidebar: "#1f2937", primary: "#374151", soft: "#e5e7eb" },
  blue: { sidebar: "#1e3a8a", primary: "#1d4ed8", soft: "#dbeafe" },
  red: { sidebar: "#7f1d1d", primary: "#b91c1c", soft: "#fee2e2" },
};

export default async function ParametresPage() {
  const session = await auth();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const canEditAccess = canManageAccess(roles);

  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const current: ThemeKey = isTheme(saved) ? saved : DEFAULT_THEME;

  const overrides = await getRoleAccessMap();
  const matrix = resolveAccessMatrix(overrides);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Apparence de l&apos;application et accès du personnel.</p>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Couleur principale</h2>
        <p className="mt-1 text-sm text-slate-500">
          Le choix est enregistré sur cet appareil (cookie) et appliqué à toutes les pages.
        </p>
        <form action={setThemeAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const active = key === current;
            const sw = SWATCH[key];
            return (
              <button
                key={key}
                type="submit"
                name="theme"
                value={key}
                aria-pressed={active}
                className={`rounded-2xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  active ? "border-teal-600 bg-teal-50" : "border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex h-20 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="w-1/4" style={{ background: sw.sidebar }} />
                  <div className="flex-1 space-y-2 p-2.5">
                    <div className="h-2.5 w-1/2 rounded" style={{ background: sw.soft }} />
                    <div className="h-6 w-1/3 rounded" style={{ background: sw.primary }} />
                    <div className="h-2 w-3/4 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{THEMES[key].label}</p>
                    <p className="text-xs text-slate-500">{THEMES[key].description}</p>
                  </div>
                  {active && (
                    <span className="shrink-0 rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Actif
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </form>
      </section>

      <AccessMatrix matrix={matrix} canEdit={canEditAccess} />
    </div>
  );
}
