import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { ACCESS_RESOURCES, DEFAULT_ACCESS, STAFF_ROLES, type ResourceKey } from "./permissions";

export const SETTINGS_TAG = "app-settings";
const KEY_ROLE_ACCESS = "role_access";

export const getRoleAccessMap = unstable_cache(
  async (): Promise<Record<string, boolean>> => {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key: KEY_ROLE_ACCESS } });
      if (!row?.value) return {};
      const parsed = JSON.parse(row.value) as Record<string, boolean>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  },
  ["setting:role-access"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

export async function saveRoleAccessMap(map: Record<string, boolean>) {
  await prisma.appSetting.upsert({
    where: { key: KEY_ROLE_ACCESS },
    create: { key: KEY_ROLE_ACCESS, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });
}

export function resolveAccessMatrix(overrides: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const role of STAFF_ROLES) {
    for (const res of ACCESS_RESOURCES) {
      const k = `${role}:${res.key}`;
      if (Object.prototype.hasOwnProperty.call(overrides, k)) out[k] = overrides[k];
      else out[k] = DEFAULT_ACCESS[role]?.[res.key as ResourceKey] ?? false;
    }
  }
  return out;
}
