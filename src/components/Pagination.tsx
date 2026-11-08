import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  extraParams = "",
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  /** e.g. "&type=SUITE" — already starts with & if needed */
  extraParams?: string;
}) {
  if (totalPages <= 1 && total <= 10) return null;

  const href = (p: number) => `${basePath}?page=${p}${extraParams}`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-500">
        {total} élément{total !== 1 ? "s" : ""} · Page {page} / {totalPages}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
