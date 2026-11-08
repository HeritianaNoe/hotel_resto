"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, Save, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        fullName: session.user.name || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: "err", text: "Les mots de passe ne correspondent pas." });
      return;
    }

    if (form.password && form.password.length < 6) {
      setMessage({ type: "err", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    setLoading(true);
    const payload: Record<string, unknown> = {
      id: session?.user?.id,
      fullName: form.fullName,
      email: form.email,
      self: true, // flag for self-update
    };
    if (form.password.trim()) {
      payload.password = form.password;
    }

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "Profil mis à jour avec succès." });
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      // Refresh session name/email
      await update({
        ...session,
        user: {
          ...session?.user,
          name: form.fullName || session?.user?.username,
          email: form.email,
        },
      });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "err", text: data.error || "Erreur lors de la mise à jour." });
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="page-title">Mon profil</h1>
        <p className="page-subtitle">Modifier vos informations personnelles</p>
      </div>

      <div className="card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xl font-bold text-white shadow-md shadow-teal-500/20">
            {(session.user.name || session.user.username || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{session.user.name}</p>
            <p className="text-sm text-slate-500">@{session.user.username}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {session.user.roles?.join(" · ")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Identifiant</label>
            <input
              className="input bg-slate-50"
              value={session.user.username}
              disabled
            />
            <p className="mt-1 text-xs text-slate-400">L&apos;identifiant ne peut pas être modifié.</p>
          </div>

          <div>
            <label className="label">Nom complet</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <KeyRound className="h-4 w-4 text-slate-400" />
              Changer le mot de passe
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Laisser vide pour ne pas changer"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  className="input"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "ok"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
