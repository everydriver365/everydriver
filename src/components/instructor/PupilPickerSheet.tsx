import { useState } from "react";
import { Loader2, Mic, Search as SearchIcon, X, AlertCircle, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchInput } from "@/components/instructor/ui/SearchInput";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { pupilAvatarColor, pupilAvatarInitial } from "@/lib/pupilAvatarColor";
import { formatPhoneNumber } from "@/lib/formatPhoneNumber";
import { titleCaseName } from "@/lib/titleCase";
import {
  detectDataQualityIssues,
  findPhoneDuplicateName,
} from "@/lib/detectDataQualityIssues";
import { compactRelative } from "@/lib/relativeTime";
import { toast } from "sonner";

const TEXT = "#000000";
const MUTED = "#6E6E73";
const HAIRLINE = "0.5px solid #E5E5EA";
const BLUE = "#2B7BC8";
const AMBER_TINT = "#FBF1DE";
const AMBER = "#B8801F";
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const RECENT_DAYS = 30;
const RECENT_MAX = 8;

export interface PickerPupil {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  profile_image_url: string | null;
}

export interface PickerRecentItem {
  pupil_id: string | null;
  last_message_at: string | null;
}

export interface PupilPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupils: PickerPupil[];
  loading?: boolean;
  /** Optional source for the "Recent" section. Omit to hide it. */
  recentSource?: PickerRecentItem[];
  onPick: (pupil: PickerPupil) => void;
  onAddPupil?: () => void;
  title?: string;
  searchPlaceholder?: string;
}

function DataQualityBadge() {
  return (
    <span
      style={{
        background: AMBER_TINT,
        color: AMBER,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.3px",
        padding: "2px 5px",
        borderRadius: 3,
        textTransform: "uppercase",
        marginLeft: 6,
        flexShrink: 0,
      }}
    >
      Review
    </span>
  );
}

function PupilPickerRow({
  pupil,
  timestamp,
  flagged,
  issueLabel,
  onPick,
}: {
  pupil: PickerPupil;
  timestamp?: string;
  flagged: boolean;
  issueLabel?: string | null;
  onPick: () => void;
}) {
  const displayName = titleCaseName(pupil.name);
  const formattedPhone = formatPhoneNumber(pupil.phone);
  const subtitle =
    flagged && issueLabel
      ? formattedPhone
        ? `${formattedPhone} · ${issueLabel}`
        : issueLabel
      : formattedPhone;

  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        padding: "10px 8px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        opacity: flagged ? 0.6 : 1,
      }}
    >
      {flagged ? (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: MUTED,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertCircle size={18} strokeWidth={2} color="#FFFFFF" />
        </div>
      ) : pupil.profile_image_url ? (
        <img
          src={pupil.profile_image_url}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: pupilAvatarColor(pupil.id),
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {pupilAvatarInitial(pupil.name)}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TEXT,
              letterSpacing: "-0.1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {displayName || "Unnamed"}
          </span>
          {flagged && <DataQualityBadge />}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              margin: "1px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {timestamp && (
        <span style={{ fontSize: 11, color: MUTED, flexShrink: 0, marginLeft: 8 }}>
          {timestamp}
        </span>
      )}
    </button>
  );
}

function PickerEmptyState({
  variant,
  search,
  onAddPupil,
}: {
  variant: "no-match" | "no-pupils";
  search?: string;
  onAddPupil?: () => void;
}) {
  const isNoMatch = variant === "no-match";
  const truncated = search && search.length > 30 ? `${search.slice(0, 30)}…` : search;
  return (
    <div
      style={{
        padding: "32px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: isNoMatch ? "#F2F2F4" : "#E8F3E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isNoMatch ? (
          <SearchIcon size={24} strokeWidth={2} color={MUTED} />
        ) : (
          <Users size={24} strokeWidth={2} color="#3B8B3B" />
        )}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: TEXT, margin: 0 }}>
        {isNoMatch ? `No pupils match “${truncated}”` : "No pupils yet"}
      </h3>
      <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
        {isNoMatch
          ? "Try a different search term"
          : "Add your first pupil to get started"}
      </p>
      {!isNoMatch && onAddPupil && (
        <button
          type="button"
          onClick={onAddPupil}
          style={{
            background: BLUE,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Add pupil
        </button>
      )}
    </div>
  );
}

