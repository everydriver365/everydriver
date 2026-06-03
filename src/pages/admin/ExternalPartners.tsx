import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface Instructor {
  id: string;
  name: string;
  home_postcode: string | null;
}

interface AllowlistRow {
  id: string;
  instructor_id: string;
  partner_key: string;
  is_active: boolean;
  notes: string | null;
}

const DEFAULT_PARTNER = "project_x";

export default function ExternalPartners() {
  const [partnerKey, setPartnerKey] = useState(DEFAULT_PARTNER);
  const [partners, setPartners] = useState<string[]>([]);
  const [rows, setRows] = useState<AllowlistRow[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadPartners() {
    const { data } = await supabase
      .from("external_booking_allowlist")
      .select("partner_key");
    const uniq = Array.from(new Set((data ?? []).map((r: any) => r.partner_key as string)));
    if (!uniq.includes(DEFAULT_PARTNER)) uniq.unshift(DEFAULT_PARTNER);
    setPartners(uniq);
  }

  async function loadRows() {
    const { data, error } = await supabase
      .from("external_booking_allowlist")
      .select("id, instructor_id, partner_key, is_active, notes")
      .eq("partner_key", partnerKey)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load allow-list", description: error.message, variant: "destructive" });
    setRows((data ?? []) as AllowlistRow[]);
  }

  useEffect(() => { loadPartners(); }, []);
  useEffect(() => { loadRows(); }, [partnerKey]);

  const allowedIds = useMemo(() => new Set(rows.map((r) => r.instructor_id)), [rows]);

  async function runSearch(q: string) {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("instructors")
      .select("id, name, home_postcode")
      .eq("is_network_placeholder", false)
      .or(`name.ilike.%${q}%,home_postcode.ilike.%${q}%`)
      .limit(20);
    setResults((data ?? []) as Instructor[]);
    setLoading(false);
  }

  async function addInstructor(id: string) {
    const { error } = await supabase
      .from("external_booking_allowlist")
      .insert({ instructor_id: id, partner_key: partnerKey, is_active: true });
    if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Added to allow-list" });
    loadRows();
  }

  async function toggle(rowId: string, isActive: boolean) {
    const { error } = await supabase
      .from("external_booking_allowlist")
      .update({ is_active: isActive })
      .eq("id", rowId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setRows((r) => r.map((x) => x.id === rowId ? { ...x, is_active: isActive } : x));
  }

  async function remove(rowId: string) {
    const { error } = await supabase
      .from("external_booking_allowlist")
      .delete()
      .eq("id", rowId);
    if (error) { toast({ title: "Remove failed", description: error.message, variant: "destructive" }); return; }
    setRows((r) => r.filter((x) => x.id !== rowId));
  }

  const [instructorMap, setInstructorMap] = useState<Record<string, Instructor>>({});
  useEffect(() => {
    const ids = rows.map((r) => r.instructor_id);
    if (ids.length === 0) { setInstructorMap({}); return; }
    supabase.from("instructors").select("id, name, home_postcode").in("id", ids).then(({ data }) => {
      const map: Record<string, Instructor> = {};
      (data ?? []).forEach((i: any) => { map[i.id] = i as Instructor; });
      setInstructorMap(map);
    });
  }, [rows]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">External Partners</h1>
        <p className="text-sm text-muted-foreground">
          Control which instructors are bookable from external Lovable sites.
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <label className="text-sm font-medium">Partner key</label>
        <div className="flex gap-2">
          <Input
            value={partnerKey}
            onChange={(e) => setPartnerKey(e.target.value)}
            placeholder="project_x"
            className="max-w-xs"
          />
          <select
            value={partnerKey}
            onChange={(e) => setPartnerKey(e.target.value)}
            className="text-sm border rounded-md px-2"
          >
            {partners.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          This label must match a key in the <code>EXTERNAL_BOOKING_PARTNER_KEYS</code> secret.
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Add instructor</h2>
        <Input
          value={search}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Search by name or postcode…"
        />
        {loading && <p className="text-xs text-muted-foreground">Searching…</p>}
        <div className="space-y-1">
          {results.map((i) => (
            <div key={i.id} className="flex items-center justify-between border rounded-md p-2">
              <div>
                <div className="text-sm font-medium">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.home_postcode}</div>
              </div>
              {allowedIds.has(i.id) ? (
                <span className="text-xs text-muted-foreground">Already added</span>
              ) : (
                <Button size="sm" onClick={() => addInstructor(i.id)}>Add</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium">Allow-list for <code>{partnerKey}</code> ({rows.length})</h2>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No instructors yet.</p>}
        <div className="space-y-1">
          {rows.map((r) => {
            const i = instructorMap[r.instructor_id];
            return (
              <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="text-sm font-medium">{i?.name ?? r.instructor_id}</div>
                  <div className="text-xs text-muted-foreground">{i?.home_postcode}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span>{r.is_active ? "Active" : "Off"}</span>
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => remove(r.id)}>Remove</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
