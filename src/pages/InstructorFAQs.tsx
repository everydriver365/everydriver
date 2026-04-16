import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, HelpCircle, ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function InstructorFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from("instructor_faqs")
      .select("id, question, answer, category")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  const handleSubmitTicket = async () => {
    if (!supportForm.subject || !supportForm.category || !supportForm.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Simulate ticket submission - in production this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({ 
      title: "Support ticket submitted", 
      description: "We'll get back to you within 24 hours" 
    });
    
    setShowSupportForm(false);
    setSupportForm({ subject: "", category: "", message: "" });
    setSubmitting(false);
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(filteredFAQs.map(faq => faq.category))];

  const content = (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">FAQs & Help</h1>
          <p className="text-sm text-muted-foreground">Find answers to common questions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "No FAQs match your search" : "No FAQs available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category}>
              <Badge variant="secondary" className="mb-2">{category}</Badge>
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFAQs
                  .filter(faq => faq.category === category)
                  .map(faq => (
                    <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}

      {/* Contact Support Button */}
      <Card className="mt-6">
        <CardContent className="py-6 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-primary mb-3" />
          <h3 className="font-semibold mb-1">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Contact our support team.
          </p>
          <Button onClick={() => setShowSupportForm(true)}>
            <Send className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>

      {/* Support Ticket Dialog */}
      <Dialog open={showSupportForm} onOpenChange={setShowSupportForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Submit a support ticket and we'll get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={supportForm.category} 
                onValueChange={(value) => setSupportForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="billing">Billing & Payments</SelectItem>
                  <SelectItem value="calendar">Calendar & Scheduling</SelectItem>
                  <SelectItem value="pupils">Pupils & Lessons</SelectItem>
                  <SelectItem value="account">Account Settings</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Brief description of your issue"
                value={supportForm.subject}
                onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={supportForm.message}
                onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>
            <Button 
              onClick={handleSubmitTicket} 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {content}
      </div>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="max-w-2xl mx-auto">
        {content}
      </div>
    </InstructorPortalLayout>
  );
}
