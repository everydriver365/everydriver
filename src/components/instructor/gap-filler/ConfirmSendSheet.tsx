import { ReactNode } from "react";
import { BottomSheet } from "@/components/instructor/ui/BottomSheet";
import {
  MessageTemplateEditor,
  renderTemplate,
} from "./MessageTemplateEditor";
import { SendResultSheet, SendResultStatus } from "./SendResultSheet";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export interface ConfirmSendSheetSlot {
  /** Pre-formatted chip label, e.g. "Mon 27 Apr 10:00–12:00" */
  chipLabel: string;
  /** Pre-formatted line for {slot_list} substitution, e.g. "Mon 27 Apr 10:00-12:00" */
  templateLine: string;
}

export interface ConfirmSendSheetProps {
  open: boolean;
  onClose: () => void;
  slots: ConfirmSendSheetSlot[];
  recipientCount: number;
  /** Used in preview & analytics. */
  sampleRecipientName: string;
  instructorFirstName: string;
  template: string;
  onTemplateChange: (next: string) => void;
  /** Status of the send. "idle" means the confirm body is shown. */
  status: "idle" | SendResultStatus;
  /** While loading: how many sent so far. */
  sentCount: number;
  /** Failures for partial / error states. */
  failures?: { name: string; reason?: string | null }[];
  /** Error message for the error state. */
  errorMessage?: string;
  /** Triggered by the "Send now" button (idle state). */
  onSendNow: () => void;
  /** Triggered by Done / Try again on the result screens. */
  onPrimaryResult: () => void;
  /** Triggered by Retry failed / Cancel on partial / error states. */
  onSecondaryResult?: () => void;
  /** Optional cost summary line, e.g. "1 SMS per recipient · 34 messages total". */
  costSummary?: ReactNode;
}

export function ConfirmSendSheet({
  open,
  onClose,
  slots,
  recipientCount,
  sampleRecipientName,
  instructorFirstName,
  template,
  onTemplateChange,
  status,
  sentCount,
  failures,
  errorMessage,
  onSendNow,
  onPrimaryResult,
  onSecondaryResult,
  costSummary,
}: ConfirmSendSheetProps) {
  const isResult = status !== "idle";
  const dismissable = status !== "loading";

  // Sample slot list for preview substitution
  const slotList = slots.map((s) => s.templateLine).join("\n");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      dismissable={dismissable}
      showClose={dismissable}
      eyebrow={!isResult ? "Confirm send" : undefined}
      title={
        !isResult
          ? `Send to ${recipientCount} pupil${recipientCount === 1 ? "" : "s"}?`
          : undefined
      }
      subtitle={
        !isResult
          ? `About ${slots.length} available slot${slots.length === 1 ? "" : "s"}`
          : undefined
      }
      footer={
        !isResult ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: "#FFFFFF",
                border: "0.5px solid #E5E5EA",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                fontWeight: 500,
                color: "#000000",
                cursor: "pointer",
                fontFamily: FONT_STACK,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSendNow}
              disabled={recipientCount === 0 || slots.length === 0}
              style={{
                flex: 1,
                background: "#2B7BC8",
                border: "none",
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                fontWeight: 500,
                color: "#FFFFFF",
                cursor:
                  recipientCount === 0 || slots.length === 0
                    ? "not-allowed"
                    : "pointer",
                opacity: recipientCount === 0 || slots.length === 0 ? 0.4 : 1,
                fontFamily: FONT_STACK,
              }}
            >
              Send now
            </button>
          </div>
        ) : undefined
      }
    >
      {!isResult && (
        <div style={{ fontFamily: FONT_STACK }}>
          {/* Slots being offered */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: 0.3,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Slots being offered
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {slots.map((s, i) => (
                <span
                  key={i}
                  style={{
                    background: "#F2F2F4",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#000000",
                  }}
                >
                  {s.chipLabel}
                </span>
              ))}
            </div>
          </div>

          {/* Message preview / editor */}
          <MessageTemplateEditor
            template={template}
            onChange={onTemplateChange}
            sampleName={sampleRecipientName}
            sampleSlotList={slotList}
            instructorFirstName={instructorFirstName}
          />

          {costSummary && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#6E6E73",
              }}
            >
              {costSummary}
            </div>
          )}
        </div>
      )}

      {isResult && (
        <SendResultSheet
          status={status as SendResultStatus}
          sentCount={sentCount}
          totalCount={recipientCount}
          failures={failures}
          errorMessage={errorMessage}
          onPrimary={onPrimaryResult}
          onSecondary={onSecondaryResult}
        />
      )}
    </BottomSheet>
  );
}

/** Helper exposed so callers can preview a render outside the sheet. */
export { renderTemplate };
