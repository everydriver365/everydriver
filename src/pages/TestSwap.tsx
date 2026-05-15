import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Check,
  Clock,
  CalendarCheck,
  Star,
  Shield,
  Phone,
  ChevronRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const FIND_HREF = "/test-swap/register";
const BROWSE_HREF = "/test-swap/browse";

const STATS = [
  { num: "2,400+", label: "Swaps completed" },
  { num: "4.2 wks", label: "Avg time saved" },
  { num: "£0", label: "Cost to use" },
  { num: "98%", label: "Success rate" },
];

const FEATURES = [
  {
    icon: Clock,
    iconBg: "#E6F1FB",
    iconColor: "#1A52A0",
    title: "Get an earlier date",
    body:
      "Skip the DVSA waiting list. Find a learner who already has the slot you want and swap directly with them.",
  },
  {
    icon: CalendarCheck,
    iconBg: "#E1F5EE",
    iconColor: "#1D9E75",
    title: "Keep your booking",
    body:
      "Your booking reference, payment and special requirements all stay the same. Only the date, time and centre changes.",
  },
  {
    icon: Star,
    iconBg: "#FFF6E6",
    iconColor: "#B45309",
    title: "100% free",
    body:
      "No fees, no catches. Drive365 Swap is a free service for learner drivers — we take nothing from you.",
  },
  {
    icon: Shield,
    iconBg: "#F0EEFF",
    iconColor: "#6B21A8",
    title: "Safe & private",
    body:
      "Your booking reference is never shared. Other learners only see your test centre, date and time — nothing personal.",
  },
];

const HOW_STEPS: { title: string; body: string; tag: string | null }[] = [
  {
    title: "Tell us your current test date and preferred dates",
    body:
      "Add your current test details and what dates would work better for you. This takes about 60 seconds.",
    tag: null,
  },
  {
    title: "We match you with a compatible learner",
    body:
      "Drive365 finds another learner who wants your slot and has one you want. We notify both of you when a match is ready.",
    tag: "We do this for you",
  },
  {
    title: "Agree the swap, then call DVSA together",
    body:
      "Once you both agree, one learner calls DVSA on 0300 200 1122 (option 1). DVSA verifies both learners and completes the swap on the call.",
    tag: null,
  },
  {
    title: "We guide you step-by-step with our DVSA swap checklist",
    body:
      "Drive365 gives you a full interactive checklist so nothing gets missed — from checking your contact details to making the call.",
    tag: "Included free",
  },
];

const TestSwapHero = () => (
  <section
    style={{
      background: "#0F2044",
      padding: "64px 40px 56px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "#1A52A0",
        opacity: 0.08,
        top: -200,
        right: -150,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "#1D9E75",
        opacity: 0.06,
        bottom: -180,
        left: "-10%",
        pointerEvents: "none",
      }}
    />

    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 20,
        padding: "6px 14px",
        fontSize: 12,
        color: "rgba(255,255,255,0.65)",
        marginBottom: 22,
        letterSpacing: "0.02em",
        position: "relative",
        zIndex: 1,
      }}
    >
      <ArrowLeftRight size={11} />
      Free test swap service
    </div>

    <h1
      style={{
        fontSize: 42,
        fontWeight: 700,
        color: "#FFF",
        lineHeight: 1.18,
        letterSpacing: -1,
        marginBottom: 16,
        position: "relative",
        zIndex: 1,
        whiteSpace: "pre-line",
      }}
    >
      {"Swap your driving test,\n"}
      <span style={{ color: "#5DCAA5" }}>don't wait months</span>
      {"\nfor a new one"}
    </h1>

    <p
      style={{
        fontSize: 16,
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.7,
        maxWidth: 480,
        margin: "0 auto 32px",
        position: "relative",
        zIndex: 1,
      }}
    >
      DVSA waiting lists are long. Our free Test Swap service matches you with
      another learner who has a date that works for you — and you give them
      yours in return.
    </p>

    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        flexWrap: "wrap",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Link to={FIND_HREF}>
        <button
          style={{
            background: "#1D9E75",
            border: "none",
            borderRadius: 8,
            padding: "13px 24px",
            fontSize: 14,
            fontWeight: 600,
            color: "#FFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <ArrowLeftRight size={13} />
          Find a swap match
        </button>
      </Link>
      <Link to={BROWSE_HREF}>
        <button
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 8,
            padding: "13px 22px",
            fontSize: 14,
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
          }}
        >
          Browse available swaps
        </button>
      </Link>
      <button
        onClick={() =>
          document
            .getElementById("how-it-works")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        style={{
          background: "transparent",
          border: "none",
          padding: "13px 16px",
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
        }}
      >
        How it works ↓
      </button>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginTop: 28,
        flexWrap: "wrap",
        position: "relative",
        zIndex: 1,
      }}
    >
      {[
        "100% free",
        "DVSA approved process",
        "Your booking ref never changes",
        "No extra payments",
      ].map((label) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          <Check size={11} strokeWidth={2.2} />
          {label}
        </div>
      ))}
    </div>
  </section>
);

