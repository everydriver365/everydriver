import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  onImported?: (count: number) => void;
}

// Canonical headers we accept (case-insensitive, ignoring spaces/underscores)
const FIELD_ALIASES: Record<string, string> = {
  name: "name",
  fullname: "name",
  firstname: "first_name",
  lastname: "last_name",
  surname: "last_name",
  email: "email",
  phone: "phone",
  mobile: "phone",
  address: "address",
  postcode: "postcode",
  postalcode: "postcode",
  zip: "postcode",
  coursetype: "course_type",
  course: "course_type",
  notes: "notes",
  parentname: "parent_name",
  parentphone: "parent_phone",
  dob: "date_of_birth",
  dateofbirth: "date_of_birth",
  transmission: "transmission_type",
  transmissiontype: "transmission_type",
  previousexperience: "previous_experience",
  experience: "previous_experience",
  paymentmethod: "payment_method",
  what3words: "what3words",
};

function normaliseHeader(h: string) {
  return h.toLowerCase().replace(/[\s_\-]/g, "");
}

// Minimal CSV parser supporting quoted fields, escaped quotes, CRLF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else { cur += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((v) => v && v.trim().length > 0));
}

type ParsedRow = {
  raw: Record<string, string>;
  pupil: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string;
    postcode: string;
    course_type: string | null;
    notes: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    date_of_birth: string | null;
    transmission_type: string | null;
    previous_experience: string | null;
    payment_method: string;
    what3words: string | null;
  };
  errors: string[];
};

function normaliseDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  // Accept YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Accept DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return null;
}

function normaliseTransmission(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (s.startsWith("man")) return "manual";
  if (s.startsWith("auto")) return "automatic";
  return null;
}

const TEMPLATE_CSV =
  "name,email,phone,address,postcode,course_type,transmission,date_of_birth,parent_name,parent_phone,notes\n" +
  "Jane Doe,jane@example.com,07700900000,12 High Street,SO22 5AB,Beginner,manual,2006-04-12,Mary Doe,07700900111,Nervous on roundabouts\n" +
  "John Smith,,07700900222,3 Oak Lane,PO1 1AA,Refresher,automatic,,,,Wants intensive course\n";

