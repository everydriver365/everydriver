import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchoolAuth } from "@/context/SchoolAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, ArrowLeft, Mail, ChevronRight, Check, Users, BarChart3, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { setRememberMe, getRememberMe } from "@/lib/sessionPersistence";
import {
  PortalLoginLayout,
  portalTokens as t,
  portalInputStyle,
  portalLabelStyle,
  portalInputFocus,
  portalInputBlur,
} from "@/components/auth/PortalLoginLayout";
import { DarkMobileAuthForm } from "@/components/auth/DarkMobileAuthForm";
import dsmLogo from "@/assets/dsm-logo.png";
import schoolHero from "@/assets/drive365-hero-test-centre.jpg";

type View = "login" | "forgot";

function SchoolMark({ color = t.white, size = 18 }: { color?: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: size + 14, height: size + 14, background: "#10B981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Building2 size={size} color="#FFF" strokeWidth={2} />
      </div>
      <span style={{ fontSize: size + 2, fontWeight: 700, color, letterSpacing: -0.2 }}>School Manager</span>
    </div>
  );
}

export default function SchoolLogin() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMeState] = useState(getRememberMe());
  const { signIn } = useSchoolAuth();
  const navigate = useNavigate();

  const isForgot = view === "forgot";
  const canSubmit = isForgot ? email.trim().length > 0 : email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      setRememberMe(rememberMe);
      navigate("/school/dashboard");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password?portal=school`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password reset email sent! Check your inbox.");
      setView("login");
    }
  };

  const title = isForgot ? "Reset password" : "Welcome back";
  const subtitle = isForgot
    ? "Enter your email and we'll send you a reset link."
    : "Sign in to manage your driving school.";

  return (
    <>
      <DarkMobileAuthForm
        logoSrc={dsmLogo}
        logoAlt="School Manager"
        title={title}
        subtitle={subtitle}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPw}
        setShowPassword={setShowPw}
        rememberMe={rememberMe}
        setRememberMe={setRememberMeState}
        isForgot={isForgot}
        onForgotToggle={(v) => setView(v ? "forgot" : "login")}
        loading={loading}
        onSubmit={isForgot ? handleForgot : handleSubmit}
      />

      <div className="hidden md:block">
    <PortalLoginLayout
      leftBrand={<SchoolMark color={t.white} size={20} />}
      leftBrandCaption="Multi-instructor management"
      leftTag="School portal"
      leftHeadline={<>Run your<br />school,<br /><span style={{ color: "#10B981" }}>at scale.</span></>}
      leftSub="Instructors, pupils, bookings and finance — manage your entire driving school from one dashboard."
      leftFeatures={[
        { Icon: Users, title: "Instructor management", sub: "Onboard, schedule and pay your team" },
        { Icon: BarChart3, title: "Performance insights", sub: "Live KPIs across every instructor" },
        { Icon: CreditCard, title: "Centralised payments", sub: "Branch-level fees, splits and payouts" },
      ]}
      leftFooter={`© ${new Date().getFullYear()} School Manager · DVSA approved platform`}
      cardBrand={<SchoolMark color={t.navy} size={12} />}
      cardTag="School portal"
      cardTitle={isForgot ? "Reset password" : "Welcome back"}
      cardSubtitle={isForgot
        ? "Enter your email and we'll send you a reset link."
        : "Sign in to manage your driving school."}
      mobileHero={{
        heroSrc: schoolHero,
        logoSrc: dsmLogo,
        logoAlt: "School Manager",
        title: isForgot ? "Reset password" : "Welcome back",
        subtitle: isForgot
          ? "Enter your email and we'll send you a reset link."
          : "Sign in to manage your driving school.",
      }}
    >
      <form onSubmit={isForgot ? handleForgot : handleSubmit} name={isForgot ? "school-forgot" : "school-login"} method="post" action="#">
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={portalLabelStyle}>Email address</label>
          <div style={{ position: "relative" }}>
            <input
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              style={{ ...portalInputStyle, paddingRight: 40 }}
              onFocus={portalInputFocus}
              onBlur={portalInputBlur}
            />
            <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)" }}>
              <Mail size={15} color={t.placeholder} strokeWidth={1.7} />
            </div>
          </div>
        </div>

        {!isForgot && (
          <div style={{ marginBottom: 14 }}>
            <label style={portalLabelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{ ...portalInputStyle, paddingRight: 56 }}
                onFocus={portalInputFocus}
                onBlur={portalInputBlur}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((p) => !p)}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: t.placeholder, fontSize: 11, fontWeight: 600 }}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        )}

        {!isForgot && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20, padding: "12px 14px", background: t.surface, borderRadius: 9 }}>
            <div
              onClick={() => setRememberMeState((v) => !v)}
              style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                backgroundColor: rememberMe ? t.blue : t.white,
                border: `1.5px solid ${rememberMe ? t.blue : t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              {rememberMe && <Check size={11} color={t.white} strokeWidth={3} />}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.navy }}>
              Keep me signed in
              <div style={{ fontSize: 11, fontWeight: 300, color: t.muted, marginTop: 2 }}>
                Stays signed in on this browser until you sign out.
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          style={{
            width: "100%", backgroundColor: t.red, border: "none", borderRadius: 10, padding: 14,
            fontSize: 15, fontWeight: 600, color: t.white, cursor: canSubmit && !loading ? "pointer" : "default",
            fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 16, letterSpacing: "0.01em",
            opacity: canSubmit && !loading ? 1 : 0.45,
            transition: "opacity 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => { if (canSubmit && !loading) (e.currentTarget as HTMLElement).style.background = t.redDark; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = t.red; }}
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> {isForgot ? "Sending…" : "Signing in…"}</>
            : isForgot ? "Send reset link"
            : <>Sign In <ChevronRight size={15} color={t.white} strokeWidth={2.2} /></>}
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {isForgot ? (
            <button type="button" onClick={() => setView("login")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer" }}>
              <ArrowLeft size={13} /> Back to sign in
            </button>
          ) : (
            <button type="button" onClick={() => setView("forgot")}
              style={{ fontSize: 13, fontWeight: 500, color: t.blue, background: "none", border: "none", cursor: "pointer" }}>
              Forgot password?
            </button>
          )}
        </div>
      </form>
    </PortalLoginLayout>
      </div>
    </>
  );
}
