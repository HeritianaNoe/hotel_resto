"use client";

import { useActionState } from "react";
import {
  ACCESS_RESOURCES,
  STAFF_ROLES,
  ROLE_LABEL,
} from "@/lib/permissions";
import {
  saveAccessMatrixAction,
  type AccessFormState,
} from "@/app/actions/settings";

const initial: AccessFormState = { success: false };

export function AccessMatrix({
  matrix,
  canEdit,
}: {
  matrix: Record<string, boolean>;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAccessMatrixAction, initial);

  return (
    <section id="access" className="card">
      <h2 className="text-lg font-semibold text-slate-900">Accès du personnel</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cochez les modules autorisés pour chaque rôle.
        {canEdit
          ? " Réservé à l'Administrateur et au Directeur."
          : " Lecture seule — seuls Admin et Directeur peuvent modifier."}
      </p>

      <form action={formAction} className="mt-4">
        <div className="table-container overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Module</th>
                {STAFF_ROLES.map((role) => (
                  <th key={role} className="px-2 py-2.5 text-center font-medium">
                    <span className="block text-xs leading-tight">{ROLE_LABEL[role]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ACCESS_RESOURCES.map((res) => (
                <tr key={res.key} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{res.label}</td>
                  {STAFF_ROLES.map((role) => {
                    const locked =
                      res.key === "access" && (role === "ADMIN" || role === "DIRECTOR");
                    const key = `${role}:${res.key}`;
                    const checked = locked || !!matrix[key];
                    const name = `access_${role}_${res.key}`;
                    return (
                      <td key={role} className="px-2 py-2.5 text-center">
                        <input
                          type="checkbox"
                          name={name}
                          value="on"
                          defaultChecked={checked}
                          disabled={!canEdit || locked}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-60"
                          aria-label={`${ROLE_LABEL[role]} — ${res.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {state.message && (
          <p
            role="alert"
            className={`mt-3 text-sm ${state.success ? "text-teal-700" : "text-red-600"}`}
          >
            {state.message}
          </p>
        )}

        {canEdit && (
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer les accès"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