const TestSwapStatsStrip = () => (
  <div
    style={{
      background: "#1A52A0",
      padding: "22px 40px",
      display: "flex",
      justifyContent: "center",
    }}
  >
    {STATS.map((stat, i) => (
      <div
        key={stat.label}
        style={{
          flex: 1,
          textAlign: "center",
          padding: "0 16px",
          borderRight:
            i < STATS.length - 1
              ? "0.5px solid rgba(255,255,255,0.12)"
              : "none",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#FFF",
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {stat.num}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            marginTop: 3,
          }}
        >
          {stat.label}
        </div>
      </div>
    ))}
  </div>
);

const TestSwapFeatures = () => (
  <section style={{ padding: "48px 40px", background: "#F0F2F5" }}>
    <h2
      style={{
        fontSize: 26,
        fontWeight: 700,
        color: "#0F2044",
        letterSpacing: -0.5,
        marginBottom: 6,
      }}
    >
      Why use Drive365 Swap?
    </h2>
    <p
      style={{
        fontSize: 14,
        color: "#5F6B7A",
        lineHeight: 1.6,
        maxWidth: 440,
        marginBottom: 28,
      }}
    >
      Everything you need to find an earlier — or more convenient — test date
      without starting over.
    </p>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
      }}
    >
      {FEATURES.map((feat) => {
        const Icon = feat.icon;
        return (
          <div
            key={feat.title}
            style={{
              background: "#FFF",
              borderRadius: 14,
              padding: 20,
              border: "0.5px solid #E0E4EB",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: feat.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Icon size={18} color={feat.iconColor} strokeWidth={1.7} />
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0F2044",
                marginBottom: 5,
              }}
            >
              {feat.title}
            </div>
            <div style={{ fontSize: 12, color: "#5F6B7A", lineHeight: 1.6 }}>
              {feat.body}
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

const TestSwapHowItWorks = () => (
  <section
    id="how-it-works"
    style={{ padding: "0 40px 48px", background: "#F0F2F5" }}
  >
    <h2
      style={{
        fontSize: 26,
        fontWeight: 700,
        color: "#0F2044",
        letterSpacing: -0.5,
        marginBottom: 6,
      }}
    >
      How a test swap works
    </h2>
    <p
      style={{
        fontSize: 14,
        color: "#5F6B7A",
        lineHeight: 1.6,
        marginBottom: 20,
      }}
    >
      Four steps. The whole process takes less than 30 minutes once you've
      found a match.
    </p>
    <div
      style={{
        background: "#FFF",
        borderRadius: 16,
        border: "0.5px solid #E0E4EB",
        overflow: "hidden",
      }}
    >
      {HOW_STEPS.map((step, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "18px 20px",
            borderBottom:
              i < HOW_STEPS.length - 1 ? "0.5px solid #F0F2F5" : "none",
            position: "relative",
          }}
        >
          {i < HOW_STEPS.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: 31,
                top: 44,
                width: 1,
                height: "calc(100% - 26px)",
                background: "#E0E4EB",
              }}
            />
          )}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#0F2044",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#FFF",
              flexShrink: 0,
              marginTop: 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0F2044",
                marginBottom: 3,
              }}
            >
              {step.title}
            </div>
            <div style={{ fontSize: 12, color: "#5F6B7A", lineHeight: 1.6 }}>
              {step.body}
            </div>
            {step.tag && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "#E1F5EE",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#085041",
                  marginTop: 6,
                }}
              >
                <Check size={9} color="#085041" strokeWidth={2} />
                {step.tag}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const TestSwapVisualDemo = () => {
  const learners = [
    {
      initials: "BF",
      color: "#1A52A0",
      name: "Berty F.",
      was: "Tue 24 Jun · 09:14",
      gets: "Mon 16 Jun · 10:32",
    },
    {
      initials: "JW",
      color: "#1D9E75",
      name: "J. Webb",
      was: "Mon 16 Jun · 10:32",
      gets: "Tue 24 Jun · 09:14",
    },
  ];

  return (
    <section style={{ padding: "0 40px 48px", background: "#F0F2F5" }}>
      <div
        style={{
          background: "#0F2044",
          borderRadius: 18,
          padding: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "#1A52A0",
            opacity: 0.15,
            top: -100,
            right: -80,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 16,
            position: "relative",
            zIndex: 1,
          }}
        >
          Example swap
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "relative",
            zIndex: 1,
          }}
        >
          {learners.map((learner, i) => (
            <React.Fragment key={learner.initials}>
              {i === 1 && (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#1A52A0",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ArrowLeftRight size={15} color="#FFF" strokeWidth={1.8} />
                </div>
              )}
              <div
                style={{
                  background: "rgba(29,158,117,0.15)",
                  border: "0.5px solid rgba(29,158,117,0.3)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: learner.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#FFF",
                    flexShrink: 0,
                  }}
                >
                  {learner.initials}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#FFF",
                      marginBottom: 1,
                    }}
                  >
                    {learner.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.35)",
                      textDecoration: "line-through",
                    }}
                  >
                    {learner.was}
                  </div>
                  <div style={{ fontSize: 10, color: "#5DCAA5" }}>
                    ↳ Gets: {learner.gets}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 14,
            position: "relative",
            zIndex: 1,
          }}
        >
          {["Both agree", "Check DVSA details", "Call DVSA", "Swap confirmed"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: 8,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 2,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.3,
                  }}
                >
                  {label}
                </div>
              </div>
            ),
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            marginTop: 14,
            position: "relative",
            zIndex: 1,
          }}
        >
          <Phone size={14} color="rgba(255,255,255,0.4)" strokeWidth={1.7} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                marginBottom: 1,
              }}
            >
              DVSA helpline · Both booking refs and payment details stay
              unchanged
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#FFF" }}>
              0300 200 1122 &nbsp;·&nbsp; Option 1
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestSwapBottomCTA = () => (
  <section
    style={{
      background: "#1D9E75",
      padding: "48px 40px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        top: -150,
        right: -80,
        pointerEvents: "none",
      }}
    />
    <div style={{ position: "relative", zIndex: 1 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <ArrowLeftRight size={20} color="#FFF" strokeWidth={1.8} />
      </div>
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "#FFF",
          letterSpacing: -0.5,
          marginBottom: 10,
        }}
      >
        Ready to find your swap?
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.6,
          maxWidth: 460,
          margin: "0 auto 28px",
        }}
      >
        Search for an instructor and let us know you're open to a test swap when
        you book. Or jump in and browse available swaps right now.
      </p>
      <Link to={FIND_HREF}>
        <button
          style={{
            background: "#FFF",
            border: "none",
            borderRadius: 8,
            padding: "13px 26px",
            fontSize: 14,
            fontWeight: 600,
            color: "#1D9E75",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          Find a swap match
          <ChevronRight size={13} color="#1D9E75" strokeWidth={2.2} />
        </button>
      </Link>
    </div>
  </section>
);

export default function TestSwap() {
  const [savedId, setSavedId] = useState<string | null>(null);
  useEffect(() => {
    try {
      setSavedId(localStorage.getItem("test_swap_signup_id"));
    } catch {}
  }, []);

  return (
    <MainLayout>
      <SEOHead
        title="Need an Earlier Driving Test? Swap, Don't Wait | Drive365"
        description="Free, secure driving test swap service. Match with another learner and get an earlier DVSA practical test date — no fees, no waiting lists."
      />

      {savedId && (
        <section className="pt-6 sm:pt-8">
          <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border bg-primary/5 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <div className="font-semibold">Welcome back</div>
                <div className="text-muted-foreground">
                  You've already registered for a test swap. Pick up where you
                  left off.
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/test-swap/matches/${savedId}`}>
                  <Button size="sm">View my matches</Button>
                </Link>
                <Link to={`/test-swap/edit/${savedId}`}>
                  <Button size="sm" variant="outline">
                    Edit my details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <main style={{ maxWidth: 900, margin: "0 auto" }}>
        <TestSwapHero />
        <TestSwapStatsStrip />
        <TestSwapFeatures />
        <TestSwapHowItWorks />
        <TestSwapVisualDemo />
        <TestSwapBottomCTA />
      </main>
    </MainLayout>
  );
}