function PickerBody({
  pupils,
  recentSource,
  search,
  onPick,
  onAddPupil,
}: {
  pupils: PickerPupil[];
  recentSource?: PickerRecentItem[];
  search: string;
  onPick: (p: PickerPupil) => void;
  onAddPupil?: () => void;
}) {
  const q = search.trim().toLowerCase();

  const recentMap = new Map<string, string>();
  if (recentSource && recentSource.length) {
    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    for (const c of recentSource) {
      if (!c.pupil_id || !c.last_message_at) continue;
      const t = new Date(c.last_message_at).getTime();
      if (Number.isFinite(t) && t >= cutoff) {
        const prev = recentMap.get(c.pupil_id);
        if (!prev || new Date(prev).getTime() < t) {
          recentMap.set(c.pupil_id, c.last_message_at);
        }
      }
    }
  }

  const matchesQuery = (p: PickerPupil) => {
    if (!q) return true;
    const name = (p.name || "").toLowerCase();
    const phoneDigits = (p.phone || "").replace(/\D/g, "");
    const searchDigits = q.replace(/\D/g, "");
    return (
      name.includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (!!searchDigits && phoneDigits.includes(searchDigits))
    );
  };

  const recentSorted = pupils
    .filter((p) => recentMap.has(p.id))
    .sort(
      (a, b) =>
        new Date(recentMap.get(b.id)!).getTime() -
        new Date(recentMap.get(a.id)!).getTime(),
    )
    .slice(0, RECENT_MAX);
  const recentVisible = recentSorted.filter(matchesQuery);
  const recentIds = new Set(recentSorted.map((p) => p.id));

  const allVisible = pupils.filter((p) => !recentIds.has(p.id) && matchesQuery(p));

  if (pupils.length === 0) {
    return <PickerEmptyState variant="no-pupils" onAddPupil={onAddPupil} />;
  }
  if (recentVisible.length === 0 && allVisible.length === 0) {
    return <PickerEmptyState variant="no-match" search={search} />;
  }

  const renderRow = (p: PickerPupil, withTimestamp: boolean) => {
    const issues = detectDataQualityIssues(p, pupils);
    const flagged = issues.length > 0;
    let issueLabel: string | null = null;
    if (flagged) {
      if (issues.includes("duplicate-phone")) {
        const dupName = findPhoneDuplicateName(p, pupils);
        issueLabel = dupName
          ? `duplicate of ${titleCaseName(dupName)}`
          : "duplicate phone";
      } else if (issues.includes("invalid-phone")) {
        issueLabel = "invalid format";
      } else if (issues.includes("invalid-name")) {
        issueLabel = "name needs review";
      }
    }
    const ts = withTimestamp ? compactRelative(recentMap.get(p.id)!) : undefined;
    return (
      <PupilPickerRow
        key={p.id}
        pupil={p}
        timestamp={ts}
        flagged={flagged}
        issueLabel={issueLabel}
        onPick={() => onPick(p)}
      />
    );
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {recentVisible.length > 0 && (
        <div style={{ padding: "0 16px 4px" }}>
          <EyebrowLabel>Recent · {recentVisible.length}</EyebrowLabel>
          <div style={{ padding: "0 8px", display: "flex", flexDirection: "column" }}>
            {recentVisible.map((p) => renderRow(p, true))}
          </div>
        </div>
      )}

      {recentVisible.length > 0 && allVisible.length > 0 && (
        <div style={{ height: 4, background: "#F2F2F4", margin: "8px 0" }} />
      )}

      {allVisible.length > 0 && (
        <div style={{ padding: "4px 16px" }}>
          <EyebrowLabel>All pupils · {allVisible.length}</EyebrowLabel>
          <div style={{ padding: "0 8px", display: "flex", flexDirection: "column" }}>
            {allVisible.map((p) => renderRow(p, false))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PupilPickerSheet({
  open,
  onOpenChange,
  pupils,
  loading,
  recentSource,
  onPick,
  onAddPupil,
  title = "Select pupil",
  searchPlaceholder = "Search pupils",
}: PupilPickerSheetProps) {
  const [search, setSearch] = useState("");

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md p-0 gap-0 overflow-hidden"
        style={{ background: "#FFFFFF", borderRadius: 16, border: "none", fontFamily: FONT_STACK }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: HAIRLINE,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h2
            style={{
              flex: 1,
              margin: 0,
              fontSize: 15,
              fontWeight: 500,
              color: TEXT,
              letterSpacing: "-0.2px",
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => handleOpenChange(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F2F2F4",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={16} strokeWidth={1.8} color={MUTED} />
          </button>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div style={{ position: "relative" }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
              ariaLabel={searchPlaceholder}
            />
            <button
              type="button"
              aria-label="Voice search"
              onClick={() => {
                const SR =
                  (window as any).SpeechRecognition ||
                  (window as any).webkitSpeechRecognition;
                if (!SR) {
                  toast.error("Voice search isn't available in this browser");
                  return;
                }
                const r = new SR();
                r.lang = "en-GB";
                r.interimResults = false;
                r.maxAlternatives = 1;
                r.onresult = (e: any) => setSearch(e.results[0][0].transcript);
                r.onerror = () => toast.error("Couldn't capture voice input");
                try {
                  r.start();
                } catch {
                  /* noop */
                }
              }}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                padding: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={14} strokeWidth={1.5} color={MUTED} />
            </button>
          </div>
        </div>

        <ScrollArea style={{ height: 380 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 0",
              }}
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <PickerBody
              pupils={pupils}
              recentSource={recentSource}
              search={search}
              onPick={(p) => {
                onPick(p);
                handleOpenChange(false);
              }}
              onAddPupil={onAddPupil}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
