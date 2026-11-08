"use client";

import { SessionProvider } from "next-auth/react";
import { DialogProvider } from "./DialogProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <DialogProvider>{children}</DialogProvider>
    </SessionProvider>
  );
}
