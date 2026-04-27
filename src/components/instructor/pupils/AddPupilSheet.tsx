import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CreditCard,
  Users as UsersIcon,
  ChevronDown,
  X,
} from "lucide-react";

// ---- Design tokens (instructor iOS system) ----
const HAIRLINE = "#E4E4E7";
const TEXT_PRIMARY = "#18181B";
const TEXT_SECONDARY = "#71717A";
const TEXT_TERTIARY = "#A1A1AA";
const SLATE = "#2A394F";
const ICON_BG = "#E8ECF1";
const SYSTEM_BLUE = "#007AFF";
const SHELL_BG_START = "#EEF2F7";
const SHELL_BG_END = "#E4E9F0";

export interface AddPupilFormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  course_type: string;
  notes: string;
  what3words: string;
  parent_phone: string;
  parent_name: string;
  date_of_birth: string;
  payment_method: string;
}

interface AddPupilSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AddPupilFormState;
  setForm: React.Dispatch<React.SetStateAction<AddPupilFormState>>;
  saving: boolean;
  onSave: () => void;
  isLookingUpW3W: boolean;
  setIsLookingUpW3W: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---- Section card primitives ----
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-1 mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase"
      style={{ color: TEXT_SECONDARY }}
    >
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ border: `0.5px solid ${HAIRLINE}` }}
    >
      {children}
    </div>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 mt-2 text-[12px] leading-snug" style={{ color: TEXT_SECONDARY }}>
      {children}
    </p>
  );
}

interface RowProps {
  label: string;
  required?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
  /** stack input under label (for full-width fields like address) */
  stacked?: boolean;
  trailing?: React.ReactNode;
}

function Row({ label, required, invalid, children, stacked, trailing }: RowProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 flex gap-3 transition-colors",
        stacked ? "flex-col" : "items-center justify-between",
      )}
      style={{
        background: invalid ? "#FEF2F2" : "transparent",
      }}
    >
      <div className={cn("flex items-center gap-1.5", stacked ? "" : "shrink-0")}>
        <span className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>
          {label}
        </span>
        {required && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: "#E02020" }}
            aria-label="required"
          />
        )}
        {trailing}
      </div>
      <div className={cn(stacked ? "w-full" : "flex-1 min-w-0 flex justify-end")}>
        {children}
      </div>
    </div>
  );
}

function RowDivider() {
  return (
    <div
      aria-hidden
      className="ml-4"
      style={{ borderBottom: `0.5px solid ${HAIRLINE}` }}
    />
  );
}

// Borderless input that right-aligns inside a Row
function RowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-transparent border-0 outline-none text-[15px] text-right placeholder:text-right",
        "focus:outline-none focus:ring-0",
        props.className,
      )}
      style={{
        color: TEXT_PRIMARY,
        ...(props.style || {}),
      }}
    />
  );
}

