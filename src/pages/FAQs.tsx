import { MainLayout } from "@/components/layout/MainLayout";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How many lessons do I need before my test?",
    answer: "The average learner needs around 45 hours of professional tuition combined with 22 hours of private practice. However, this varies greatly depending on individual learning speed and prior experience.",
  },
  {
    question: "What should I bring to my first lesson?",
    answer: "You must bring your valid provisional driving licence. Wear comfortable shoes (no high heels or flip-flops) and bring glasses if you need them for driving. We recommend comfortable clothing too.",
  },
  {
    question: "Can I cancel or reschedule a lesson?",
    answer: "Yes, you can cancel or reschedule lessons with at least 48 hours notice at no charge. Cancellations with less notice may incur a fee.",
  },
  {
    question: "Do you offer automatic and manual lessons?",
    answer: "Yes, we have instructors teaching both automatic and manual vehicles. You can choose based on your preference. Note that a manual licence allows you to drive both, while an automatic licence only covers automatics.",
  },
  {
    question: "How do I book my practical driving test?",
    answer: "Your instructor can help you book your practical test when you're ready. Alternatively, you can book directly through the DVSA website. Your instructor will advise when you're test-ready.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards. We also offer pay-in-3 with Klarna and pay-in-4 with Clearpay for flexible payment options.",
  },
  {
    question: "Are intensive courses suitable for complete beginners?",
    answer: "Yes! Our intensive courses are designed for all skill levels. Complete beginners may benefit from a slightly longer course (30-40 hours) while those with some experience may be test-ready sooner.",
  },
];

export default function FAQs() {
  return (
    <MainLayout>
      <div className="container py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about driving lessons
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
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
      </div>
    </MainLayout>
  );
}
