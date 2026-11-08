"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MenuForm } from "./MenuForm";
import { useDialog } from "@/components/DialogProvider";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  available: boolean;
};

export function MenuItemActions({ item }: { item: Item }) {
  const router = useRouter();
  const dialog = useDialog();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const ok = await dialog.confirm(`Supprimer « ${item.name} » ?`);
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/menu?id=${item.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      await dialog.error(data.error || "Erreur lors de la suppression");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <MenuForm
        item={item}
        trigger={
          <span className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-teal-600">
            <Pencil className="h-3.5 w-3.5" />
          </span>
        }
      />
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        title="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
