import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Search, MapPin, Check } from "lucide-react";

type Kind = "theory" | "driving";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: Kind;
  pupilId: string;
  initial: {
    theory_test_date?: string | null;
    theory_test_passed?: boolean | null;
    test_date?: string | null;
    test_time?: string | null;
    test_passed?: boolean | null;
    test_centre_id?: string | null;
    test_centre_name?: string | null;
  };
}

type Status = "not_taken" | "booked" | "passed" | "failed";

export function TestStatusSheet({ open, onOpenChange, kind, pupilId, initial }: Props) {
  const qc = useQueryClient();
  const isTheory = kind === "theory";
  const dateField = isTheory ? "theory_test_date" : "test_date";
  const passedField = isTheory ? "theory_test_passed" : "test_passed";
  const title = isTheory ? "Theory test" : "Driving test";

  const initDate = (initial[dateField as keyof typeof initial] as string | null | undefined) ?? "";
  const initPassed = initial[passedField as keyof typeof initial] as boolean | null | undefined;
  const initTime = (initial.test_time ?? "") as string;

  const initialStatus: Status =
    initPassed === true ? "passed" : initPassed === false ? "failed" : initDate ? "booked" : "not_taken";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [date, setDate] = useState<string>(initDate ? String(initDate).slice(0, 10) : "");
  const [time, setTime] = useState<string>(initTime ? String(initTime).slice(0, 5) : "");
  const [centreId, setCentreId] = useState<string | null>(initial.test_centre_id ?? null);
  const [centreName, setCentreName] = useState<string | null>(initial.test_centre_name ?? null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setDate(initDate ? String(initDate).slice(0, 10) : "");
      setTime(initTime ? String(initTime).slice(0, 5) : "");
      setCentreId(initial.test_centre_id ?? null);
      setCentreName(initial.test_centre_name ?? null);
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Test centres (only for driving)
  const { data: centres } = useQuery({
    queryKey: ["test-centres-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name, address, postcode")
        .eq("is_active", true)
        .order("name");
      return (data ?? []) as Array<{ id: string; name: string; address: string | null; postcode: string | null }>;
    },
    enabled: !isTheory && open,
    staleTime: 5 * 60_000,
  });

  const filtered = useMemo(() => {
    if (!centres) return [];
    const q = search.trim().toLowerCase();
    if (!q) return centres.slice(0, 50);
    return centres.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.postcode?.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [centres, search]);

  const save = async () => {
    setSaving(true);
    const payload: Record<string, any> = {};
    if (status === "passed") {
      payload[passedField] = true;
      payload[dateField] = date || null;
    } else if (status === "failed") {
      payload[passedField] = false;
      payload[dateField] = date || null;
    } else if (status === "booked") {
      payload[passedField] = null;
      payload[dateField] = date || null;
    } else {
      payload[passedField] = null;
      payload[dateField] = null;
    }
    if (!isTheory) {
      payload.test_time = status === "booked" && time ? time : status === "not_taken" ? null : (time || null);
      payload.test_centre_id = status === "not_taken" ? null : centreId;
    }

    const { error } = await supabase.from("pupils").update(payload).eq("id", pupilId);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${title} updated` });
    qc.invalidateQueries({ queryKey: ["pupil-home-extras", pupilId] });
    onOpenChange(false);
  };

  const StatusBtn = ({ value, label }: { value: Status; label: string }) => (
    <button
      type="button"
      onClick={() => setStatus(value)}
      className="px-3 py-2 text-sm rounded-lg border transition-colors"
      style={{
        borderColor: status === value ? "#0F2044" : "#E5E7EB",
        background: status === value ? "#0F2044" : "#fff",
        color: status === value ? "#fff" : "#0F2044",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Update your status — your instructor will see it instantly.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatusBtn value="not_taken" label={isTheory ? "Not taken" : "Not booked"} />
          <StatusBtn value="booked" label="Booked" />
          <StatusBtn value="passed" label="Passed" />
          <StatusBtn value="failed" label={isTheory ? "Failed" : "Didn't pass"} />
        </div>

        {status !== "not_taken" && (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="t-date">Date</Label>
              <Input
                id="t-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {!isTheory && status === "booked" && (
              <div>
                <Label htmlFor="t-time">Time</Label>
                <Input
                  id="t-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            )}

            {!isTheory && (
              <div>
                <Label>Test centre</Label>
                {centreId && centreName && (
                  <div
                    className="flex items-center justify-between rounded-lg border px-3 py-2 mb-2"
                    style={{ borderColor: "#E5E7EB", background: "#F8FAFC" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin size={14} style={{ color: "#0F2044" }} />
                      <div className="text-sm font-semibold truncate" style={{ color: "#0F2044" }}>
                        {centreName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCentreId(null);
                        setCentreName(null);
                      }}
                      className="text-xs font-semibold"
                      style={{ color: "#B91C1C" }}
                    >
                      Change
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#94A3B8" }}
                  />
                  <Input
                    placeholder="Search centres by name or postcode"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div
                  className="mt-2 rounded-lg border divide-y max-h-56 overflow-y-auto"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-center" style={{ color: "#6B7280" }}>
                      {centres ? "No centres match" : "Loading…"}
                    </div>
                  ) : (
                    filtered.map((c) => {
                      const selected = c.id === centreId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCentreId(c.id);
                            setCentreName(c.name);
                          }}
                          className="w-full text-left px-3 py-2 flex items-start justify-between gap-2 hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: "#0F2044" }}>
                              {c.name}
                            </div>
                            {(c.address || c.postcode) && (
                              <div className="text-xs truncate" style={{ color: "#6B7280" }}>
                                {[c.address, c.postcode].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>
                          {selected && <Check size={16} style={{ color: "#0F2044" }} />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2 sticky bottom-0 bg-background pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