export function ImportPupilsCsvDialog({ open, onOpenChange, instructorId, onImported }: Props) {
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [completed, setCompleted] = useState<null | { inserted: number; skipped: number }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo<{ rows: ParsedRow[]; headerErrors: string[] } | null>(() => {
    if (!csvText.trim()) return null;
    const matrix = parseCsv(csvText);
    if (matrix.length === 0) return { rows: [], headerErrors: ["File is empty"] };

    const rawHeaders = matrix[0].map((h) => h.trim());
    const headerMap: Record<number, string> = {};
    rawHeaders.forEach((h, idx) => {
      const key = FIELD_ALIASES[normaliseHeader(h)];
      if (key) headerMap[idx] = key;
    });

    const headerErrors: string[] = [];
    const mapped = Object.values(headerMap);
    const hasName = mapped.includes("name") || (mapped.includes("first_name") && mapped.includes("last_name")) || mapped.includes("first_name");
    if (!hasName) headerErrors.push("Missing 'name' (or 'first_name' + 'last_name') column");
    if (!mapped.includes("address")) headerErrors.push("Missing 'address' column");
    if (!mapped.includes("postcode")) headerErrors.push("Missing 'postcode' column");

    const rows: ParsedRow[] = matrix.slice(1).map((cells) => {
      const raw: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => { raw[h] = (cells[idx] ?? "").trim(); });

      const get = (field: string) => {
        for (const [idxStr, key] of Object.entries(headerMap)) {
          if (key === field) {
            const v = cells[Number(idxStr)];
            if (v != null && String(v).trim().length > 0) return String(v).trim();
          }
        }
        return "";
      };

      const first = get("first_name");
      const last = get("last_name");
      const directName = get("name");
      const name = directName || `${first} ${last}`.trim();
      const address = get("address");
      const postcode = get("postcode");
      const email = get("email") || null;
      const phone = get("phone") || null;
      const course_type = get("course_type") || null;
      const notes = get("notes") || null;
      const parent_name = get("parent_name") || null;
      const parent_phone = get("parent_phone") || null;
      const dobRaw = get("date_of_birth");
      const date_of_birth = dobRaw ? normaliseDate(dobRaw) : null;
      const trRaw = get("transmission_type");
      const transmission_type = trRaw ? normaliseTransmission(trRaw) : null;
      const previous_experience = get("previous_experience") || null;
      const what3words = get("what3words") || null;
      const payment_method = (get("payment_method") || "tbc").toLowerCase();

      const errors: string[] = [];
      if (!name) errors.push("name required");
      if (!address) errors.push("address required");
      if (!postcode) errors.push("postcode required");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid email");
      if (dobRaw && !date_of_birth) errors.push("invalid date_of_birth");
      if (trRaw && !transmission_type) errors.push("transmission must be manual or automatic");

      return {
        raw,
        pupil: {
          name, email, phone, address, postcode, course_type, notes,
          parent_name, parent_phone, date_of_birth, transmission_type,
          previous_experience, payment_method, what3words,
        },
        errors,
      };
    });

    return { rows, headerErrors };
  }, [csvText]);

  const validCount = parsed?.rows.filter((r) => r.errors.length === 0).length ?? 0;
  const invalidCount = parsed?.rows.filter((r) => r.errors.length > 0).length ?? 0;
  const canImport =
    !!parsed && parsed.headerErrors.length === 0 && validCount > 0 && !importing;

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    setCompleted(null);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pupils-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCsvText("");
    setCompleted(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!parsed || !canImport) return;
    setImporting(true);
    try {
      const payload = parsed.rows
        .filter((r) => r.errors.length === 0)
        .map((r) => ({
          instructor_id: instructorId,
          ...r.pupil,
          lessons_completed: 0,
          progress: 0,
          payment_method: r.pupil.payment_method || "tbc",
        }));

      // Insert in chunks of 100 to be safe with large files.
      let inserted = 0;
      for (let i = 0; i < payload.length; i += 100) {
        const chunk = payload.slice(i, i + 100);
        const { error, data } = await supabase.from("pupils").insert(chunk).select("id");
        if (error) throw error;
        inserted += data?.length ?? chunk.length;
      }

      setCompleted({ inserted, skipped: invalidCount });
      toast.success(`Imported ${inserted} pupil${inserted === 1 ? "" : "s"}`);
      onImported?.(inserted);
    } catch (err: any) {
      console.error("CSV import failed:", err);
      toast.error(err?.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (importing) return;
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import pupils from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or paste rows below. Required columns: <b>name</b> (or <b>first_name</b> + <b>last_name</b>), <b>address</b>, <b>postcode</b>.
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="rounded-lg border p-4 bg-green-50 border-green-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-green-900">Import complete</div>
              <div className="text-green-800">
                Added {completed.inserted} pupil{completed.inserted === 1 ? "" : "s"}.
                {completed.skipped > 0 && <> Skipped {completed.skipped} invalid row{completed.skipped === 1 ? "" : "s"}.</>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload CSV
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-1.5" /> Download template
              </Button>
              {csvText && (
                <Button type="button" variant="ghost" size="sm" onClick={reset}>Clear</Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            <Textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCompleted(null); }}
              placeholder={"name,email,phone,address,postcode\nJane Doe,jane@example.com,07700900000,12 High Street,SO22 5AB"}
              rows={8}
              className="font-mono text-xs"
            />

            {parsed && (
              <div className="space-y-2">
                {parsed.headerErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Header problems</div>
                      <ul className="list-disc ml-4">
                        {parsed.headerErrors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"} parsed</span>
                  {validCount > 0 && <span className="text-green-700 font-medium">{validCount} ready</span>}
                  {invalidCount > 0 && <span className="text-amber-700 font-medium">{invalidCount} will be skipped</span>}
                </div>

                {parsed.rows.length > 0 && (
                  <div className="max-h-64 overflow-auto border rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 w-8">#</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Phone</th>
                          <th className="text-left p-2">Postcode</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.rows.slice(0, 100).map((r, i) => (
                          <tr key={i} className={r.errors.length > 0 ? "bg-amber-50" : ""}>
                            <td className="p-2 text-muted-foreground">{i + 1}</td>
                            <td className="p-2">{r.pupil.name || <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-2">{r.pupil.email ?? <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-2">{r.pupil.phone ?? <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-2">{r.pupil.postcode || <span className="text-muted-foreground">—</span>}</td>
                            <td className="p-2">
                              {r.errors.length === 0
                                ? <span className="text-green-700">Ready</span>
                                : <span className="text-amber-700">{r.errors.join(", ")}</span>}
                            </td>
                          </tr>
                        ))}
                        {parsed.rows.length > 100 && (
                          <tr><td colSpan={6} className="p-2 text-center text-muted-foreground">
                            + {parsed.rows.length - 100} more rows…
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {completed ? (
            <Button onClick={() => handleClose(false)}>Close</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => handleClose(false)} disabled={importing}>Cancel</Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {importing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Importing…</> : `Import ${validCount} pupil${validCount === 1 ? "" : "s"}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
