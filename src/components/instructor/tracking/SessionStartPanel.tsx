import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ShieldCheck, Loader2 } from "lucide-react";
import { PupilQuickInfo } from "./PupilQuickInfo";
import { PupilSelectorRow } from "@/components/instructor/ui/PupilSelectorRow";

interface Pupil {
  id: string;
  name: string;
}

type SessionType = "practice" | "test";

interface SessionStartPanelProps {
  pupils: Pupil[];
  selectedPupilId: string;
  onPupilChange: (pupilId: string) => void;
  onStartSession: (type: SessionType) => void;
  onOpenDrivingTestDialog: () => void;
  isStarting: boolean;
  isConnected: boolean;
  /** True when a session is actively recording — drives the primary button colour. */
  isRecording?: boolean;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export function SessionStartPanel({
  pupils,
  selectedPupilId,
  onPupilChange,
  onStartSession,
  onOpenDrivingTestDialog,
  isStarting,
  isRecording = false,
}: SessionStartPanelProps) {
  // Internal session-type state preserved from the original panel.
  const [sessionType] = useState<SessionType>(selectedPupilId ? "practice" : "test");
  const [showPupilList, setShowPupilList] = useState(false);

  const effectiveSessionType: SessionType = selectedPupilId ? sessionType : "test";
  const selectedPupil = pupils.find((p) => p.id === selectedPupilId);

  const handleStartClick = () => {
    onStartSession(effectiveSessionType);
  };

  const handlePupilSelect = (pupilId: string) => {
    onPupilChange(pupilId);
    setShowPupilList(false);
  };

  // Primary button visual state: blue at rest, navy only when actively recording.
  const primaryActive = isRecording || isStarting;
  const primaryBg = primaryActive ? "#1F2C4A" : "#2B7BC8";

  // Selected-pupil subtitle — surfaces the existing session-type semantics.
  const selectedSubtitle = selectedPupil
    ? effectiveSessionType === "test"
      ? "Test route prep"
      : "Live lesson"
    : null;

  // Helper text — see functional improvement #3.
  const helperText = selectedPupil
    ? `Recording for ${selectedPupil.name}`
    : "Recording without pupil assignment";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: FONT_STACK,
      }}
    >
      {/* Header */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#2B7BC8",
            letterSpacing: 0.3,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Test route
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: -0.3,
            marginBottom: 4,
            lineHeight: 1.25,
          }}
        >
          Begin a lesson or test route
        </div>
        <div style={{ fontSize: 12, color: "#6E6E73", lineHeight: 1.4 }}>
          Select a pupil or record a test route
        </div>
      </div>

      {/* Pupil selector — two-state row */}
      <div style={{ position: "relative" }}>
        <PupilSelectorRow
          pupilId={selectedPupilId || null}
          pupilName={selectedPupil?.name ?? null}
          selectedSubtitle={selectedSubtitle}
          expanded={showPupilList}
          onPress={() => setShowPupilList((prev) => !prev)}
        />

        {/* Picker dropdown — behaviour preserved */}
        <AnimatePresence>
          {showPupilList && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 50,
                background: "#FFFFFF",
                border: "0.5px solid #E5E5EA",
                borderRadius: 12,
                overflow: "hidden",
                maxHeight: 256,
                overflowY: "auto",
              }}
            >
              {/* "No pupil" option */}
              <button
                type="button"
                onClick={() => handlePupilSelect("")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: !selectedPupilId ? "#F2F2F4" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: FONT_STACK,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#F2F2F4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#6E6E73",
                    flexShrink: 0,
                  }}
                >
                  —
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>No pupil</div>
                  <div style={{ fontSize: 11, color: "#6E6E73" }}>Record a test route</div>
                </div>
                {!selectedPupilId && <CheckCircle size={16} strokeWidth={2} color="#2B7BC8" />}
              </button>

              {pupils
                .filter((pupil) => pupil.id && pupil.id.trim() !== "")
                .map((pupil) => {
                  const active = selectedPupilId === pupil.id;
                  return (
                    <button
                      key={pupil.id}
                      type="button"
                      onClick={() => handlePupilSelect(pupil.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        background: active ? "#F2F2F4" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: FONT_STACK,
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#E6F1FB",
                          color: "#2B7BC8",
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {(pupil.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#000000",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pupil.name}
                      </span>
                      {active && <CheckCircle size={16} strokeWidth={2} color="#2B7BC8" />}
                    </button>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pupil quick info — unchanged */}
      <AnimatePresence>
        {selectedPupilId && selectedPupil && (
          <PupilQuickInfo pupilId={selectedPupilId} pupilName={selectedPupil.name} />
        )}
      </AnimatePresence>

      {/* Primary action — Start test route (state-aware colour) */}
      <button
        type="button"
        onClick={handleStartClick}
        disabled={isStarting}
        style={{
          background: primaryBg,
          border: "none",
          borderRadius: 10,
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: isStarting ? "default" : "pointer",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 500,
          fontFamily: FONT_STACK,
          opacity: isStarting ? 0.85 : 1,
          transition: "background 0.2s",
        }}
      >
        {isStarting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          // Stop indicator — solid white square
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              background: "#FFFFFF",
              borderRadius: 1,
            }}
          />
        ) : (
          // Play triangle — filled white
          <span
            aria-hidden
            style={{
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderLeft: "10px solid #FFFFFF",
              marginLeft: 1,
            }}
          />
        )}
        <span>
          {isStarting
            ? "Starting…"
            : isRecording
            ? "Stop recording"
            : effectiveSessionType === "test"
            ? "Start test route"
            : "Start session"}
        </span>
      </button>

      {/* Secondary action — Record official driving test */}
      <button
        type="button"
        onClick={onOpenDrivingTestDialog}
        disabled={isStarting}
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 10,
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: isStarting ? "default" : "pointer",
          color: "#000000",
          fontSize: 14,
          fontWeight: 500,
          fontFamily: FONT_STACK,
          opacity: isStarting ? 0.6 : 1,
        }}
      >
        <ShieldCheck size={16} strokeWidth={2} color="#000000" />
        <span>Record official driving test</span>
      </button>

      {/* Helper text — bound to selection */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#6E6E73",
          textAlign: "center",
          fontFamily: FONT_STACK,
        }}
      >
        {helperText}
      </p>
    </div>
  );
}
