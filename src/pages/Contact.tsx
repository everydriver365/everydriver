import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Phone, Mail, MapPin, Clock, FileEdit, Loader2, CheckCircle } from "lucide-react";
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
            ) : isCallback ? (
              <>
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold">Request a Callback</h1>
                <p className="text-muted-foreground mt-2">
                  Leave your details and we'll call you back
                </p>
              </>
            ) : (
              <>
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold">Contact Us</h1>
                <p className="text-muted-foreground mt-2">
                  Get in touch with our friendly team
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
          ) : isCallback ? (
            <div className="max-w-lg mx-auto">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Request a Callback</h2>
                  <form className="space-y-4" onSubmit={handleCallbackSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name *</Label>
                        <Input 
                          id="firstName" 
                          placeholder="John" 
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name *</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Smith" 
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number *</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="07123 456789" 
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">What would you like to discuss? (optional)</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us briefly what you'd like to talk about..."
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Request Callback"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Contact Info */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Phone</div>
                      <a href="tel:08001234567" className="text-muted-foreground hover:text-primary">
                        0800 123 4567
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <a href="mailto:hello@drivingschool.com" className="text-muted-foreground hover:text-primary">
                        hello@drivingschool.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-muted-foreground">
                        123 High Street, London, SW1A 1AA
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Opening Hours</div>
                      <div className="text-muted-foreground">
                        Mon - Fri: 9am - 6pm<br />
                        Sat: 10am - 4pm
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Send us a message</h2>
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input 
                          id="firstName" 
                          placeholder="John" 
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Smith" 
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="07123 456789"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="How can we help you?"
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
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
