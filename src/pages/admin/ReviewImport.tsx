import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload, FileText, Sparkles } from "lucide-react";

interface ParsedReview {
  id: string;
  reviewer_name: string;
  reviewer_location: string;
  review_text: string;
  rating: number;
  review_date: string; // yyyy-mm-dd
  passed_first_time: boolean;
  include: boolean;
}

interface InstructorOpt {
  id: string;
  name: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function parseDate(text: string): string {
  // "May 2024", "12/05/2024", "2024-05-12"
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const dmy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const d = parseInt(dmy[1]), m = parseInt(dmy[2]) - 1;
    let y = parseInt(dmy[3]);
    if (y < 100) y += 2000;
    const dt = new Date(Date.UTC(y, m, d));
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const my = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i);
  if (my) {
    const m = MONTHS[my[1].toLowerCase()];
    const y = parseInt(my[2]);
    return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  }
  return todayISO();
}

function parseRating(text: string): number {
  const stars = (text.match(/★/g) || []).length;
  if (stars >= 1 && stars <= 5) return stars;
  const numStar = text.match(/(\d)\s*(?:\/\s*5|★|stars?)/i);
  if (numStar) {
    const n = parseInt(numStar[1]);
    if (n >= 1 && n <= 5) return n;
  }
  return 5;
}

function parsePassedFirstTime(text: string): boolean {
  return /passed\s+(1st|first)\s*time/i.test(text);
}

function stripQuotes(s: string): string {
  return s.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, "").trim();
}

