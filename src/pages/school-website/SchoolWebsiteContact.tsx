import { useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SchoolWebsiteLayout from "./SchoolWebsiteLayout";

export default function SchoolWebsiteContact() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // In production this would submit to an edge function
    setTimeout(() => {
      toast.success("Message sent! We'll be in touch soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
      setSending(false);
    }, 1000);
  };

  return (
    <SchoolWebsiteLayout pageType="contact">
      {(school) => {
        const brandColor = school.brand_colour || "#3b82f6";
        const buttonColor = school.website_button_color || brandColor;
        return (
          <div>
            <section className="py-16 md:py-20" style={{ background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)` }}>
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Ready to start your driving journey? Get in touch today.</p>
              </div>
            </section>

            <section className="py-12">
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Contact details */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Get in Touch</h2>
                    {school.contact_phone && (
                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                            <Phone className="h-5 w-5" style={{ color: brandColor }} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <a href={`tel:${school.contact_phone}`} className="font-semibold hover:underline">{school.contact_phone}</a>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {school.contact_email && (
                      <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                            <Mail className="h-5 w-5" style={{ color: brandColor }} />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <a href={`mailto:${school.contact_email}`} className="font-semibold hover:underline">{school.contact_email}</a>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Contact form */}
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Send a Message</h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea id="message" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                        </div>
                        <Button type="submit" disabled={sending} className="w-full text-white" style={{ backgroundColor: buttonColor }}>
                          <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          </div>
        );
      }}
    </SchoolWebsiteLayout>
  );
}
