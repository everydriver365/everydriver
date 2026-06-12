import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { UserSearch, RefreshCw, CalendarSearch, CreditCard } from "lucide-react";

export default function About() {
  return (
    <MainLayout>
      <SEOHead
        title="About EveryDriver | UK Driving School Network"
        description="EveryDriver connects UK learners with DVSA-approved driving instructors offering intensive courses, weekly lessons and flexible 0% finance."
      />
      <div className="w-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/* Header */}
        <div className="text-center px-4 pt-10 pb-6">
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 700,
              color: "#0F2044",
              lineHeight: 1.2,
              marginBottom: "8px",
            }}
          >
            About{" "}
            <span style={{ fontStyle: "italic", color: "#D12E2E" }}>
              EveryDriver
            </span>
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: 1.5,
            }}
          >
            Helping learners across the UK achieve driving success since 2015
          </p>
        </div>

        {/* Intro text */}
        <div
          className="mx-auto px-4 pb-10"
          style={{
            maxWidth: "900px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#555",
              lineHeight: 1.85,
              marginBottom: "1rem",
            }}
          >
            EveryDriver was founded with a simple mission: to make learning to drive accessible,
            affordable, and enjoyable for everyone. We connect learners with experienced,
            professional driving instructors who are passionate about road safety and helping
            students pass their test first time.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#555",
              lineHeight: 1.85,
            }}
          >
            Our network of DVSA-approved instructors covers every corner of the UK, offering
            flexible lesson times, competitive rates, and personalised teaching approaches
            tailored to each learner&apos;s needs.
          </p>
        </div>

        {/* Feature grid */}
        <div
          className="mx-auto px-4 pb-10"
          style={{
            maxWidth: "900px",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "14px",
          }}
        >
          <style>{`
            @media (max-width: 680px) {
              .about-feature-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
          <div className="about-feature-grid" style={{ display: "contents" }}>
            {/* Card 1 */}
            <div
              className="about-feature-card"
              style={{
                background: "#fff",
                borderRadius: "14px",
                border: "1.5px solid #e8edf2",
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0070C0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8edf2")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  borderRadius: "10px",
                  background: "#E6F1FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserSearch size={22} color="#0070C0" strokeWidth={2} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0F2044",
                    marginBottom: "4px",
                  }}
                >
                  Choose Your Instructor
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.6,
                  }}
                >
                  Browse instructor profiles, reviews, and pass rates — see who&apos;s teaching you before you book.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="about-feature-card"
              style={{
                background: "#fff",
                borderRadius: "14px",
                border: "1.5px solid #e8edf2",
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0070C0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8edf2")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  borderRadius: "10px",
                  background: "#FCEBEB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCw size={22} color="#D12E2E" strokeWidth={2} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0F2044",
                    marginBottom: "4px",
                  }}
                >
                  Free Re-Test Guarantee
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.6,
                  }}
                >
                  If you don&apos;t pass first time, we&apos;ll cover the cost of your next practical test.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className="about-feature-card"
              style={{
                background: "#fff",
                borderRadius: "14px",
                border: "1.5px solid #e8edf2",
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0070C0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8edf2")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  borderRadius: "10px",
                  background: "#EAF3DE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarSearch size={22} color="#3B6D11" strokeWidth={2} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0F2044",
                    marginBottom: "4px",
                  }}
                >
                  Free Test Date Swap
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.6,
                  }}
                >
                  We monitor DVSA test centres and find you an earlier test date — at no extra cost.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div
              className="about-feature-card"
              style={{
                background: "#fff",
                borderRadius: "14px",
                border: "1.5px solid #e8edf2",
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0070C0")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8edf2")}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  minWidth: "44px",
                  borderRadius: "10px",
                  background: "#FAEEDA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={22} color="#854F0B" strokeWidth={2} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0F2044",
                    marginBottom: "4px",
                  }}
                >
                  Flexible Payments
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    lineHeight: 1.6,
                  }}
                >
                  Spread the cost with Klarna or Clearpay — no need to pay for your whole course upfront.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mission section */}
        <div
          className="mx-auto px-4 pb-16"
          style={{ maxWidth: "900px" }}
        >
          <div
          style={{
            background: "#0F2044",
            borderRadius: "14px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#7da6e0",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: "10px",
            }}
          >
            Our mission
          </p>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "10px",
            }}
          >
            Empowering every learner
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            To empower every learner with the skills, confidence, and knowledge they need to become safe, responsible drivers for life.
          </p>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
