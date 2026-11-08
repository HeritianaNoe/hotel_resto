"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ROOM_TYPES = [
  { value: "", label: "Tous les types" },
  { value: "SINGLE", label: "SINGLE" },
  { value: "DOUBLE", label: "DOUBLE" },
  { value: "FAMILY", label: "FAMILY" },
  { value: "SUITE", label: "SUITE" },
];

export function RoomTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("type") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    params.delete("page"); // reset to page 1 on filter change
    const qs = params.toString();
    router.push(qs ? `/rooms?${qs}` : "/rooms");
  }

  return (
    <select
      className="input w-auto min-w-[160px] py-2"
      value={current}
      onChange={handleChange}
      aria-label="Filtrer par type de chambre"
    >
      {ROOM_TYPES.map((t) => (
        <option key={t.value || "all"} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
