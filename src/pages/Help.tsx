import { SEOHead } from "@/components/SEOHead";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  MessageCircle,
  Rocket,
  Video,
  FileText,
  Headphones,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

const helpTopics = [
  {
    title: "Getting Started",
    description: "Learn how to book your first lesson and what to expect.",
    icon: Rocket,
    link: "/faqs",
    chipBg: "#E6F1FB",
    chipColor: "#0070C0",
  },
  {
    title: "Video Tutorials",
    description: "Watch helpful guides on driving techniques.",
    icon: Video,
    link: "#",
    chipBg: "#FAEEDA",
    chipColor: "#854F0B",
  },
  {
    title: "Theory Help",
    description: "Resources for passing your theory test.",
    icon: FileText,
    link: "/theory",
    chipBg: "#EAF3DE",
    chipColor: "#3B6D11",
  },
  {
    title: "Contact Support",
    description: "Speak with our friendly support team.",
    icon: MessageCircle,
    link: "/contact",
    chipBg: "#FCEBEB",
    chipColor: "#D12E2E",
  },
];

export default function Help() {
  const openLiveChat = () => {
    window.dispatchEvent(new CustomEvent("open-live-chat"));
  };

  return (
    <MainLayout>
      <SEOHead
        title="Help & Support | EveryDriver"
        description="Get help with your EveryDriver account, bookings, payments and lessons. Contact our support team."
      />
      <div
        style={{ fontFamily: "'Poppins', sans-serif", background: "#fff" }}
        className="py-10 pb-24"
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.25rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: "#E6F1FB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.9rem",
              }}
            >
              <MessageCircle size={26} color="#0070C0" strokeWidth={2} />
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#0F2044",
                marginBottom: 6,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Help Centre
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              We're here to help you on your journey to becoming a confident driver
            </p>
          </div>

          {/* Live Chat Banner */}
          <button
            onClick={openLiveChat}
            style={{
              width: "100%",
              background: "#fff",
              borderRadius: 14,
              border: "1.5px solid #e8edf2",
              padding: "1.1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              marginBottom: "1.1rem",
              textAlign: "left",
              transition: "border-color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#0070C0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#e8edf2")
            }
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "#EAF3DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Headphones size={20} color="#3B6D11" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0F2044",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Live Chat
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#3B6D11",
                    background: "#EAF3DE",
                    padding: "2px 8px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Online now
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#666",
                  lineHeight: 1.5,
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Chat with our support team in real-time — we're here to help!
              </p>
            </div>
          </button>

          {/* Help Topic Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 14,
            }}
            className="max-[600px]:!grid-cols-1"
          >
            {helpTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={topic.title}
                  to={topic.link}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1.5px solid #e8edf2",
                    padding: "1.25rem",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#0070C0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#e8edf2")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: topic.chipBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color={topic.chipColor} strokeWidth={2} />
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#0F2044",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {topic.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#666",
                      lineHeight: 1.6,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {topic.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              marginTop: "1.5rem",
              background: "#0F2044",
              borderRadius: 14,
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#7da6e0",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 10,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Still need help?
            </p>
            <h2
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              We're just a message away
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 18,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Our support team is available Monday to Friday, 9am – 6pm.
            </p>
            <Link
              to="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#D12E2E",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                padding: "11px 24px",
                borderRadius: 8,
                textDecoration: "none",
                fontFamily: "'Poppins', sans-serif",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#b52626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#D12E2E")
              }
            >
              <Mail size={16} strokeWidth={2} />
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
