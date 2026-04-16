import { useState } from "react";
import { Phone, Mail, Send, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { toast } from "sonner";

const CONTACT_TOPICS = [
  "Schedule Query",
  "Payment Issue",
  "Pupil Complaint",
  "Vehicle Problem",
  "Technical Support",
  "Holiday Request",
  "General Enquiry",
  "Other"
];

export default function InstructorContact() {
  const { instructor } = useInstructorAuth();
  
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic || !message.trim()) {
      toast.error("Please select a topic and enter a message");
      return;
    }

    setSending(true);
    
    // Simulate sending - in production this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Message sent to the office!");
    setTopic("");
    setSubject("");
    setMessage("");
    setSending(false);
  };

  if (!instructor) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Contact Office</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Get in touch with support</p>
        </div>

        {/* Quick Contact Options */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-foreground">Need immediate help?</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="gap-2 h-12" asChild>
                <a href="tel:+441234567890">
                  <Phone className="h-4 w-4" />
                  Call Office
                </a>
              </Button>
              <Button variant="outline" className="gap-2 h-12" asChild>
                <a href="mailto:support@everydriver.co.uk">
                  <Mail className="h-4 w-4" />
                  Email Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send a Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <Label>Topic *</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="What's this about?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TOPICS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief summary (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Describe your query or issue..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/1000
                </p>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full gap-2" 
                size="lg"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Office Hours Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-foreground mb-2">Office Hours</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
              <p>Saturday: 10:00 AM - 2:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              We typically respond to messages within 24 hours during business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </InstructorPortalLayout>
  );
}
