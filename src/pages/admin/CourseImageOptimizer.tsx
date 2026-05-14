import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ImageIcon, Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const TARGET_W = 1200;
const TARGET_H = 900; // 4:3
const JPEG_QUALITY = 0.85;
const BUCKET = "instructor-images";

type Status = "pending" | "running" | "done" | "skipped" | "error";

interface Row {
  instructor_id: string;
  course_hours: number;
  course_image_url: string;
  status: Status;
  message?: string;
  beforeKB?: number;
  afterKB?: number;
}

/** Resize+crop an image blob to exactly 1200x900 (cover, centered). */
async function resizeToCover(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const srcRatio = bitmap.width / bitmap.height;
  const targetRatio = TARGET_W / TARGET_H;

  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (srcRatio > targetRatio) {
    // source is wider — crop sides
    sw = bitmap.height * targetRatio;
    sx = (bitmap.width - sw) / 2;
  } else if (srcRatio < targetRatio) {
    // source is taller — crop top/bottom
    sh = bitmap.width / targetRatio;
    sy = (bitmap.height - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
  bitmap.close?.();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** Extract storage object path inside the bucket from a public URL. */
function pathInBucketFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split("?")[0];
}

export default function CourseImageOptimizer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const scan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase
        .from("instructor_courses")
        .select("instructor_id, course_hours, course_image_url")
        .not("course_image_url", "is", null)
        .order("instructor_id");
      if (error) throw error;
      const list: Row[] = (data ?? [])
        .filter((r) => !!r.course_image_url)
        .map((r) => ({
          instructor_id: r.instructor_id as string,
          course_hours: r.course_hours as number,
          course_image_url: r.course_image_url as string,
          status: "pending" as Status,
        }));
      setRows(list);
      setProgress(0);
      toast.success(`Found ${list.length} course images`);
    } catch (e: any) {
      toast.error(e.message ?? "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const optimizeOne = async (row: Row): Promise<Row> => {
    try {
      // Skip non-bucket-hosted images (e.g. external/unsplash)
      const objectPath = pathInBucketFromUrl(row.course_image_url);
      if (!objectPath) {
        return { ...row, status: "skipped", message: "External URL — not in storage bucket" };
      }

      const res = await fetch(row.course_image_url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const original = await res.blob();
      const beforeKB = Math.round(original.size / 1024);

      const optimized = await resizeToCover(original);
      const afterKB = Math.round(optimized.size / 1024);

      // Replace at the same path; force .jpg extension
      const newPath = objectPath.replace(/\.[a-z0-9]+$/i, "") + ".jpg";

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, optimized, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
        });
      if (upErr) throw upErr;

      // If extension changed, delete the old object
      if (newPath !== objectPath) {
        await supabase.storage.from(BUCKET).remove([objectPath]);
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
      const newUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const { error: updErr } = await supabase
        .from("instructor_courses")
        .update({ course_image_url: newUrl })
        .eq("instructor_id", row.instructor_id)
        .eq("course_hours", row.course_hours);
      if (updErr) throw updErr;

      return { ...row, status: "done", beforeKB, afterKB, course_image_url: newUrl };
    } catch (e: any) {
      return { ...row, status: "error", message: e.message ?? String(e) };
    }
  };

  const runAll = async () => {
    if (!rows.length) return;
    setRunning(true);
    setProgress(0);
    try {
      for (let i = 0; i < rows.length; i++) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));
        const updated = await optimizeOne(rows[i]);
        setRows((prev) => prev.map((r, idx) => (idx === i ? updated : r)));
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
      toast.success("Optimization complete");
    } finally {
      setRunning(false);
    }
  };

  const counts = rows.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc),
    {} as Record<Status, number>,
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="h-6 w-6" /> Course Image Optimizer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Resizes every course image to <strong>1200 × 900</strong> (4:3, JPEG q85), replaces it
              in storage, and updates the database. External URLs are skipped.
            </p>
          </div>
        </div>

        <Card className="p-4 flex flex-wrap items-center gap-3">
          <Button onClick={scan} disabled={scanning || running} variant="outline">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Scan course images
          </Button>
          <Button onClick={runAll} disabled={!rows.length || running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Optimize all ({rows.length})
          </Button>
          <div className="ml-auto flex gap-3 text-xs text-muted-foreground">
            <span>Done: {counts.done ?? 0}</span>
            <span>Skipped: {counts.skipped ?? 0}</span>
            <span>Errors: {counts.error ?? 0}</span>
          </div>
        </Card>

        {running && <Progress value={progress} />}

        {rows.length > 0 && (
          <Card className="overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left">
                    <th className="px-3 py-2">Instructor</th>
                    <th className="px-3 py-2">Hours</th>
                    <th className="px-3 py-2">Before</th>
                    <th className="px-3 py-2">After</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.instructor_id}-${r.course_hours}-${i}`} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{r.instructor_id.slice(0, 8)}…</td>
                      <td className="px-3 py-2">{r.course_hours}h</td>
                      <td className="px-3 py-2">{r.beforeKB ? `${r.beforeKB} KB` : "—"}</td>
                      <td className="px-3 py-2">{r.afterKB ? `${r.afterKB} KB` : "—"}</td>
                      <td className="px-3 py-2">
                        {r.status === "running" && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" /> Working
                          </span>
                        )}
                        {r.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        )}
                        {r.status === "skipped" && (
                          <span className="text-muted-foreground">Skipped — {r.message}</span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-3 w-3" /> {r.message}
                          </span>
                        )}
                        {r.status === "pending" && <span className="text-muted-foreground">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
