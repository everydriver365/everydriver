import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setRememberMe } from "@/lib/sessionPersistence";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const FONT = `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
const NAVY = "#0F2044";
const RED = "#D12E2E";
const RED_HOVER = "#b52626";
const BLUE = "#0070C0";
const BLUE_HOVER = "#185FA5";
const GREY_BG = "#f4f6f9";
const CARD_BORDER = "#e8edf2";
const INPUT_BG = "#fafbfc";
const TOGGLE_OFF = "#e2e6ed";
const GREY_TEXT = "#888888";
const BUILD_GREY = "#bbbbbb";

export default function UnifiedLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    import("@/lib/appVariant").then((m) => m.rememberAppVariant("pupil"));
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        setRememberMe(rememberMe);
        navigate("/auth/redirect", { replace: true });
      }
    } catch {
      setError("Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess("Check your email for a reset link");
      }
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleForgot = () => {
    setIsForgot((v) => !v);
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  const buildTimestamp = `build ${new Date().toISOString().slice(0, 10)} ${new Date()
    .toTimeString()
    .slice(0, 5)}`;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: GREY_BG,
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 16,
          border: `1.5px solid ${CARD_BORDER}`,
          padding: "2.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <img
            src="/everydriver-logo-full.svg"
            alt="EveryDriver"
            style={{ height: 38, display: "block", margin: "0 auto" }}
          />
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: NAVY,
            textAlign: "center",
            marginBottom: "1.5rem",
            lineHeight: 1.3,
          }}
        >
          {isForgot ? "Reset password" : "Welcome back"}
        </h1>

        {error && (
          <div
            style={{
              background: "#fdeaea",
              color: RED,
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: "1rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: "#e6f7ef",
              color: "#1a7f4e",
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 10,
              marginBottom: "1rem",
              fontWeight: 500,
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={isForgot ? handleForgot : handleLogin}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: NAVY,
              marginBottom: 6,
            }}
          >
            Email address
          </label>
          <div style={{ position: "relative", marginBottom: "1.1rem" }}>
            <Mail
              size={18}
              color={BLUE}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                fontFamily: FONT,
                fontSize: 14,
                background: INPUT_BG,
                border: `1.5px solid ${CARD_BORDER}`,
                borderRadius: 10,
                padding: "12px 14px 12px 40px",
                outline: "none",
                color: NAVY,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BLUE;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = CARD_BORDER;
              }}
            />
          </div>

          {!isForgot && (
            <>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: NAVY,
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative", marginBottom: "1.1rem" }}>
                <Lock
                  size={18}
                  color={BLUE}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    fontFamily: FONT,
                    fontSize: 14,
                    background: INPUT_BG,
                    border: `1.5px solid ${CARD_BORDER}`,
                    borderRadius: 10,
                    padding: "12px 40px",
                    outline: "none",
                    color: NAVY,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = BLUE;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = CARD_BORDER;
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <EyeOff size={18} color={BLUE} />
                  ) : (
                    <Eye size={18} color={BLUE} />
                  )}
                </button>
              </div>
            </>
          )}

          {!isForgot && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.35rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
                onClick={() => setRememberMe((v) => !v)}
              >
                <div
                  role="switch"
                  aria-checked={rememberMe}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: rememberMe ? BLUE : TOGGLE_OFF,
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: rememberMe ? 19 : 3,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: NAVY,
                    fontWeight: 500,
                    userSelect: "none",
                  }}
                >
                  Remember me
                </span>
              </div>

              <button
                type="button"
                onClick={toggleForgot}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: BLUE,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = BLUE_HOVER;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = BLUE;
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: RED,
              color: "#fff",
              borderRadius: 10,
              padding: "13px",
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.background = RED_HOVER;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = RED;
            }}
          >
            {isForgot ? "Send reset link" : "Log in"}
            <ArrowRight size={18} />
          </button>

          {isForgot && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={toggleForgot}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: BLUE,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = BLUE_HOVER;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = BLUE;
                }}
              >
                Back to login
              </button>
            </div>
          )}
        </form>

        {!isForgot && (
          <p
            style={{
              textAlign: "center",
              fontSize: 12.5,
              color: GREY_TEXT,
              marginTop: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            New to EveryDriver?{" "}
            <a
              href="mailto:support@everydriver.co.uk"
              style={{
                color: BLUE,
                fontWeight: 700,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = BLUE_HOVER;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = BLUE;
              }}
            >
              Contact your administrator
            </a>
          </p>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: BUILD_GREY,
            marginTop: "1.25rem",
          }}
        >
          {buildTimestamp}
        </p>
      </div>
    </div>
  );
}
