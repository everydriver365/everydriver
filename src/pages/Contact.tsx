import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Phone, Mail, MapPin, Clock, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BespokeEnquiryForm } from "@/components/BespokeEnquiryForm";

export default function Contact() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");
  const isBespoke = type === "bespoke";

  return (
    <MainLayout>
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
                <h1 className="text-3xl font-bold">Contact Us</h1>
                <p className="text-muted-foreground mt-2">
                  Get in touch with our friendly team
                </p>
              </>
            )}
          </div>

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

            {/* Form - Bespoke or Contact */}
            <Card>
              <CardContent className="p-6">
                {isBespoke ? (
                  <>
                    <h2 className="text-lg font-semibold mb-4">Request a Bespoke Course</h2>
                    <BespokeEnquiryForm />
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold mb-4">Send us a message</h2>
                    <form className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input id="lastName" placeholder="Smith" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input id="phone" type="tel" placeholder="07123 456789" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message" 
                          placeholder="How can we help you?"
                          rows={4}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Send Message
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
