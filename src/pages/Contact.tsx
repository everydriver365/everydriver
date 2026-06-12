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

  // Bespoke / Callback variants keep existing layout
  if (isBespoke || isCallback) {
    return (
      <MainLayout>
        {CONTACT_SEO}
        <div className="container py-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              {isBespoke ? (
                <>
                  <FileEdit className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h1 className="text-3xl font-bold">Bespoke Course Request</h1>
                  <p className="text-muted-foreground mt-2">
                    Tell us what you're looking for and we'll match you with the perfect instructor
                  </p>
                </>
              ) : (
                <>
                  <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h1 className="text-3xl font-bold">Request a Callback</h1>
                  <p className="text-muted-foreground mt-2">
                    Leave your details and we'll call you back
                  </p>
                </>
              )}
            </div>

            {isBespoke ? (
              <div className="max-w-lg mx-auto">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Request a Bespoke Course</h2>
                    <BespokeEnquiryForm />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Request a Callback</h2>
                    <form className="space-y-4" onSubmit={handleCallbackSubmit}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name *</Label>
                          <Input id="firstName" placeholder="John" required value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name *</Label>
                          <Input id="lastName" placeholder="Smith" required value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number *</Label>
                        <Input id="phone" type="tel" placeholder="07123 456789" required value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">What would you like to discuss? (optional)</Label>
                        <Textarea id="message" placeholder="Tell us briefly what you'd like to talk about..." rows={3} value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>) : ("Request Callback")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    );
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
