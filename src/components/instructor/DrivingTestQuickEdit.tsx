import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icons (Vite bundling issue) — run once at module load
if (typeof window !== "undefined" && !(L.Icon.Default.prototype as any)._lovablePatched) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
  (L.Icon.Default.prototype as any)._lovablePatched = true;
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(points as any, { padding: [24, 24], maxZoom: 13 });
  }, [map, JSON.stringify(points)]);
  return null;
}

type Status = "none" | "booked" | "passed" | "failed";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupil: any;
  onSaved?: () => void;
}

type Centre = { id: string; name: string; postcode: string | null; lat: number | null; lng: number | null };

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(s));
  return km * 0.621371;
}

export function DrivingTestQuickEdit({ open, onOpenChange, pupil, onSaved }: Props) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("none");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [centreId, setCentreId] = useState<string>("");
  const [resultDate, setResultDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [centres, setCentres] = useState<Centre[]>([]);

  // Postcode + radius filter state
  const [postcode, setPostcode] = useState<string>("");
  const [radius, setRadius] = useState<number>(20);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeError, setGeocodeError] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !pupil) return;
    const today = new Date().toISOString().slice(0, 10);
    const initial: Status =
      pupil.test_passed === true ? "passed"
      : (pupil.test_date && pupil.test_date >= today) ? "booked"
      : pupil.test_passed === false ? "failed"
      : "none";
    setStatus(initial);
    setDate(pupil.test_date || "");
    setTime(pupil.test_time ? String(pupil.test_time).slice(0, 5) : "");
    setCentreId(pupil.test_centre_id || "");
    setResultDate(pupil.test_result_date || "");
    setPostcode((pupil.home_postcode || "").toUpperCase());
    setRadius(20);
    setShowAll(false);
    setOrigin(null);
    setGeocodeError(false);
  }, [open, pupil?.id]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name, postcode, lat, lng")
        .eq("is_active", true)
        .order("name");
      if (!cancelled) setCentres((data || []) as any);
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Debounced postcode geocoding via postcodes.io
  useEffect(() => {
    if (!open) return;
    const pc = postcode.trim();
    if (!pc) { setOrigin(null); setGeocodeError(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
        if (!res.ok) { if (!cancelled) { setOrigin(null); setGeocodeError(true); } return; }
        const json = await res.json();
        const lat = json?.result?.latitude;
        const lng = json?.result?.longitude;
        if (!cancelled) {
          if (typeof lat === "number" && typeof lng === "number") {
            setOrigin({ lat, lng });
            setGeocodeError(false);
          } else {
            setOrigin(null);
            setGeocodeError(true);
          }
        }
      } catch {
        if (!cancelled) { setOrigin(null); setGeocodeError(true); }
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [postcode, open]);

  const rankedCentres = useMemo(() => {
    if (!origin) {
      // Alphabetical fallback, no distances
      return centres.map((c) => ({ ...c, distance: null as number | null }));
    }
    const withDist = centres.map((c) => {
      const distance =
        c.lat != null && c.lng != null
          ? haversineMiles(origin, { lat: Number(c.lat), lng: Number(c.lng) })
          : null;
      return { ...c, distance };
    });
    withDist.sort((a, b) => {
      if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
    return withDist;
  }, [centres, origin]);

  const visibleCentres = useMemo(() => {
    if (!origin || showAll) return rankedCentres;
    const filtered = rankedCentres.filter(
      (c) => c.distance != null && c.distance <= radius,
    );
    // Always keep the currently-selected centre visible at the top
    if (centreId && !filtered.find((c) => c.id === centreId)) {
      const selected = rankedCentres.find((c) => c.id === centreId);
      if (selected) return [selected, ...filtered];
    }
    return filtered;
  }, [rankedCentres, origin, showAll, radius, centreId]);

  const save = async () => {
    if (!pupil) return;
    setSaving(true);
    try {
      const payload: any = {
        test_passed:
          status === "passed" ? true
          : status === "failed" ? false
          : null,
        test_date: status === "booked" ? (date || null) : (status === "none" ? null : (date || null)),
        test_time: status === "booked" ? (time || null) : null,
        test_centre_id: (status === "booked" || status === "passed" || status === "failed") ? (centreId || null) : null,
        test_result_date: (status === "passed" || status === "failed") ? (resultDate || null) : null,
      };
      const { error } = await supabase.from("pupils").update(payload).eq("id", pupil.id);
      if (error) throw error;
      toast.success("Driving test updated");
      qc.invalidateQueries({ queryKey: ["pupil-profile"] });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Driving test</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not booked</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Not passed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "booked" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          )}

          {(status === "passed" || status === "failed") && (
            <div className="space-y-1.5">
              <Label>Result date</Label>
              <Input type="date" value={resultDate} onChange={(e) => setResultDate(e.target.value)} />
            </div>
          )}

          {(status === "booked" || status === "passed" || status === "failed") && (
            <div className="space-y-2">
              <Label>Test centre</Label>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Near postcode</Label>
                  <Input
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    placeholder="e.g. SO22 6AB"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Within {radius} mi
                  </Label>
                  <div className="pt-3">
                    <Slider
                      min={5}
                      max={50}
                      step={5}
                      value={[radius]}
                      onValueChange={(v) => setRadius(v[0])}
                      disabled={showAll || !origin}
                    />
                  </div>
                </div>
              </div>

              {geocodeError && postcode.trim() && (
                <p className="text-xs text-muted-foreground">
                  Couldn't locate postcode — showing all centres.
                </p>
              )}

              <Select value={centreId || "__none__"} onValueChange={(v) => setCentreId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select a centre…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {visibleCentres.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.postcode ? ` · ${c.postcode}` : ""}
                      {c.distance != null ? ` · ${c.distance.toFixed(1)} mi` : ""}
                    </SelectItem>
                  ))}
                  {origin && !showAll && (
                    <div className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowAll(true); }}
                        className="text-xs text-primary hover:underline w-full text-left"
                      >
                        Show all centres
                      </button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