function parseReviewBlock(raw: string): ParsedReview | null {
  const block = raw.trim();
  if (!block || block.length < 10) return null;

  const rating = parseRating(block);
  const review_date = parseDate(block);
  const passed_first_time = parsePassedFirstTime(block);

  // Try to find quoted review text
  let review_text = "";
  const quoted = block.match(/["“”]([^"“”]{15,})["“”]/);
  if (quoted) review_text = quoted[1].trim();

  // Try to find reviewer name and location from a header line like "Sarah M, Winchester, ..."
  let reviewer_name = "";
  let reviewer_location = "";

  const firstLine = block.split(/\n/)[0];
  const headerParts = firstLine.split(/[,|–—-]/).map((p) => p.trim()).filter(Boolean);
  if (headerParts.length >= 1) {
    // first token that looks like a name (1-3 capitalized words, optional trailing initial)
    for (const part of headerParts) {
      if (/^[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z.'’-]*){0,2}\.?$/.test(part) && !reviewer_name) {
        reviewer_name = part;
        continue;
      }
      // Location: single capitalized word(s), no digits, not "Passed..."
      if (
        !reviewer_location &&
        /^[A-Z][a-zA-Z'’\- ]+$/.test(part) &&
        !/passed|first|time|star|review/i.test(part)
      ) {
        reviewer_location = part;
      }
    }
  }

  if (!review_text) {
    // fall back: everything after a colon, em-dash or after the header line
    const dashSplit = block.split(/[—–]\s+/);
    if (dashSplit.length > 1) review_text = stripQuotes(dashSplit.slice(1).join(" — "));
    else {
      const lines = block.split(/\n/).slice(1).join(" ").trim();
      review_text = lines || block;
    }
  }
  review_text = stripQuotes(review_text);

  return {
    id: uid(),
    reviewer_name: reviewer_name || "Anonymous",
    reviewer_location,
    review_text,
    rating,
    review_date,
    passed_first_time,
    include: true,
  };
}

function splitIntoBlocks(text: string): string[] {
  // Normalize line endings
  const t = text.replace(/\r\n/g, "\n");
  // Prefer blank-line splits; fall back to numbered "1." / bullet boundaries
  const byBlank = t.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  if (byBlank.length >= 2) return byBlank;
  const byNumbered = t
    .split(/\n(?=\s*(?:\d+[\.\)]|[-•*])\s+)/)
    .map((b) => b.replace(/^\s*(?:\d+[\.\)]|[-•*])\s+/, "").trim())
    .filter(Boolean);
  if (byNumbered.length >= 2) return byNumbered;
  return [t.trim()].filter(Boolean);
}

export default function ReviewImport() {
  const [instructors, setInstructors] = useState<InstructorOpt[]>([]);
  const [instructorId, setInstructorId] = useState<string>("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedReview[]>([]);
  const [importing, setImporting] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, name")
        .eq("is_network_placeholder", false)
        .order("name")
        .limit(500);
      setInstructors((data ?? []) as InstructorOpt[]);
    })();
  }, []);

  async function handleFile(file: File) {
    setLoadingDoc(true);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        setRawText(result.value);
      } else {
        const text = await file.text();
        setRawText(text);
      }
      toast({ title: "File loaded", description: "Click Parse to extract reviews." });
    } catch (e: any) {
      toast({ title: "Could not read file", description: e.message, variant: "destructive" });
    } finally {
      setLoadingDoc(false);
    }
  }

  function handleParse() {
    if (!rawText.trim()) {
      toast({ title: "Nothing to parse", description: "Paste text or upload a file first.", variant: "destructive" });
      return;
    }
    const blocks = splitIntoBlocks(rawText);
    const out: ParsedReview[] = [];
    for (const b of blocks) {
      const r = parseReviewBlock(b);
      if (r) out.push(r);
    }
    setParsed(out);
    toast({ title: `Parsed ${out.length} review${out.length === 1 ? "" : "s"}`, description: "Edit any field, untick to skip, then Insert." });
  }

  function update(id: string, patch: Partial<ParsedReview>) {
    setParsed((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: string) {
    setParsed((rows) => rows.filter((r) => r.id !== id));
  }

  async function handleInsert() {
    if (!instructorId) {
      toast({ title: "Pick an instructor first", variant: "destructive" });
      return;
    }
    const toInsert = parsed.filter((r) => r.include && r.review_text.trim().length > 0);
    if (toInsert.length === 0) {
      toast({ title: "No reviews selected", variant: "destructive" });
      return;
    }
    setImporting(true);
    const rows = toInsert.map((r) => ({
      instructor_id: instructorId,
      reviewer_name: r.reviewer_name || "Anonymous",
      reviewer_location: r.reviewer_location || null,
      review_text: r.review_text.trim(),
      rating: Math.max(1, Math.min(5, r.rating)),
      review_date: r.review_date,
      passed_first_time: r.passed_first_time,
      course_hours: 0,
      moderation_status: "approved",
      is_visible: true,
      is_verified: true,
    }));
    const { error, data } = await supabase.from("course_reviews").insert(rows).select("id");
    setImporting(false);
    if (error) {
      toast({ title: "Insert failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Imported ${data?.length ?? rows.length} reviews` });
    setParsed([]);
    setRawText("");
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Import</h1>
          <p className="text-sm text-muted-foreground">
            Upload a Word document (.docx) or paste reviews. Preview and edit before inserting.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Instructor & Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <select
                id="instructor"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
              >
                <option value="">Select instructor…</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="file"
                  accept=".docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button asChild variant="outline" size="sm" disabled={loadingDoc}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {loadingDoc ? "Reading…" : "Upload .docx / .txt"}
                  </span>
                </Button>
              </label>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>

            <Textarea
              rows={10}
              placeholder={`Paste reviews here. One per paragraph (separated by blank lines).\n\nExamples:\nSarah M, Winchester, May 2024, Passed 1st time — "Ken was so patient and made me feel relaxed from the start."\n\nJake T, Eastleigh, ★★★★★, Jan 2024\n"Passed first time thanks to Ken's clear instructions."`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="font-mono text-xs"
            />

            <div className="flex gap-2">
              <Button onClick={handleParse} disabled={!rawText.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Parse reviews
              </Button>
              {parsed.length > 0 && (
                <Button variant="ghost" onClick={() => setParsed([])}>Clear preview</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {parsed.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                2. Preview ({parsed.filter((r) => r.include).length} of {parsed.length} selected)
              </CardTitle>
              <Button onClick={handleInsert} disabled={importing || !instructorId}>
                {importing ? "Inserting…" : `Insert ${parsed.filter((r) => r.include).length} reviews`}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {parsed.map((r) => (
                <div key={r.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Checkbox
                      checked={r.include}
                      onCheckedChange={(v) => update(r.id, { include: !!v })}
                    />
                    <Input
                      className="h-8 max-w-[180px]"
                      value={r.reviewer_name}
                      onChange={(e) => update(r.id, { reviewer_name: e.target.value })}
                      placeholder="Name"
                    />
                    <Input
                      className="h-8 max-w-[160px]"
                      value={r.reviewer_location}
                      onChange={(e) => update(r.id, { reviewer_location: e.target.value })}
                      placeholder="Location"
                    />
                    <Input
                      type="date"
                      className="h-8 max-w-[160px]"
                      value={r.review_date}
                      onChange={(e) => update(r.id, { review_date: e.target.value })}
                    />
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={r.rating}
                      onChange={(e) => update(r.id, { rating: parseInt(e.target.value) })}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-1 text-xs">
                      <Checkbox
                        checked={r.passed_first_time}
                        onCheckedChange={(v) => update(r.id, { passed_first_time: !!v })}
                      />
                      Passed 1st time
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-destructive"
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    rows={3}
                    value={r.review_text}
                    onChange={(e) => update(r.id, { review_text: e.target.value })}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
