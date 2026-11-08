import { auth, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { UserForm, UserDeleteButton } from "./UserForm";
import { Pagination } from "@/components/Pagination";
import { PdfExportButton } from "@/components/PdfExportButton";

const PAGE_SIZE = 10;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session || !hasRole(session.user.roles, "ADMIN", "MANAGER")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { username: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  const canCreate = hasRole(session.user.roles, "ADMIN");
  const canEdit = hasRole(session.user.roles, "ADMIN");

  const pdfRows = users.map((u) => ({
    username: u.username,
    nom: u.fullName || "—",
    email: u.email,
    roles: u.roles.map((ur) => ur.role.name).join(", "),
    statut: u.enabled ? "Actif" : "Inactif",
    cree: formatDate(u.createdAt),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">
            Comptes et rôles du système · {total} utilisateur{total !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && <UserForm roles={roles.map((r) => r.name)} />}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {users.map((u) => (
          <div key={u.id.toString()} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{u.username}</p>
                <p className="text-sm text-slate-500">{u.fullName || "—"}</p>
                <p className="mt-0.5 text-xs text-slate-400">{u.email}</p>
              </div>
              {u.enabled ? (
                <span className="badge bg-emerald-100 text-emerald-800">Actif</span>
              ) : (
                <span className="badge bg-red-100 text-red-800">Inactif</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {u.roles.map((ur) => (
                <span key={ur.roleId} className="badge bg-teal-100 text-teal-800">
                  {ur.role.name}
                </span>
              ))}
            </div>
            {canEdit && (
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
                <UserForm
                  roles={roles.map((r) => r.name)}
                  user={{
                    id: u.id.toString(),
                    username: u.username,
                    email: u.email,
                    fullName: u.fullName,
                    enabled: u.enabled,
                    roles: u.roles.map((ur) => ur.role.name),
                  }}
                  trigger="icon"
                />
                <UserDeleteButton userId={u.id.toString()} username={u.username} />
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <p className="py-12 text-center text-slate-400">Aucun utilisateur</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="table-container hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Identifiant</th>
                <th className="px-5 py-3.5 font-semibold">Nom</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">Rôles</th>
                <th className="px-5 py-3.5 font-semibold">Actif</th>
                <th className="px-5 py-3.5 font-semibold">Créé le</th>
                {canEdit && <th className="px-5 py-3.5 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id.toString()} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{u.username}</td>
                  <td className="px-5 py-3.5 text-slate-600">{u.fullName || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((ur) => (
                        <span key={ur.roleId} className="badge bg-teal-100 text-teal-800">
                          {ur.role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.enabled ? (
                      <span className="badge bg-emerald-100 text-emerald-800">Oui</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-800">Non</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(u.createdAt)}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <UserForm
                          roles={roles.map((r) => r.name)}
                          user={{
                            id: u.id.toString(),
                            username: u.username,
                            email: u.email,
                            fullName: u.fullName,
                            enabled: u.enabled,
                            roles: u.roles.map((ur) => ur.role.name),
                          }}
                          trigger="icon"
                        />
                        <UserDeleteButton userId={u.id.toString()} username={u.username} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="p-12 text-center text-slate-400">Aucun utilisateur</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          basePath="/users"
        />
        <PdfExportButton
          title="Liste des utilisateurs"
          filename={`utilisateurs-${new Date().toISOString().slice(0, 10)}.pdf`}
          columns={[
            { header: "Identifiant", dataKey: "username" },
            { header: "Nom", dataKey: "nom" },
            { header: "Email", dataKey: "email" },
            { header: "Rôles", dataKey: "roles" },
            { header: "Statut", dataKey: "statut" },
            { header: "Créé le", dataKey: "cree" },
          ]}
          rows={pdfRows}
          label="Exporter PDF"
        />
      </div>
    </div>
  );
}
