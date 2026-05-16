import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Raw imports — Vite inlines source at build time, preserving exact file contents.
import googleCalendarSync from "../../../supabase/functions/_shared/googleCalendarSync.ts?raw";
import sharedAvailabilityEngine from "../../../supabase/functions/_shared/availabilityEngine.ts?raw";
import syncLessonNow from "../../../supabase/functions/sync-lesson-now/index.ts?raw";
import createBooking from "../../../supabase/functions/create-booking/index.ts?raw";
import confirmBooking from "../../../supabase/functions/confirm-booking/index.ts?raw";
import processCalendarQueue from "../../../supabase/functions/process-calendar-queue/index.ts?raw";
import clientAvailabilityEngine from "@/lib/availabilityEngine.ts?raw";
import availabilityCore from "@/lib/availabilityCore.ts?raw";
import syncLessonsOrRollback from "@/lib/syncLessonsOrRollback.ts?raw";
import courseAvailability from "@/lib/courseAvailability.ts?raw";

const FILES: Array<{ path: string; content: string }> = [
  { path: "supabase/functions/_shared/googleCalendarSync.ts", content: googleCalendarSync },
  { path: "supabase/functions/_shared/availabilityEngine.ts", content: sharedAvailabilityEngine },
  { path: "supabase/functions/sync-lesson-now/index.ts", content: syncLessonNow },
  { path: "supabase/functions/create-booking/index.ts", content: createBooking },
  { path: "supabase/functions/confirm-booking/index.ts", content: confirmBooking },
  { path: "supabase/functions/process-calendar-queue/index.ts", content: processCalendarQueue },
  { path: "src/lib/availabilityEngine.ts", content: clientAvailabilityEngine },
  { path: "src/lib/availabilityCore.ts", content: availabilityCore },
  { path: "src/lib/syncLessonsOrRollback.ts", content: syncLessonsOrRollback },
  { path: "src/lib/courseAvailability.ts", content: courseAvailability },
];

const README = `# Calendar Engine Export

Snapshot of the Google Calendar sync + availability engine.

## Architecture
- Google Calendar is the SOLE source of truth for instructor availability.
- Busyness is read from \`instructor_calendar_events\` (GCal mirror) + \`instructor_manual_blocks\`.
- \`scheduled_lessons\` is CRM data — NEVER consulted for availability.
- All lesson writes perform a synchronous Google push with rollback on failure.

## Files (preserved at original paths)
${FILES.map((f) => `- ${f.path}`).join("\n")}

Exported: ${new Date().toISOString()}
`;

interface Props {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExportCalendarEngineButton({
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const root = zip.folder("calendar-engine")!;
      root.file("README.md", README);
      for (const f of FILES) {
        root.file(f.path, f.content);
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
      a.href = url;
      a.download = `calendar-engine-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${FILES.length} files`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={busy} className={className}>
      {busy ? (
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-1" />
      )}
      Export calendar engine
    </Button>
  );
}
