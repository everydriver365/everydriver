import { useState } from "react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export interface MessageTemplateEditorProps {
  template: string;
  onChange: (next: string) => void;
  /** Sample recipient name used in preview. */
  sampleName: string;
  /** Sample slot list used in preview (already formatted). */
  sampleSlotList: string;
  /** Instructor first name used for the {instructor_first_name} token. */
  instructorFirstName: string;
}

export const TEMPLATE_TOKENS = ["{first_name}", "{slot_list}", "{instructor_first_name}"] as const;

/**
 * Renders the rendered preview by default. Tapping "Edit" reveals a textarea
 * plus tap-to-insert tokens. Tokens are visible literal strings that get
 * substituted at preview/render time.
 */
export function renderTemplate(
  template: string,
  vars: { firstName: string; slotList: string; instructorFirstName: string }
): string {
  return template
    .split("{first_name}").join(vars.firstName)
    .split("{slot_list}").join(vars.slotList)
    .split("{instructor_first_name}").join(vars.instructorFirstName);
}

export function MessageTemplateEditor({
  template,
  onChange,
  sampleName,
  sampleSlotList,
  instructorFirstName,
}: MessageTemplateEditorProps) {
  const [editing, setEditing] = useState(false);
  const sampleFirstName = (sampleName || "").split(" ")[0] || sampleName;
  const preview = renderTemplate(template, {
    firstName: sampleFirstName || "there",
    slotList: sampleSlotList,
    instructorFirstName,
  });

  const insertToken = (token: string) => {
    onChange(template.endsWith(" ") || template.length === 0 ? template + token : template + " " + token);
  };

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6E6E73",
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          Message preview
        </span>
        <button
          type="button"
          onClick={() => setEditing((s) => !s)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "#2B7BC8",
            fontFamily: FONT_STACK,
          }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {!editing && (
        <div
          style={{
            background: "#F2F2F4",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#6E6E73", marginBottom: 6 }}>
            Preview for {sampleName || "first recipient"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#000000",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {preview}
          </div>
        </div>
      )}

      {editing && (
        <div>
          <textarea
            value={template}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#F2F2F4",
              borderRadius: 10,
              padding: 12,
              fontSize: 13,
              color: "#000000",
              border: "0.5px solid #E5E5EA",
              outline: "none",
              fontFamily: FONT_STACK,
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "#6E6E73", marginRight: 4 }}>
              Insert:
            </span>
            {TEMPLATE_TOKENS.map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => insertToken(tok)}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#2B7BC8",
                  background: "#E6F1FB",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: FONT_STACK,
                }}
              >
                {tok}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
