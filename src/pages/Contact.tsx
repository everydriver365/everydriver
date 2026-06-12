import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Phone, PhoneOutgoing, Mail, MapPin, Clock, FileEdit, Loader2, CheckCircle, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BespokeEnquiryForm } from "@/components/BespokeEnquiryForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

const CONTACT_SEO = (
  <SEOHead
    title="Contact EveryDriver | Get in Touch With Our Team"
    description="Contact EveryDriver for help with bookings, callback requests or bespoke driving course enquiries. UK-based support team, fast response."
  />
);

export default function Contact() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const isBespoke = type === "bespoke";
  const isCallback = type === "callback";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("create-enquiry", {
        body: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          address: formData.email || "No email provided",
          postcode: formData.phone || "No phone provided",
          courseType: "callback",
          requestedHours: 0,
          preferredTiming: "flexible",
          additionalNotes: formData.message || null,
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast.success("Callback request submitted! We'll be in touch soon.");
    } catch (error) {
      console.error("Error submitting callback request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("create-enquiry", {
        body: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          address: formData.email || "No email provided",
          postcode: formData.phone || "No phone provided",
          courseType: "general",
          requestedHours: 0,
          preferredTiming: "flexible",
          additionalNotes: formData.message || null,
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
      toast.success("Message sent! We'll be in touch soon.");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted && (isCallback || !isBespoke)) {
    return (
      <MainLayout>
        {CONTACT_SEO}
        <div className="container py-8 pb-24">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground">
                  {isCallback 
                    ? "Your callback request has been submitted. We'll call you back as soon as possible."
                    : "Your message has been sent. We'll get back to you shortly."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Request a Callback (Drive365 branded) ─────────────────────────
  if (isCallback) {
    const tabs = [
      { label: "Request a Callback", href: "/contact?type=callback", active: true },
      { label: "Bespoke Course Request", href: "/contact?type=bespoke", active: false },
      { label: "Plan a Course", href: "/search", active: false },
      { label: "Test Swap", href: "/test-swap", active: false },
    ];

    const tabBase: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 16px",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "'Poppins', sans-serif",
      whiteSpace: "nowrap",
      textDecoration: "none",
      borderBottom: "2px solid transparent",
      color: "#888",
      transition: "color 0.15s, border-color 0.15s",
      flexShrink: 0,
    };

    const tabActive: React.CSSProperties = {
      color: "#D12E2E",
      borderBottom: "2px solid #D12E2E",
    };

    const inputBase: React.CSSProperties = {
      background: "#fafbfc",
      border: "1.5px solid #e8edf2",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "'Poppins', sans-serif",
      padding: "10px 12px",
      width: "100%",
      outline: "none",
      color: "#0F2044",
      boxSizing: "border-box",
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#0070C0";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#e8edf2";
    };

    return (
      <MainLayout>
        {CONTACT_SEO}
        <style>{`
          @media (max-width: 479px) {
            .callback-name-grid { grid-template-columns: 1fr !important; }
          }
          @media (min-width: 480px) {
            .callback-name-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>
        <div style={{ fontFamily: "'Poppins', sans-serif" }}>
          {/* Tab Navigation */}
          <div style={{ background: "#fff", borderBottom: "1.5px solid #e8edf2" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ display: "flex", width: "max-content", margin: "0 auto" }}>
                {tabs.map((tab) => (
                  <Link
                    key={tab.label}
                    to={tab.href}
                    style={tab.active ? { ...tabBase, ...tabActive } : tabBase}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px 80px" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: "#FCEBEB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Phone style={{ width: 24, height: 24, color: "#D12E2E" }} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F2044", margin: "0 0 8px" }}>
                Request a Callback
              </h1>
              <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
                Leave your details and we'll call you back
              </p>
            </div>

            {/* Form Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1.5px solid #e8edf2",
                padding: "1.75rem",
              }}
            >
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#0F2044",
                  margin: "0 0 20px",
                }}
              >
                Your details
              </h2>
              <form onSubmit={handleCallbackSubmit} className="space-y-4">
                {/* Name row */}
                <div className="callback-name-grid grid gap-4">
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0F2044",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      First name <span style={{ color: "#D12E2E" }}>*</span>
                    </label>
                    <input
                      required
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      style={inputBase}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0F2044",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Last name <span style={{ color: "#D12E2E" }}>*</span>
                    </label>
                    <input
                      required
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      style={inputBase}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0F2044",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Phone number <span style={{ color: "#D12E2E" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="07123 456789"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    style={inputBase}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0F2044",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Email{" "}
                    <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    style={inputBase}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0F2044",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    What would you like to discuss?{" "}
                    <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="Tell us briefly what you'd like to talk about..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    style={{ ...inputBase, minHeight: 100, resize: "vertical" }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    background: "#D12E2E",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.15s",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#b52626";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = "#D12E2E";
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <PhoneOutgoing className="h-4 w-4" />
                      Request callback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Bespoke Course Request (Drive365 branded) ─────────────────────
  if (isBespoke) {
    return <BespokeBranded />;
  }

  // Drive365 redesigned default contact page
  const infoCards = [
    { title: "Phone", detail: "0800 123 4567", icon: Phone, chipBg: "#FCEBEB", chipFg: "#D12E2E" },
    { title: "Email", detail: "hello@drive365.co.uk", icon: Mail, chipBg: "#E6F1FB", chipFg: "#0070C0" },
    { title: "Address", detail: "123 High Street, Winchester, SO23 1AA", icon: MapPin, chipBg: "#EAF3DE", chipFg: "#3B6D11" },
    { title: "Opening Hours", detail: "Mon – Fri: 9am – 6pm / Sat: 10am – 4pm", icon: Clock, chipBg: "#FAEEDA", chipFg: "#854F0B" },
  ];

  const inputStyle: React.CSSProperties = {
    background: "#fafbfc",
    border: "1.5px solid #e8edf2",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'Poppins', sans-serif",
    padding: "10px 12px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s",
    color: "#0F2044",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#0070C0"; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = "#e8edf2"; };

  return (
    <MainLayout>
      {CONTACT_SEO}
      <style>{`
        .d365-contact { font-family: 'Poppins', sans-serif; color: #0F2044; }
        .d365-contact h1, .d365-contact h2, .d365-contact h3 { font-family: 'Poppins', sans-serif; color: #0F2044; }
        .d365-card { background:#fff; border-radius:14px; border:1.5px solid #e8edf2; transition: border-color .15s; }
        .d365-card:hover { border-color:#0070C0; }
        .d365-submit { background:#D12E2E; color:#fff; transition: background .15s; }
        .d365-submit:hover { background:#b52626; }
      `}</style>
      <div className="d365-contact container py-10 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: "#FCEBEB" }}
            >
              <Phone style={{ width: 20, height: 20, color: "#D12E2E" }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0F2044", margin: 0 }}>
              Contact Drive365
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
              Get in touch with our friendly team
            </p>
          </div>

          {/* Two-column grid 40/60 */}
          <div className="grid gap-6 lg:[grid-template-columns:2fr_3fr]">
            {/* Left: info cards */}
            <div className="space-y-4">
              {infoCards.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="d365-card flex items-center gap-4 p-4">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 42, height: 42, borderRadius: 10, background: c.chipBg }}
                    >
                      <Icon style={{ width: 20, height: 20, color: c.chipFg }} />
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2044" }}>{c.title}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{c.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: form */}
            <div className="d365-card" style={{ padding: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F2044", marginBottom: 16 }}>
                Send us a message
              </h2>
              <form className="space-y-4" onSubmit={handleContactSubmit}>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <input
                      placeholder="First name"
                      required
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <input
                      placeholder="Last name"
                      required
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <textarea
                  placeholder="Message"
                  required
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="d365-submit w-full flex items-center justify-center gap-2"
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" />Send message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ── Bespoke Course Request (Drive365 branded) ───────────────────────
function BespokeBranded() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [data, setData] = useState({
    name: "",
    address: "",
    postcode: "",
    courseType: "",
    requestedHours: "20",
    preferredTiming: "",
    additionalNotes: "",
  });

  const tabs = [
    { label: "Request a Callback", href: "/contact?type=callback", active: false },
    { label: "Bespoke Course Request", href: "/contact?type=bespoke", active: true },
    { label: "Plan a Course", href: "/search", active: false },
    { label: "Test Swap", href: "/test-swap", active: false },
  ];

  const tabBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    whiteSpace: "nowrap",
    textDecoration: "none",
    borderBottom: "2px solid transparent",
    color: "#888",
    transition: "color 0.15s, border-color 0.15s",
    flexShrink: 0,
  };
  const tabActive: React.CSSProperties = { color: "#D12E2E", borderBottom: "2px solid #D12E2E" };

  const inputBase: React.CSSProperties = {
    background: "#fafbfc",
    border: "1.5px solid #e8edf2",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'Poppins', sans-serif",
    padding: "10px 12px",
    width: "100%",
    outline: "none",
    color: "#0F2044",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#0F2044",
    display: "block",
    marginBottom: 6,
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#0070C0";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#e8edf2";
  };

  const selectStyle: React.CSSProperties = {
    ...inputBase,
    fontWeight: 600,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px 16px",
    paddingRight: 36,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("create-enquiry", {
        body: {
          name: data.name,
          address: data.address,
          postcode: data.postcode,
          courseType: data.courseType,
          requestedHours: parseInt(data.requestedHours, 10) || 0,
          preferredTiming: data.preferredTiming,
          additionalNotes: data.additionalNotes || null,
        },
      });
      if (error) throw error;
      setIsSubmitted(true);
      toast.success("Request submitted! We'll be in touch soon.");
    } catch (err) {
      console.error("Error submitting bespoke request:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        {CONTACT_SEO}
        <div className="container py-8 pb-24">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground">
                  Your bespoke course request has been submitted. We'll match you with the perfect instructor shortly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {CONTACT_SEO}
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/* Tab Navigation */}
        <div style={{ background: "#fff", borderBottom: "1.5px solid #e8edf2" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", width: "max-content", margin: "0 auto" }}>
              {tabs.map((tab) => (
                <Link key={tab.label} to={tab.href} style={tab.active ? { ...tabBase, ...tabActive } : tabBase}>
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px 80px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: "#FCEBEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FileEdit style={{ width: 24, height: 24, color: "#D12E2E" }} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F2044", margin: "0 0 8px" }}>
              Bespoke Course Request
            </h1>
            <p style={{ fontSize: 14, color: "#888", margin: 0 }}>
              Tell us what you're looking for and we'll match you with the perfect instructor
            </p>
          </div>

          {/* Form Card */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "1.75rem" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F2044", margin: "0 0 20px" }}>
              Request a bespoke course
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div>
                <label style={labelStyle}>
                  Full name <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <input
                  required
                  placeholder="John Smith"
                  value={data.name}
                  onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
                  style={inputBase}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Address with pin icon */}
              <div>
                <label style={labelStyle}>
                  Address <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 16,
                      height: 16,
                      color: "#888",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    required
                    placeholder="Start typing an address..."
                    value={data.address}
                    onChange={(e) => setData((p) => ({ ...p, address: e.target.value }))}
                    style={{ ...inputBase, paddingLeft: 36 }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Postcode */}
              <div>
                <label style={labelStyle}>
                  Postcode <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <input
                  required
                  placeholder="SO23 1AA"
                  value={data.postcode}
                  onChange={(e) => setData((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))}
                  style={inputBase}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Course type */}
              <div>
                <label style={labelStyle}>
                  What type of course are you looking for? <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <select
                  required
                  value={data.courseType}
                  onChange={(e) => setData((p) => ({ ...p, courseType: e.target.value }))}
                  style={selectStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select course type</option>
                  <option value="intensive">Intensive Course</option>
                  <option value="semi-intensive">Semi-Intensive Course</option>
                  <option value="payg">Pay As You Go Lessons</option>
                  <option value="refresher">Refresher Course</option>
                </select>
              </div>

              {/* Hours */}
              <div>
                <label style={labelStyle}>
                  How many hours do you need? <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <select
                  required
                  value={data.requestedHours}
                  onChange={(e) => setData((p) => ({ ...p, requestedHours: e.target.value }))}
                  style={selectStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="10">10 hours</option>
                  <option value="20">20 hours</option>
                  <option value="30">30 hours</option>
                  <option value="40">40+ hours</option>
                </select>
              </div>

              {/* Timing */}
              <div>
                <label style={labelStyle}>
                  When would you like to start? <span style={{ color: "#D12E2E" }}>*</span>
                </label>
                <select
                  required
                  value={data.preferredTiming}
                  onChange={(e) => setData((p) => ({ ...p, preferredTiming: e.target.value }))}
                  style={selectStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select your preferred timing</option>
                  <option value="asap">As soon as possible</option>
                  <option value="2weeks">Within 2 weeks</option>
                  <option value="1month">Within a month</option>
                  <option value="flexible">I'm flexible</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>
                  Additional notes <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  placeholder="Any specific requirements, previous experience, or questions?"
                  value={data.additionalNotes}
                  onChange={(e) => setData((p) => ({ ...p, additionalNotes: e.target.value }))}
                  style={{ ...inputBase, minHeight: 90, resize: "vertical" }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  background: "#D12E2E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.background = "#b52626";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.background = "#D12E2E";
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit bespoke course request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
