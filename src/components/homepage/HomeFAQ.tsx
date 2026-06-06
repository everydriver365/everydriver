import { useState } from "react";

const FAQS = [
  {
    question: "How does the free re-test guarantee work?",
    answer:
      "If you don't pass your practical test first time, we cover the re-test fee. No forms, no fuss — just let us know and we'll sort it. Applies to all intensive courses booked through Every Driver.",
  },
  {
    question: "What's included in the free theory test?",
    answer:
      "We cover the £23 DVSA theory test fee on every course. After purchase you'll receive a booking link — pick your date and centre. Theory prep materials are included too.",
  },
  {
    question: "Are instructors insured and fully qualified?",
    answer:
      "Yes — every instructor is DVSA approved, holds a valid ADI licence, is fully insured, and has passed an enhanced DBS check before listing. Anyone who falls below our standard is removed.",
  },
  {
    question: "Can I spread the cost with Klarna or Clearpay?",
    answer:
      "Yes. Pay in 3 with Klarna or pay in 4 with Clearpay — both 0% interest, no fees. Your course is confirmed immediately whichever option you choose.",
  },
  {
    question: "What if I'm not happy with my instructor?",
    answer:
      "Contact our support team and we'll work to resolve it. In most cases we can move you to another vetted instructor with no extra charge and no lessons lost.",
  },
];

export function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section
      style={{
        fontFamily: "'Poppins', system-ui, sans-serif",
        background: "#F6F6F8",
        padding: "48px 5% 56px",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#D12E2E",
            textTransform: "uppercase",
            letterSpacing: 1.5,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          FAQ
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0A1936",
            letterSpacing: -0.3,
            margin: "0 0 28px",
            textAlign: "center",
          }}
        >
          Common questions.
        </h2>

        {/* Accordion */}
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                borderTop: "1px solid #E5E7EB",
                ...(i === FAQS.length - 1 ? { borderBottom: "1px solid #E5E7EB" } : {}),
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#0A1936",
                    lineHeight: 1.4,
                    flex: 1,
                  }}
                >
                  {item.question}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    transition: "transform 200ms ease",
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 4V16M4 10H16"
                      stroke="#0A1936"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>

              <div
                style={{
                  maxHeight: isOpen ? 300 : 0,
                  overflow: "hidden",
                  transition: "max-height 300ms ease",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    lineHeight: 1.7,
                    margin: "0 0 16px",
                    paddingRight: 36,
                  }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
