import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportLesson {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  notes: string | null;
  rating: number | null;
  skills_practiced: string[] | null;
  pupils: { id: string; name: string } | null;
  scheduled_lessons?: { lesson_type: string | null; google_event_id: string | null } | null;
}

export interface ExportMeta {
  instructorName: string;
  rangeLabel: string;
  pupilLabel: string;
  statusLabel: string;
}

const csvEscape = (val: unknown) => {
  const s = val == null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const safeFilename = (base: string) =>
  base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "lesson-history";

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 200);
};

export function exportLessonsCsv(lessons: ExportLesson[], meta: ExportMeta) {
  const headers = [
    "Date",
    "Start time",
    "Duration (min)",
    "Pupil",
    "Lesson type",
    "Rating",
    "Skills",
    "Notes",
    "Source",
  ];
  const rows = lessons.map((l) => [
    l.lesson_date,
    l.start_time?.slice(0, 5) || "",
    l.duration_minutes,
    l.pupils?.name || "",
    l.scheduled_lessons?.lesson_type || "",
    l.rating ?? "",
    (l.skills_practiced || []).join("; "),
    l.notes || "",
    l.scheduled_lessons?.google_event_id ? "Google diary" : "Manual",
  ]);

  const meta_rows = [
    ["Lesson History Export"],
    ["Instructor", meta.instructorName],
    ["Date range", meta.rangeLabel],
    ["Pupil filter", meta.pupilLabel],
    ["Status filter", meta.statusLabel],
    ["Generated", format(new Date(), "yyyy-MM-dd HH:mm")],
    [],
  ];

  const csv = [
    ...meta_rows.map((r) => r.map(csvEscape).join(",")),
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${safeFilename(`lesson-history-${meta.rangeLabel}`)}.csv`);
}

export function exportLessonsPdf(lessons: ExportLesson[], meta: ExportMeta) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Lesson History", 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaLines = [
    `Instructor: ${meta.instructorName}`,
    `Date range: ${meta.rangeLabel}`,
    `Pupil: ${meta.pupilLabel}    Status: ${meta.statusLabel}`,
    `Generated: ${format(new Date(), "d MMM yyyy HH:mm")}`,
    `Total lessons: ${lessons.length}`,
  ];
  metaLines.forEach((line, i) => doc.text(line, 40, 60 + i * 13));

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  doc.text(
    `Total time: ${(totalMinutes / 60).toFixed(1)} hours`,
    40,
    60 + metaLines.length * 13,
  );

  autoTable(doc, {
    startY: 60 + (metaLines.length + 1) * 13 + 10,
    head: [[
      "Date",
      "Time",
      "Mins",
      "Pupil",
      "Type",
      "Rating",
      "Skills",
      "Notes",
      "Source",
    ]],
    body: lessons.map((l) => [
      format(new Date(l.lesson_date), "d MMM yyyy"),
      l.start_time?.slice(0, 5) || "—",
      l.duration_minutes,
      l.pupils?.name || "—",
      l.scheduled_lessons?.lesson_type || "—",
      l.rating ? `${l.rating}/5` : "—",
      (l.skills_practiced || []).slice(0, 4).join(", ") +
        ((l.skills_practiced?.length || 0) > 4 ? "…" : ""),
      l.notes || "—",
      l.scheduled_lessons?.google_event_id ? "Google" : "Manual",
    ]),
    styles: { fontSize: 8, cellPadding: 4, valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: [61, 85, 161], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 90 },
      4: { cellWidth: 75 },
      5: { cellWidth: 40, halign: "center" },
      6: { cellWidth: 130 },
      7: { cellWidth: "auto" },
      8: { cellWidth: 50 },
    },
    didDrawPage: () => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${pageNum}`,
        pageWidth - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      );
      doc.setTextColor(0);
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(`${safeFilename(`lesson-history-${meta.rangeLabel}`)}.pdf`);
}
