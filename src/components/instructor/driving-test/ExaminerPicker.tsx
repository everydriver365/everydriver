import { useEffect, useMemo, useState } from "react";
import { ChevronDown, User, Plus, Check } from "lucide-react";
import {
  IOSSheet,
  IOSSheetBody,
  IOSSheetHeader,
  IOSSheetTitle,
} from "@/components/ui/IOSSheet";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { FormInputCard } from "@/components/instructor/ui/FormInputCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Examiner } from "./types";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

interface ExaminerPickerProps {
  value: string;
  onChange: (value: string) => void;
  instructorId: string;
  /** When provided, examiners assigned to this centre come first. Required to enable. */
  testCentreId?: string | null;
}

/**
 * Premium tile-system Examiner picker with cascading dependency on a test centre.
 * Disabled until a test centre is selected. Inline "Add new examiner" link in the
 * picker sheet replaces the standalone "+" button. Behaviour-preserving rewrite of
 * <ExaminerSelector> using the new design system.
 */
export function ExaminerPicker({
  value,
  onChange,
  instructorId,
  testCentreId,
}: ExaminerPickerProps) {
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExaminerName, setNewExaminerName] = useState("");
  const [newExaminerNumber, setNewExaminerNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const enabled = !!testCentreId;

  useEffect(() => {
    if (instructorId) fetchExaminers();
  }, [instructorId]);

  const fetchExaminers = async () => {
    const { data } = await supabase
      .from("examiners")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("name");
    if (data) setExaminers(data as Examiner[]);
  };

  // Examiners at this centre first, then unassigned, then others.
  const filtered = useMemo(() => {
    if (!testCentreId) return examiners;
    const atCentre = examiners.filter((e) => e.test_centre_id === testCentreId);
    const unassigned = examiners.filter((e) => !e.test_centre_id);
    return [...atCentre, ...unassigned];
  }, [examiners, testCentreId]);

  // Clear the selection if the previously chosen examiner is no longer in the list
  // (e.g. the user changed test centre).
  useEffect(() => {
    if (value && !filtered.some((e) => e.id === value)) {
      onChange("");
    }
  }, [filtered, value, onChange]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.dvsa_staff_number || "").toLowerCase().includes(q),
    );
  }, [filtered, search]);

  const selected = examiners.find((e) => e.id === value) || null;

  const handleAddExaminer = async () => {
    if (!newExaminerName.trim()) {
      toast({ title: "Please enter examiner name", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("examiners")
        .insert({
          instructor_id: instructorId,
          name: newExaminerName.trim(),
          dvsa_staff_number: newExaminerNumber.trim() || null,
          test_centre_id: testCentreId || null,
        })
        .select()
        .single();
      if (error) throw error;
      setExaminers((prev) => [...prev, data as Examiner]);
      onChange(data.id);
      setShowAddDialog(false);
      setNewExaminerName("");
      setNewExaminerNumber("");
      setOpen(false);
      toast({ title: "Examiner added" });
    } catch (error) {
      console.error("Error adding examiner:", error);
      toast({ title: "Failed to add examiner", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) {
    return (
      <div
        aria-disabled="true"
        style={{
          background: "#F2F2F4",
          border: "0.5px solid #E5E5EA",
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          cursor: "not-allowed",
          fontFamily: FONT_STACK,
        }}
      >
        <User size={18} strokeWidth={1.8} color="#C7C7CC" />
        <span
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 400,
            color: "#C7C7CC",
          }}
        >
          Pick test centre first
        </span>
      </div>
    );
  }

  return (
    <>
      <FormInputCard
        icon={<User size={18} strokeWidth={1.8} />}
        placeholder="Pick examiner"
        value={selected?.name ?? null}
        trailing={<ChevronDown size={12} strokeWidth={1.6} />}
        onClick={() => setOpen(true)}
      />

      <IOSSheet open={open} onOpenChange={setOpen} snapPoints={[0.7, 1]}>
        <IOSSheetHeader>
          <IOSSheetTitle>Examiner</IOSSheetTitle>
        </IOSSheetHeader>
        <div style={{ padding: "0 16px 12px" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search examiners"
          />
        </div>
        <IOSSheetBody>
          {searched.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "#6E6E73",
                fontSize: 14,
              }}
            >
              No examiners for this centre yet.
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {searched.map((ex) => {
                const active = ex.id === value;
                const offCentre =
                  testCentreId && ex.test_centre_id !== testCentreId;
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(ex.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 4px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "0.5px solid #E5E5EA",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: FONT_STACK,
                      }}
                    >
                      <User size={16} strokeWidth={1.8} color="#6E6E73" />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: "#000000",
                          fontWeight: active ? 500 : 400,
                        }}
                      >
                        {ex.name}
                        {ex.dvsa_staff_number && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 12,
                              color: "#6E6E73",
                              fontWeight: 400,
                            }}
                          >
                            ({ex.dvsa_staff_number})
                          </span>
                        )}
                      </span>
                      {offCentre && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#6E6E73",
                            background: "#F2F2F4",
                            padding: "2px 6px",
                            borderRadius: 4,
                            letterSpacing: 0.2,
                            textTransform: "uppercase",
                            fontWeight: 500,
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                      {active && (
                        <Check size={16} strokeWidth={1.8} color="#2B7BC8" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: 0,
              padding: "10px 4px",
              cursor: "pointer",
              color: "#2B7BC8",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: FONT_STACK,
            }}
          >
            <Plus size={14} strokeWidth={1.8} />
            Add new examiner
          </button>
        </IOSSheetBody>
      </IOSSheet>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Examiner</DialogTitle>
            <DialogDescription>
              {testCentreId
                ? "This examiner will be linked to the selected test centre."
                : "Add a new driving test examiner to your list."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examiner-name">Examiner Name *</Label>
              <Input
                id="examiner-name"
                value={newExaminerName}
                onChange={(e) => setNewExaminerName(e.target.value)}
                placeholder="e.g., John Smith"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-number">DVSA Staff Number (optional)</Label>
              <Input
                id="staff-number"
                value={newExaminerNumber}
                onChange={(e) => setNewExaminerNumber(e.target.value)}
                placeholder="e.g., 12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExaminer} disabled={saving}>
              Add Examiner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
