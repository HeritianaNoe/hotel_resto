import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string | { toString(): string }) {
  const n = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-MG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}
