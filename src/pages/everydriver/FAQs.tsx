import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useMemo } from "react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      const { data, error } = await supabase
        .from("public_faqs")
        .select("id, question, answer, category, display_order")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setFaqs(data);
      }
      setLoading(false);
    };

    fetchFAQs();
  }, []);

  // Group FAQs by category
  const categories = [...new Set(faqs.map(faq => faq.category))];

  const faqJsonLd = useMemo(() => {
    if (!faqs.length) return undefined;
    return {
      id: "faqpage-jsonld",
      data: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    };
  }, [faqs]);

  return (
    <MainLayout>
      <SEOHead
        title="Driving Lesson FAQs | Common Questions Answered | EveryDriver"
        description="Answers to common questions about booking driving lessons, intensive courses, payment options, instructors and the DVSA test."
        jsonLd={faqJsonLd}
      />
      <div className="container py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about driving lessons
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading FAQs...
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No FAQs available at this time.
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category}>
                  <Badge variant="secondary" className="mb-3">{category}</Badge>
                  <Accordion type="single" collapsible className="space-y-2">
                    {faqs
                      .filter(faq => faq.category === category)
                      .map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
