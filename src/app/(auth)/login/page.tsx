"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";
import { Building2, Lock, User, ArrowRight, Shield } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Identifiant ou mot de passe incorrect. Veuillez réessayer.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="relative hidden w-[48%] overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-1/3 right-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">Hotel & Resto</span>
              <p className="text-xs font-medium text-teal-100">Madagascar</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-8 text-white">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Gestion hôtelière
              <br />
              &amp; restauration
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-teal-100">
              Une plateforme unique pour gérer les chambres, réservations,
              commandes, stock et facturation — conçue pour toute votre équipe.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["ADMIN", "MANAGER", "RÉCEPTION", "SERVEUR", "CHEF", "CAISSE", "STOCK", "CLIENT"].map(
              (r) => (
                <span
                  key={r}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur"
                >
                  {r}
                </span>
              )
            )}
          </div>
        </div>

        <p className="relative text-sm text-teal-200/80">
          © {new Date().getFullYear()} Hotel & Resto Management
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[52%]">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-600/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Hotel & Resto</h1>
            <p className="text-sm text-slate-500">Gestion intégrée</p>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Connexion
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Accédez à votre espace de gestion
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="username">
                Identifiant
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  className="input pl-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  className="input pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-[15px]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Comptes de démonstration
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Mot de passe :{" "}
              <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
                password123
              </code>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>admin</span>
              <span>manager1</span>
              <span>reception1</span>
              <span>waiter1</span>
              <span>chef1</span>
              <span>cashier1</span>
              <span>stock1</span>
              <span>guest1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
