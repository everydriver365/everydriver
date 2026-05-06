import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  UserPlus,
  User as UserIcon,
  MapPin,
  Award,
  Calendar as CalendarIcon,
  FileText,
  Search as SearchIcon,
  Clock as ClockIcon,
  Check as CheckIcon,
} from "lucide-react";

// ---- Design tokens (mobile iOS system, kept for mobile sheet) ----
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
  // Extended fields (desktop redesign)
  first_name?: string;
  last_name?: string;
  sex?: string;
  pickup_address?: string;
  has_different_pickup?: boolean;
  previous_experience?: string;
  approx_hours?: string;
  transmission?: string;
  theory_passed?: boolean;
  theory_pass_date?: string;
  test_booked?: boolean;
  test_centre_id?: string;
  test_centre_label?: string;
  test_date?: string;
  test_time?: string;
  duration?: string;
  custom_hourly_rate?: string;
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

// ============ Mobile primitives (unchanged) ============

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
      style={{ background: invalid ? "#FEF2F2" : "transparent" }}
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
    <div aria-hidden className="ml-4" style={{ borderBottom: `0.5px solid ${HAIRLINE}` }} />
  );
}

function RowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-transparent border-0 outline-none text-[15px] text-right placeholder:text-right",
        "focus:outline-none focus:ring-0",
        props.className,
      )}
      style={{ color: TEXT_PRIMARY, ...(props.style || {}) }}
    />
  );
}

// ============ Desktop primitives (new) ============

const D_BG = "#F8F9FB";
const D_BORDER = "#ECEEF2";
const D_INPUT_BORDER = "#E5E7EB";
const D_TEXT = "#111827";
const D_SUB = "#9CA3AF";
const D_LABEL = "#374151";
const D_BLUE = "#1D4ED8";
const D_GREEN = "#059669";
const D_GREEN_BG = "#F0FDF4";

