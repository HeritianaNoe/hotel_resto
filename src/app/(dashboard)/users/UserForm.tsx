"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

type UserRow = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  enabled: boolean;
  roles: string[];
};

export function UserForm({
  roles,
  user,
  trigger,
}: {
  roles: string[];
  user?: UserRow;
  trigger?: "button" | "icon";
}) {
  const router = useRouter();
  const isEdit = !!user;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    fullName: user?.fullName || "",
    password: "",
    role: user?.roles?.[0] || roles[0] || "GUEST",
    enabled: user?.enabled ?? true,
  });

  function openModal() {
    if (user) {
      setForm({
        username: user.username,
        email: user.email,
        fullName: user.fullName || "",
        password: "",
        role: user.roles?.[0] || roles[0] || "GUEST",
        enabled: user.enabled,
      });
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {
      email: form.email,
      fullName: form.fullName,
      role: form.role,
      enabled: form.enabled,
    };

    if (isEdit) {
      payload.id = user!.id;
      if (form.password.trim()) payload.password = form.password;
    } else {
      payload.username = form.username;
      payload.password = form.password || "password123";
    }

    const res = await fetch("/api/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      setOpen(false);
      if (!isEdit) {
        setForm({
          username: "",
          email: "",
          fullName: "",
          password: "password123",
          role: roles[0] || "GUEST",
          enabled: true,
        });
      }
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erreur lors de l'enregistrement");
    }
  }

  return (
    <>
      {trigger === "icon" ? (
        <button
          onClick={openModal}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-teal-50 hover:text-teal-700"
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={openModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isEdit && (
                <div>
                  <label className="label">Identifiant</label>
                  <input
                    className="input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              )}
              {isEdit && (
                <div>
                  <label className="label">Identifiant</label>
                  <input className="input bg-slate-50" value={form.username} disabled />
                </div>
              )}
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
              <div>
                <label className="label">Nom complet</label>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">
                  Mot de passe {isEdit && <span className="font-normal text-slate-400">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!isEdit}
                  placeholder={isEdit ? "••••••••" : "password123"}
                />
              </div>
              <div>
                <label className="label">Rôle</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {isEdit && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  Compte actif
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "..." : isEdit ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function UserDeleteButton({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Supprimer l'utilisateur « ${username} » ? Cette action est irréversible.`)) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erreur lors de la suppression");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      title="Supprimer"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
