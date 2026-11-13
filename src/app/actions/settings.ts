"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import {
  ACCESS_RESOURCES,
  STAFF_ROLES,
  canManageAccess,
} from "@/lib/permissions";
import { SETTINGS_TAG, saveRoleAccessMap } from "@/lib/settings";

export async function setThemeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const theme = formData.get("theme");
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });

  revalidatePath("/", "layout");
}

export type AccessFormState = { success: boolean; message?: string };

export async function saveAccessMatrixAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const session = await auth();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles;
  if (!session?.user) return { success: false, message: "Non authentifié." };
  if (!canManageAccess(roles)) {
    return {
      success: false,
      message: "Seuls l'Administrateur et le Directeur peuvent modifier les accès.",
    };
  }

  try {
    const map: Record<string, boolean> = {};
    for (const role of STAFF_ROLES) {
      for (const res of ACCESS_RESOURCES) {
        const field = `access_${role}_${res.key}`;
        let checked = formData.get(field) === "on" || formData.get(field) === "true";
        if (res.key === "access" && (role === "ADMIN" || role === "DIRECTOR")) {
          checked = true;
        }
        map[`${role}:${res.key}`] = checked;
      }
    }
    await saveRoleAccessMap(map);
    revalidateTag(SETTINGS_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/parametres");
    return { success: true, message: "Accès du personnel enregistrés." };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message:
        "Erreur d'enregistrement. Exécutez « npx prisma db push » pour créer la table app_settings.",
    };
  }
}