function DFieldLabel({
  label,
  badge,
}: {
  label: string;
  badge?: { label: string; bg: string; color: string };
}) {
  return (
    <div className="flex items-center gap-[5px] mb-[5px]">
      <span style={{ fontSize: 12, fontWeight: 600, color: D_LABEL }}>{label}</span>
      {badge && (
        <span
          style={{
            backgroundColor: badge.bg,
            borderRadius: 4,
            padding: "1px 5px",
            fontSize: 9,
            fontWeight: 700,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}

function DTextInput({
  value,
  onChange,
  placeholder,
  isConditional,
  prefix,
  suffix,
  type = "text",
  multiline,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isConditional?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  type?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? D_BLUE : isConditional ? D_GREEN : D_INPUT_BORDER;
  const bg = isConditional ? D_GREEN_BG : "#FFF";
  const textColor = isConditional ? D_GREEN : D_TEXT;
  const placeholderColor = isConditional ? "rgba(5,150,105,0.5)" : D_SUB;

  return (
    <div
      className="flex items-center"
      style={{
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "9px 12px",
        boxShadow: focused ? "0 0 0 3px rgba(29,78,216,0.1)" : undefined,
        alignItems: multiline ? "flex-start" : "center",
      }}
    >
      {prefix}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          className="flex-1 bg-transparent outline-none border-0 resize-none"
          style={{
            fontSize: 13,
            color: textColor,
            minHeight: 60,
            // @ts-ignore
            "--placeholder-color": placeholderColor,
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent outline-none border-0"
          style={{ fontSize: 13, color: textColor }}
        />
      )}
      {suffix}
    </div>
  );
}

function DSelect({
  value,
  placeholder,
  options,
  onChange,
  isConditional,
}: {
  value: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  isConditional?: boolean;
}) {
  const borderColor = isConditional ? D_GREEN : D_INPUT_BORDER;
  const bg = isConditional ? D_GREEN_BG : "#FFF";
  const textColor = value ? (isConditional ? D_GREEN : D_TEXT) : D_SUB;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        className="border-0 shadow-none focus:ring-0 focus:ring-offset-0 h-auto"
        style={{
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          padding: "9px 12px",
          fontSize: 13,
          color: textColor,
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DToggleRow({
  label,
  subtitle,
  value,
  onToggle,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        backgroundColor: "#FFF",
        border: `1px solid ${D_INPUT_BORDER}`,
        borderRadius: 10,
        padding: "9px 12px",
        marginBottom: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: D_LABEL }}>{label}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: D_SUB, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      <Switch checked={value} onCheckedChange={onToggle} />
    </div>
  );
}

function DSection({
  icon: Icon,
  label,
  children,
  isLast,
}: {
  icon: React.ComponentType<any>;
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: isLast ? 0 : 20,
        paddingBottom: isLast ? 0 : 20,
        borderBottom: isLast ? "none" : `1px solid ${D_BORDER}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Icon size={12} color={D_SUB} strokeWidth={1.8} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: D_SUB,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ============ Component ============

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

  // Test centres (desktop)
  const [testCentres, setTestCentres] = useState<{ id: string; name: string }[]>([]);
  const [testCentreOpen, setTestCentreOpen] = useState(false);
  const [testCentreSearch, setTestCentreSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("test_centres")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (!cancelled && data) setTestCentres(data as any);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredCentres = useMemo(() => {
    const q = testCentreSearch.trim().toLowerCase();
    if (!q) return testCentres;
    return testCentres.filter((c) => c.name.toLowerCase().includes(q));
  }, [testCentres, testCentreSearch]);

  const isUnder18 = useMemo(() => {
    if (!form.date_of_birth) return false;
    const dob = new Date(form.date_of_birth);
    if (isNaN(dob.getTime())) return false;
    const ageMs = Date.now() - dob.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    return ageYears < 18;
  }, [form.date_of_birth]);

  const showParent = parentExpanded || isUnder18;

  // Desktop derives `name` from first+last; mobile uses `name` directly.
  const desktopName = `${(form.first_name || "").trim()} ${(form.last_name || "").trim()}`.trim();
  const effectiveName = isMobile ? form.name : desktopName || form.name;

  const isValid =
    effectiveName.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.postcode.trim().length > 0;
  const nameInvalid = submitted && !effectiveName.trim();
  const addressInvalid = submitted && !form.address.trim();
  const postcodeInvalid = submitted && !form.postcode.trim();

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) return;
    // Ensure `name` is populated from first/last on desktop submit
    if (!isMobile && desktopName && desktopName !== form.name) {
      setForm((p) => ({ ...p, name: desktopName }));
    }
    onSave();
  };

  const [w3wHint, setW3wHint] = useState<string | null>(null);

  const handlePostcodeLookup = async (postcode: string) => {
    setForm((prev) => ({ ...prev, postcode }));
    setIsLookingUpW3W(true);
    setW3wHint(null);
    try {
      const { data } = await supabase.functions.invoke("convert-to-what3words", {
        body: { postcode },
      });
      if (data?.what3words) {
        setForm((prev) => ({ ...prev, what3words: data.what3words }));
        setW3wHint(null);
        toast.success(`What3Words: ///${data.what3words}`);
      } else if (data?.message) {
        setW3wHint("Auto-lookup unavailable — enter manually");
      }
    } catch (err) {
      console.error("What3Words lookup failed:", err);
      setW3wHint("Auto-lookup unavailable — enter manually");
    } finally {
      setIsLookingUpW3W(false);
    }
  };

  // Auto-lookup what3words when a valid UK postcode is typed/pasted (debounced)
  const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  useEffect(() => {
    if (!open) return;
    const pc = (form.postcode || "").trim();
    if (!pc || !UK_POSTCODE_RE.test(pc)) return;
    if ((form.what3words || "").trim()) return;
    const t = setTimeout(async () => {
      setIsLookingUpW3W(true);
      try {
        const { data } = await supabase.functions.invoke("convert-to-what3words", {
          body: { postcode: pc },
        });
        if (data?.what3words) {
          setForm((prev) => ({ ...prev, what3words: data.what3words }));
        }
      } catch (err) {
        console.error("What3Words auto-lookup failed:", err);
      } finally {
        setIsLookingUpW3W(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.postcode, open]);

  // ============ Mobile body (unchanged) ============
  const mobileBody = (
    <div
      className="overflow-y-auto px-4 py-4 space-y-5"
      style={{ background: `linear-gradient(180deg, ${SHELL_BG_START} 0%, ${SHELL_BG_END} 100%)` }}
    >
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
              isLookingUpW3W ? (
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: TEXT_TERTIARY }} />
              ) : null
            }
          >
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[15px]" style={{ color: TEXT_TERTIARY }}>
                ///
              </span>
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
        {showParent && <HelperText>Parent uses this phone for portal access.</HelperText>}
      </section>

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

      <div className="h-4" />
    </div>
  );

  // ============ Mobile sticky header (unchanged) ============
  const mobileHeader = (
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
          <SheetHeader className="sr-only">
            <SheetTitle>Add new pupil</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center pt-2 pb-1 shrink-0 bg-white">
            <div className="w-9 h-1 rounded-full" style={{ background: "#D4D4D8" }} />
          </div>
          {mobileHeader}
          {mobileBody}
        </SheetContent>
      </Sheet>
    );
  }

  // ============ Desktop dialog (NEW redesign) ============

  const updateForm = (patch: Partial<AddPupilFormState>) =>
    setForm((p) => ({ ...p, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden flex flex-col border-0 gap-0"
        style={{
          backgroundColor: D_BG,
          borderRadius: 20,
          width: 580,
          maxWidth: "95vw",
          maxHeight: "90vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Add pupil</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div
          style={{
            backgroundColor: D_BG,
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${D_BORDER}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#DBEAFE",
                }}
              >
                <UserPlus size={17} color={D_BLUE} strokeWidth={1.6} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: D_TEXT, letterSpacing: -0.3 }}>
                  Add pupil
                </div>
                <div style={{ fontSize: 11, color: D_SUB, marginTop: 2 }}>
                  All fields are optional — fill in what you know now
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#F3F4F6",
                border: `1px solid ${D_INPUT_BORDER}`,
              }}
            >
              <X size={10} color="#6B7280" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
          {/* Section 1: Pupil details */}
          <DSection icon={UserIcon} label="Pupil details">
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <DFieldLabel label="First name" />
                <DTextInput
                  value={form.first_name || ""}
                  onChange={(v) => updateForm({ first_name: v })}
                  placeholder="First name"
                />
              </div>
              <div className="flex-1">
                <DFieldLabel label="Last name" />
                <DTextInput
                  value={form.last_name || ""}
                  onChange={(v) => updateForm({ last_name: v })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <DFieldLabel label="Phone" />
                <DTextInput
                  value={form.phone}
                  onChange={(v) => updateForm({ phone: v })}
                  placeholder="07..."
                />
              </div>
              <div className="flex-1">
                <DFieldLabel label="Email" />
                <DTextInput
                  value={form.email}
                  onChange={(v) => updateForm({ email: v })}
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <DFieldLabel label="Date of birth" />
                <DTextInput
                  type="date"
                  value={form.date_of_birth}
                  onChange={(v) => updateForm({ date_of_birth: v })}
                  placeholder="dd / mm / yyyy"
                  suffix={<CalendarIcon size={14} color={D_SUB} strokeWidth={1.6} />}
                />
              </div>
              <div className="flex-1">
                <DFieldLabel label="Sex" />
                <DSelect
                  value={form.sex || ""}
                  placeholder="Select"
                  onChange={(v) => updateForm({ sex: v })}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not", label: "Prefer not to say" },
                  ]}
                />
              </div>
            </div>
            {nameInvalid && (
              <div style={{ fontSize: 11, color: "#DC2626", marginTop: 8 }}>
                Please enter a name
              </div>
            )}
          </DSection>

          {/* Section 2: Address */}
          <DSection icon={MapPin} label="Address">
            <div className="mb-3">
              <DFieldLabel
                label="Home address"
                badge={{ label: "postcode search", bg: "#F3F4F6", color: "#6B7280" }}
              />
              <div
                className="rounded-[10px] bg-white"
                style={{
                  border: `1px solid ${addressInvalid ? "#DC2626" : D_INPUT_BORDER}`,
                  padding: "4px 10px",
                }}
              >
                <GoogleAddressAutocomplete
                  value={form.address}
                  onChange={(address) => updateForm({ address })}
                  onPostcodeChange={handlePostcodeLookup}
                  placeholder="Start typing address or postcode..."
                />
              </div>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <DFieldLabel label="Postcode" />
                <DTextInput
                  value={form.postcode}
                  onChange={(v) => updateForm({ postcode: v })}
                  placeholder="SO23 1AB"
                />
              </div>
              <div className="flex-1">
                <DFieldLabel
                  label="What3Words"
                  badge={{ label: "w3w", bg: "#E8F5E9", color: "#2E7D32" }}
                />
                <DTextInput
                  value={form.what3words}
                  onChange={(v) => updateForm({ what3words: v })}
                  placeholder="word.word.word"
                  suffix={
                    isLookingUpW3W ? (
                      <Loader2 className="h-3 w-3 animate-spin" style={{ color: D_SUB }} />
                    ) : null
                  }
                />
              </div>
            </div>
            <DToggleRow
              label="Different pick-up location?"
              subtitle="If pupil is collected from a different address"
              value={!!form.has_different_pickup}
              onToggle={(v) => updateForm({ has_different_pickup: v })}
            />
            {form.has_different_pickup && (
              <div>
                <DFieldLabel label="Pick-up address" />
                <DTextInput
                  value={form.pickup_address || ""}
                  onChange={(v) => updateForm({ pickup_address: v })}
                  placeholder="Search pick-up address or postcode..."
                  isConditional
                  prefix={
                    <SearchIcon
                      size={13}
                      color={D_GREEN}
                      style={{ marginRight: 6 }}
                      strokeWidth={1.8}
                    />
                  }
                />
              </div>
            )}
          </DSection>

          {/* Section 3: Experience & testing */}
          <DSection icon={Award} label="Experience & testing">
            <div className="mb-3">
              <DFieldLabel label="Previous driving experience" />
              <DTextInput
                value={form.previous_experience || ""}
                onChange={(v) => updateForm({ previous_experience: v })}
                placeholder="e.g. Learner, some lessons with previous instructor"
              />
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <DFieldLabel label="Approx hours completed" />
                <DTextInput
                  value={form.approx_hours || ""}
                  onChange={(v) => updateForm({ approx_hours: v })}
                  placeholder="e.g. 10"
                  suffix={
                    <span style={{ fontSize: 12, color: D_SUB, marginLeft: 4 }}>hrs</span>
                  }
                />
              </div>
              <div className="flex-1">
                <DFieldLabel label="Transmission" />
                <DSelect
                  value={form.transmission || ""}
                  placeholder="Manual"
                  onChange={(v) => updateForm({ transmission: v })}
                  options={[
                    { value: "manual", label: "Manual" },
                    { value: "automatic", label: "Automatic" },
                  ]}
                />
              </div>
            </div>

            <DToggleRow
              label="Theory test passed?"
              subtitle="Record the date if known"
              value={!!form.theory_passed}
              onToggle={(v) => updateForm({ theory_passed: v })}
            />
            {form.theory_passed && (
              <div className="mb-3">
                <DFieldLabel label="Theory pass date" />
                <DTextInput
                  type="date"
                  value={form.theory_pass_date || ""}
                  onChange={(v) => updateForm({ theory_pass_date: v })}
                  placeholder="dd / mm / yyyy"
                  isConditional
                  suffix={<CalendarIcon size={14} color={D_GREEN} strokeWidth={1.6} />}
                />
              </div>
            )}

            <DToggleRow
              label="Driving test booked?"
              subtitle="Add test centre, date and time"
              value={!!form.test_booked}
              onToggle={(v) => updateForm({ test_booked: v })}
            />
            {form.test_booked && (
              <div>
                <div className="mb-3">
                  <DFieldLabel label="Test centre" />
                  <button
                    type="button"
                    onClick={() => setTestCentreOpen((o) => !o)}
                    className="w-full flex items-center"
                    style={{
                      backgroundColor: D_GREEN_BG,
                      border: `1px solid ${D_GREEN}`,
                      borderRadius: 10,
                      borderBottomLeftRadius: testCentreOpen ? 0 : 10,
                      borderBottomRightRadius: testCentreOpen ? 0 : 10,
                      padding: "9px 12px",
                    }}
                  >
                    <SearchIcon
                      size={13}
                      color={D_GREEN}
                      style={{ marginRight: 6 }}
                      strokeWidth={1.8}
                    />
                    <span
                      className="flex-1 text-left"
                      style={{
                        fontSize: 13,
                        color: form.test_centre_label ? D_GREEN : "rgba(5,150,105,0.5)",
                      }}
                    >
                      {form.test_centre_label || "Search test centre..."}
                    </span>
                    <ChevronDown size={12} color={D_GREEN} strokeWidth={2} />
                  </button>
                  {testCentreOpen && (
                    <div
                      style={{
                        backgroundColor: "#FFF",
                        border: `1px solid ${D_GREEN}`,
                        borderTop: 0,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        overflow: "hidden",
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      <input
                        type="text"
                        value={testCentreSearch}
                        onChange={(e) => setTestCentreSearch(e.target.value)}
                        placeholder="Filter centres..."
                        autoFocus
                        className="w-full outline-none border-0"
                        style={{
                          fontSize: 12,
                          padding: "8px 12px",
                          borderBottom: `1px solid #F3F4F6`,
                        }}
                      />
                      {filteredCentres.length === 0 ? (
                        <div style={{ padding: "12px", fontSize: 12, color: D_SUB }}>
                          No centres found
                        </div>
                      ) : (
                        filteredCentres.map((c) => {
                          const selected = form.test_centre_id === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                updateForm({ test_centre_id: c.id, test_centre_label: c.name });
                                setTestCentreOpen(false);
                              }}
                              className="w-full text-left flex items-center gap-1.5"
                              style={{
                                padding: "9px 12px",
                                borderBottom: "0.5px solid #F3F4F6",
                                backgroundColor: selected ? "#EEF2FF" : "#FFF",
                                fontSize: 12,
                                fontWeight: selected ? 600 : 500,
                                color: selected ? D_BLUE : D_LABEL,
                              }}
                            >
                              {selected && (
                                <CheckIcon size={10} color={D_BLUE} strokeWidth={2.2} />
                              )}
                              {c.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <DFieldLabel label="Test date" />
                    <DTextInput
                      type="date"
                      value={form.test_date || ""}
                      onChange={(v) => updateForm({ test_date: v })}
                      placeholder="dd / mm / yyyy"
                      isConditional
                      suffix={<CalendarIcon size={14} color={D_GREEN} strokeWidth={1.6} />}
                    />
                  </div>
                  <div className="flex-1">
                    <DFieldLabel label="Test time" />
                    <DTextInput
                      type="time"
                      value={form.test_time || ""}
                      onChange={(v) => updateForm({ test_time: v })}
                      placeholder="e.g. 10:30"
                      isConditional
                      suffix={<ClockIcon size={14} color={D_GREEN} strokeWidth={1.6} />}
                    />
                  </div>
                </div>
              </div>
            )}
          </DSection>

          {/* Section 4: Lesson preferences */}
          <DSection icon={CalendarIcon} label="Lesson preferences">
            <div className="flex gap-3">
              <div className="flex-1">
                <DFieldLabel label="Lesson type" />
                <DSelect
                  value={form.course_type}
                  placeholder="Standard lesson"
                  onChange={(v) => updateForm({ course_type: v })}
                  options={[
                    { value: "weekly", label: "Weekly" },
                    { value: "semi-intensive", label: "Semi-intensive" },
                    { value: "intensive", label: "Intensive" },
                    { value: "refresher", label: "Refresher" },
                    { value: "pass-plus", label: "Pass plus" },
                    { value: "motorway", label: "Motorway" },
                    { value: "other", label: "Custom" },
                  ]}
                />
              </div>
              <div className="flex-1">
                <DFieldLabel label="Duration" />
                <DSelect
                  value={form.duration || ""}
                  placeholder="1 hour"
                  onChange={(v) => updateForm({ duration: v })}
                  options={[
                    { value: "60", label: "1 hour" },
                    { value: "90", label: "1.5 hours" },
                    { value: "120", label: "2 hours" },
                    { value: "180", label: "3 hours" },
                  ]}
                />
              </div>
            </div>
            <div className="mt-3">
              <DFieldLabel label="Hourly rate" />
              <DTextInput
                value={form.custom_hourly_rate || ""}
                onChange={(v) => updateForm({ custom_hourly_rate: v })}
                placeholder="0.00"
                prefix={<span style={{ fontSize: 13, color: D_SUB, marginRight: 4 }}>£</span>}
              />
            </div>
          </DSection>

          {/* Section 5: Notes */}
          <DSection icon={FileText} label="Notes" isLast>
            <DTextInput
              value={form.notes}
              onChange={(v) => updateForm({ notes: v })}
              placeholder="Any additional notes about this pupil..."
              multiline
              rows={3}
            />
          </DSection>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between"
          style={{
            backgroundColor: "#FFF",
            borderTop: `1px solid ${D_BORDER}`,
            padding: "14px 24px",
          }}
        >
          <span style={{ fontSize: 11, color: D_SUB }}>
            You can edit all details after saving
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                backgroundColor: "#FFF",
                border: `1px solid ${D_INPUT_BORDER}`,
                borderRadius: 8,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: D_LABEL,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: D_BLUE,
                borderRadius: 8,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: "#FFF",
              }}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add pupil
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
