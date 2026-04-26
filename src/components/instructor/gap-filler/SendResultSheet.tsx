import { Check, AlertTriangle, AlertCircle } from "lucide-react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export type SendResultStatus = "loading" | "success" | "partial" | "error";

export interface SendResultSheetProps {
  status: SendResultStatus;
  /** Number sent so far (loading) or total successful (other states). */
  sentCount: number;
  /** Total recipients. */
  totalCount: number;
  /** When status === "partial" or "error" — list of failures. */
  failures?: { name: string; reason?: string | null }[];
  /** When status === "error" — the user-facing error reason. */
  errorMessage?: string;
  /** Done / Try again primary action. */
  onPrimary: () => void;
  /** Retry failed (partial) or Cancel (error). Optional. */
  onSecondary?: () => void;
}

/**
 * Body content for the send-result states. Rendered inside the
 * confirmation BottomSheet (replaces its body + footer).
 *
 * The parent owns the BottomSheet + dismiss logic; this component
 * just renders the centred state UI and delegates actions.
 */
export function SendResultSheet({
  status,
  sentCount,
  totalCount,
  failures = [],
  errorMessage,
  onPrimary,
  onSecondary,
}: SendResultSheetProps) {
  if (status === "loading") {
    return (
      <div
        style={{
          fontFamily: FONT_STACK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 16px 16px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid #E5E5EA",
            borderTopColor: "#2B7BC8",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            marginTop: 12,
            fontSize: 15,
            fontWeight: 500,
            color: "#000000",
          }}
        >
          Sending messages...
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#6E6E73" }}>
          {sentCount} of {totalCount} sent
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <ResultBody
        iconBg="#E8F3E8"
        iconColor="#3B8B3B"
        Icon={Check}
        title="Messages sent"
        subtitle={`Sent to ${totalCount} pupil${totalCount === 1 ? "" : "s"}`}
        helper="You'll see notifications as pupils respond"
        primary={{ label: "Done", onPress: onPrimary }}
      />
    );
  }

  if (status === "partial") {
    const failedCount = failures.length;
    return (
      <ResultBody
        iconBg="#FBF1DE"
        iconColor="#B8801F"
        Icon={AlertTriangle}
        title={`${sentCount} sent · ${failedCount} failed`}
        subtitle="Some messages couldn't be delivered"
        helper={null}
        primary={{ label: "Retry failed", onPress: onSecondary || onPrimary }}
        secondary={{ label: "Done", onPress: onPrimary }}
        failures={failures}
      />
    );
  }

  // error
  return (
    <ResultBody
      iconBg="#FBEAEC"
      iconColor="#C8434F"
      Icon={AlertCircle}
      title="Couldn't send messages"
      subtitle={errorMessage || "Network error — try again"}
      helper={null}
      primary={{ label: "Try again", onPress: onPrimary }}
      secondary={onSecondary ? { label: "Cancel", onPress: onSecondary } : undefined}
    />
  );
}

/* ----------------------- shared result body ----------------------- */

interface ResultBodyProps {
  iconBg: string;
  iconColor: string;
  Icon: typeof Check;
  title: string;
  subtitle: string;
  helper: string | null;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  failures?: { name: string; reason?: string | null }[];
}

function ResultBody({
  iconBg,
  iconColor,
  Icon,
  title,
  subtitle,
  helper,
  primary,
  secondary,
  failures,
}: ResultBodyProps) {
  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 8px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: iconBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} strokeWidth={2} color={iconColor} />
      </span>

      <div
        style={{
          marginTop: 12,
          fontSize: 17,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: -0.3,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: "#6E6E73" }}>
        {subtitle}
      </div>
      {helper && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#6E6E73" }}>
          {helper}
        </div>
      )}

      {failures && failures.length > 0 && (
        <div
          style={{
            marginTop: 16,
            width: "100%",
            background: "#F2F2F4",
            borderRadius: 10,
            padding: 12,
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6E6E73",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Failed recipients
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {failures.map((f, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "#000000",
                  lineHeight: 1.4,
                  padding: "2px 0",
                }}
              >
                {f.name}
                {f.reason ? (
                  <span style={{ color: "#6E6E73" }}> · {f.reason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          width: "100%",
          display: "flex",
          gap: 8,
        }}
      >
        {secondary && (
          <button
            type="button"
            onClick={secondary.onPress}
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
            {secondary.label}
          </button>
        )}
        <button
          type="button"
          onClick={primary.onPress}
          style={{
            flex: 1,
            background: "#2B7BC8",
            border: "none",
            borderRadius: 10,
            padding: 12,
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          {primary.label}
        </button>
      </div>
    </div>
  );
}
