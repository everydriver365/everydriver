import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/**
 * Mobile card to set the instructor's "Available from" date.
 * When set, all public booking pages (Drive365, white-label, mini-website,
 * intensives, etc.) hide this instructor for any date before it.
 */
export function AvailableFromCard({ instructorId }: { instructorId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("available_from")
        .eq("id", instructorId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error(error);
      } else {
        setValue((data?.available_from as string | null) ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  const save = async (next: string | null) => {
    // Guard: dates more than 14 days out hide every slot from pupils until then.
    // This is the trap that caused "Ken D shows no availability" — confirm first.
    if (next) {
      const target = parseISO(next);
      const daysOut = Math.round(
        (target.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
      );
      if (daysOut > 14) {
        const ok = window.confirm(
          `Heads up: pupils won't see ANY availability until ${format(target, "EEE d MMM yyyy")} (${daysOut} days from now).\n\nUse "Time off" for short breaks instead.\n\nContinue?`,
        );
        if (!ok) return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({ available_from: next } as any)
      .eq("id", instructorId);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Couldn't update");
      return;
    }
    setValue(next);
    toast.success(next ? `Available from ${format(parseISO(next), "d MMM yyyy")}` : "Available now");
  };

  const display = value ? format(parseISO(value), "EEE, d MMM yyyy") : "Available now";

  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 16,
        padding: "12px 14px",
        marginBottom: 14,
        border: "0.5px solid rgba(26,82,160,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#EDF2FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalendarIcon size={16} color="#3D55A1" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>Available from</div>
          <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
            Hide bookings before this date
          </div>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              disabled={loading || saving}
              style={{
                background: value ? "#3D55A1" : "#F2F4F8",
                color: value ? "#FFF" : "#1A1A1A",
                borderRadius: 10,
                padding: "7px 11px",
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "…" : value ? format(parseISO(value), "d MMM") : "Set date"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-auto" style={{ borderRadius: 12 }}>
            <Calendar
              mode="single"
              selected={value ? parseISO(value) : undefined}
              onSelect={(d) => {
                save(d ? format(d, "yyyy-MM-dd") : null);
                setOpen(false);
              }}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {value && (
          <button
            onClick={() => save(null)}
            disabled={saving}
            title="Clear"
            style={{
              border: "none",
              background: "#FFF0F0",
              borderRadius: 8,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={12} color="#B23A3F" strokeWidth={2} />
          </button>
        )}
      </div>
      {value && (
        <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 8, paddingLeft: 46 }}>
          Pupils will see {display} as your earliest bookable date.
        </div>
      )}
    </div>
  );
}
