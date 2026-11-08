"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
// @ts-expect-error jspdf-autotable has no perfect types
import autoTable from "jspdf-autotable";
import { useDialog } from "@/components/DialogProvider";

export type PdfColumn = { header: string; dataKey: string };

export function PdfExportButton({
  title,
  filename,
  columns,
  rows,
  label = "Exporter PDF",
}: {
  title: string;
  filename: string;
  columns: PdfColumn[];
  rows: Record<string, string | number>[];
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const dialog = useDialog();

  async function exportPdf() {
    if (rows.length === 0) {
      await dialog.alert("Aucune donnée à exporter");
      return;
    }
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16);
      doc.setTextColor(13, 148, 136);
      doc.text(title, 14, 16);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")} · Hotel & Resto`,
        14,
        22
      );

      autoTable(doc, {
        startY: 28,
        head: [columns.map((c) => c.header)],
        body: rows.map((row) => columns.map((c) => String(row[c.dataKey] ?? "—"))),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: {
          fillColor: [13, 148, 136],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    } catch (e) {
      console.error(e);
      await dialog.error("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      disabled={loading || rows.length === 0}
      className="btn-secondary text-sm"
    >
      <FileDown className="h-4 w-4" />
      {loading ? "Génération…" : label}
    </button>
  );
}