export function AddPupilSheet({
  open,
  onOpenChange,
  form,
  setForm,
  saving,
  onSave,
  isLookingUpW3W,
  setIsLookingUpW3W,
}: AddPupilSheetProps) {
  const isMobile = useIsMobile();
  const [submitted, setSubmitted] = useState(false);
  const [parentExpanded, setParentExpanded] = useState(false);

  // Auto-expand parent section if pupil is under 18
  const isUnder18 = useMemo(() => {
    if (!form.date_of_birth) return false;
    const dob = new Date(form.date_of_birth);
    if (isNaN(dob.getTime())) return false;
    const ageMs = Date.now() - dob.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    return ageYears < 18;
  }, [form.date_of_birth]);

  const showParent = parentExpanded || isUnder18;

  const isValid = form.name.trim().length > 0 && form.address.trim().length > 0 && form.postcode.trim().length > 0;
  const nameInvalid = submitted && !form.name.trim();
  const addressInvalid = submitted && !form.address.trim();
  const postcodeInvalid = submitted && !form.postcode.trim();

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) return;
    onSave();
  };

  const handlePostcodeLookup = async (postcode: string) => {
    setForm((prev) => ({ ...prev, postcode }));
    setIsLookingUpW3W(true);
    try {
      const { data } = await supabase.functions.invoke("convert-to-what3words", {
        body: { postcode },
      });
      if (data?.what3words) {
        setForm((prev) => ({ ...prev, what3words: data.what3words }));
        toast.success(`What3Words: ///${data.what3words}`);
      }
    } catch (err) {
      console.error("What3Words lookup failed:", err);
    } finally {
      setIsLookingUpW3W(false);
    }
  };

  // ---- Body content (shared between mobile sheet & desktop dialog) ----
  const body = (
    <div
      className="overflow-y-auto px-4 py-4 space-y-5"
      style={{
        background: `linear-gradient(180deg, ${SHELL_BG_START} 0%, ${SHELL_BG_END} 100%)`,
      }}
    >
      {/* Pupil details */}
      <section>
        <SectionLabel>Pupil details</SectionLabel>
        <SectionCard>
          <Row label="Name" required invalid={nameInvalid}>
            <RowInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </Row>
          <RowDivider />
          <Row label="Course type">
            <Select
              value={form.course_type}
              onValueChange={(val) => setForm({ ...form, course_type: val })}
            >
              <SelectTrigger
                className="border-0 bg-transparent shadow-none h-auto p-0 gap-1 justify-end text-[15px] focus:ring-0 focus:ring-offset-0"
                style={{ color: form.course_type ? TEXT_PRIMARY : TEXT_TERTIARY }}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="semi-intensive">Semi-intensive</SelectItem>
                <SelectItem value="intensive">Intensive</SelectItem>
                <SelectItem value="refresher">Refresher</SelectItem>
                <SelectItem value="pass-plus">Pass plus</SelectItem>
                <SelectItem value="motorway">Motorway</SelectItem>
                <SelectItem value="other">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <RowDivider />
          <Row label="Email">
            <RowInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
            />
          </Row>
          <RowDivider />
          <Row label="Phone">
            <RowInput
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07XXX XXXXXX"
            />
          </Row>
          <RowDivider />
          <Row label="Date of birth">
            <RowInput
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </Row>
        </SectionCard>
        <HelperText>Parent signature required on T&Cs for pupils under 18.</HelperText>
      </section>

      {/* Address */}
      <section>
        <SectionLabel>Address</SectionLabel>
        <SectionCard>
          <Row label="Address" required invalid={addressInvalid} stacked>
            <div className="mt-1">
              <GoogleAddressAutocomplete
                value={form.address}
                onChange={(address) => setForm({ ...form, address })}
                onPostcodeChange={handlePostcodeLookup}
                placeholder="Start typing an address…"
              />
            </div>
          </Row>
          <RowDivider />
          <Row label="Postcode" required invalid={postcodeInvalid}>
            <RowInput
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              placeholder="Auto-fills"
            />
          </Row>
          <RowDivider />
          <Row
            label="What3Words"
            trailing={
              isLookingUpW3W ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: TEXT_TERTIARY }} /> : null
            }
          >
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[15px]" style={{ color: TEXT_TERTIARY }}>///</span>
              <RowInput
                value={form.what3words}
                onChange={(e) => setForm({ ...form, what3words: e.target.value })}
                placeholder="word.word.word"
                className="!w-auto max-w-[180px]"
              />
            </div>
          </Row>
        </SectionCard>
        <HelperText>Postcode and what3words auto-fill when you select an address.</HelperText>
      </section>

      {/* Payment */}
      <section>
        <SectionLabel>Payment</SectionLabel>
        <SectionCard>
          <div className="px-4 py-3 flex items-center gap-3">
            <div
              className="shrink-0 rounded-[10px] flex items-center justify-center"
              style={{ width: 28, height: 28, background: ICON_BG }}
            >
              <CreditCard className="h-3.5 w-3.5" style={{ color: SLATE }} />
            </div>
            <span className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>
              Payment method
            </span>
            <div className="flex-1 flex justify-end">
              <Select
                value={form.payment_method}
                onValueChange={(val) => setForm({ ...form, payment_method: val })}
              >
                <SelectTrigger
                  className="border-0 bg-transparent shadow-none h-auto p-0 gap-1 justify-end text-[15px] focus:ring-0 focus:ring-offset-0 w-auto"
                  style={{ color: TEXT_PRIMARY }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tbc">TBC — decide later</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="send_link">Send payment link</SelectItem>
                  <SelectItem value="take_payment">Take payment now (QR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>
        {form.payment_method === "send_link" && (
          <HelperText>A payment link will be sent after saving the pupil.</HelperText>
        )}
        {form.payment_method === "take_payment" && (
          <HelperText>QR code will be shown after saving the pupil.</HelperText>
        )}
      </section>

      {/* Parent / guardian (collapsible) */}
      <section>
        <SectionLabel>Parent / guardian</SectionLabel>
        <SectionCard>
          <button
            type="button"
            onClick={() => setParentExpanded((v) => !v)}
            disabled={isUnder18}
            className="w-full px-4 py-3 flex items-center gap-3 text-left disabled:opacity-100"
          >
            <div
              className="shrink-0 rounded-[10px] flex items-center justify-center"
              style={{ width: 28, height: 28, background: ICON_BG }}
            >
              <UsersIcon className="h-3.5 w-3.5" style={{ color: SLATE }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>
                Parent portal access
              </div>
              <div className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
                {isUnder18 ? "Required for under 18s" : "Optional — tap to add"}
              </div>
            </div>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showParent && "rotate-180")}
              style={{ color: TEXT_TERTIARY }}
            />
          </button>
          <AnimatePresence initial={false}>
            {showParent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <RowDivider />
                <Row label="Parent name">
                  <RowInput
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                    placeholder="Parent's name"
                  />
                </Row>
                <RowDivider />
                <Row label="Parent phone">
                  <RowInput
                    value={form.parent_phone}
                    onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                    placeholder="07XXX XXXXXX"
                  />
                </Row>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>
        {showParent && (
          <HelperText>Parent uses this phone for portal access.</HelperText>
        )}
      </section>

      {/* Notes */}
      <section>
        <SectionLabel>Notes</SectionLabel>
        <SectionCard>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional notes…"
            rows={4}
            className="border-0 shadow-none resize-none rounded-2xl bg-transparent text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ color: TEXT_PRIMARY }}
          />
        </SectionCard>
      </section>

      {/* Bottom spacer for safe area */}
      <div className="h-4" />
    </div>
  );

  // ---- Sticky header ----
  const header = (
    <div
      className="sticky top-0 z-10 flex items-center justify-between px-4 h-12"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${HAIRLINE}`,
      }}
    >
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="text-[15px] font-normal"
        style={{ color: SYSTEM_BLUE }}
      >
        Cancel
      </button>
      <div className="flex flex-col items-center -mt-0.5">
        <span
          className="text-[10px] font-semibold tracking-[0.08em] uppercase leading-none"
          style={{ color: TEXT_SECONDARY }}
        >
          Pupils
        </span>
        <span className="text-[16px] font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
          Add new pupil
        </span>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="text-[15px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
        style={{ color: SYSTEM_BLUE }}
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-2xl border-0 max-h-[92dvh] flex flex-col overflow-hidden"
          style={{ background: SHELL_BG_START }}
        >
          {/* Hidden a11y title (visually replaced by custom header) */}
          <SheetHeader className="sr-only">
            <SheetTitle>Add new pupil</SheetTitle>
          </SheetHeader>
          {/* Grab handle */}
          <div className="flex justify-center pt-2 pb-1 shrink-0 bg-white">
            <div className="w-9 h-1 rounded-full" style={{ background: "#D4D4D8" }} />
          </div>
          {header}
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 max-w-lg max-h-[90dvh] overflow-hidden flex flex-col rounded-2xl border-0"
        style={{ background: SHELL_BG_START, border: `0.5px solid ${HAIRLINE}` }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add new pupil</DialogTitle>
        </DialogHeader>
        {header}
        {body}
      </DialogContent>
    </Dialog>
  );
}
