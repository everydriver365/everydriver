import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

const PUPIL_FIELDS = [
  { value: "name", label: "Full Name" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "address", label: "Address" },
  { value: "postcode", label: "Postcode" },
  { value: "notes", label: "Notes" },
  { value: "skip", label: "— Skip —" },
];

type Step = "upload" | "map" | "preview" | "done";

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const row: string[] = [];
    let inQuotes = false;
    let current = "";
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { row.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    row.push(current.trim());
    return row;
  });
}

export default function InstructorDataImport() {
  const { instructor } = useInstructorAuth();
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) { toast.error("File needs at least a header row and one data row"); return; }
    setHeaders(parsed[0]);
    setRows(parsed.slice(1));

    // Auto-map by guessing column names
    const autoMap: Record<number, string> = {};
    parsed[0].forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes("name") && !lower.includes("email")) autoMap[i] = "name";
      else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel")) autoMap[i] = "phone";
      else if (lower.includes("email")) autoMap[i] = "email";
      else if (lower.includes("address") && !lower.includes("post")) autoMap[i] = "address";
      else if (lower.includes("postcode") || lower.includes("post code") || lower.includes("zip")) autoMap[i] = "postcode";
      else if (lower.includes("note")) autoMap[i] = "notes";
    });
    setMapping(autoMap);
    setStep("map");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const hasNameMapping = Object.values(mapping).includes("name");

  const getMappedRows = () => {
    return rows.map(row => {
      const mapped: Record<string, string> = {};
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field !== "skip") mapped[field] = row[Number(colIdx)] || "";
      });
      return mapped;
    }).filter(r => r.name?.trim());
  };

  const doImport = async () => {
    if (!instructor?.id) return;
    setImporting(true);
    try {
      const mapped = getMappedRows();
      const inserts = mapped.map(r => ({
        instructor_id: instructor.id,
        name: r.name,
        phone: r.phone || null,
        email: r.email || null,
        address: r.address || null,
        postcode: r.postcode || null,
        notes: r.notes || null,
        status: "active" as const,
      }));

      const batchSize = 50;
      let total = 0;
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize);
        const { error } = await supabase.from("pupils").insert(batch);
        if (error) throw error;
        total += batch.length;
      }

      setImportedCount(total);
      setStep("done");
      toast.success(`${total} pupils imported successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <InstructorPortalLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Pupils</h1>
          <p className="text-muted-foreground">Switch in minutes — import your pupil list from any platform via CSV</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 text-sm">
          {["Upload", "Map Columns", "Preview & Import", "Done"].map((label, i) => {
            const stepKeys: Step[] = ["upload", "map", "preview", "done"];
            const active = stepKeys.indexOf(step) >= i;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                <Badge variant={active ? "default" : "outline"} className="text-xs">{label}</Badge>
              </div>
            );
          })}
        </div>

        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Your File</CardTitle>
              <CardDescription>Drag & drop a CSV file, or click to browse. Export your pupil list from your current app first.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-1">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={onFileSelect}
                />
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Most apps (MyDriveTime, ADI Book, Total Drive) let you export pupils as CSV from their settings. 
                  We'll auto-detect columns like Name, Phone, Email.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "map" && (
          <Card>
            <CardHeader>
              <CardTitle>Map Your Columns</CardTitle>
              <CardDescription>We've auto-detected some columns. Adjust if needed — at minimum, map the "Full Name" column.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-[140px] truncate text-foreground">{h}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={mapping[i] || "skip"} onValueChange={v => setMapping(p => ({ ...p, [i]: v }))}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PUPIL_FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping[i] && mapping[i] !== "skip" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </div>
                ))}
              </div>
              {!hasNameMapping && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" /> You must map at least the "Full Name" column
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                <Button disabled={!hasNameMapping} onClick={() => setStep("preview")}>Preview Import</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Preview — {getMappedRows().length} pupils to import</CardTitle>
              <CardDescription>Review the first 10 rows below. Click Import to add them all.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.values(mapping).filter(v => v !== "skip").map(f => (
                        <TableHead key={f} className="capitalize">{f}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getMappedRows().slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(mapping).filter(v => v !== "skip").map(f => (
                          <TableCell key={f}>{row[f] || "—"}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {getMappedRows().length > 10 && (
                <p className="text-xs text-muted-foreground">Showing first 10 of {getMappedRows().length} rows</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("map")}>Back</Button>
                <Button onClick={doImport} disabled={importing}>
                  {importing ? "Importing..." : `Import ${getMappedRows().length} Pupils`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Import Complete!</h2>
              <p className="text-muted-foreground mb-6">{importedCount} pupils have been added to your account.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); setHeaders([]); setMapping({}); }}>
                  Import More
                </Button>
                <Button onClick={() => window.location.href = "/instructor/pupils"}>
                  <Users className="h-4 w-4 mr-1" /> View Pupils
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </InstructorPortalLayout>
  );
}
