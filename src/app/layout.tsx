import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { THEME_COOKIE, DEFAULT_THEME, isTheme, type ThemeKey } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Hotel & Resto Management",
  description: "Système de gestion Hôtel & Restaurant - Madagascar",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const theme: ThemeKey = isTheme(saved) ? saved : DEFAULT_THEME;

  return (
    <html lang="fr" data-theme={theme === "teal" ? undefined : theme}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
