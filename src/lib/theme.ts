export const THEME_COOKIE = "hotel_theme";

export const THEMES = {
  teal: {
    label: "Vert émeraude (par défaut)",
    description: "Teal / blanc — thème actuel",
  },
  gray: {
    label: "Gris foncé",
    description: "Gris foncé & blanc",
  },
  blue: {
    label: "Bleu foncé",
    description: "Bleu foncé & blanc",
  },
  red: {
    label: "Rouge foncé",
    description: "Rouge foncé & blanc",
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeKey = "teal";

export function isTheme(value: unknown): value is ThemeKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(THEMES, value);
}
