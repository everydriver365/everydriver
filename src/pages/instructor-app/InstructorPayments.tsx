import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import { TestimonialStrip } from "@/components/instructor-features/TestimonialStrip";
import { FeatureCTA } from "@/components/instructor-features/FeatureCTA";
import { CreditCard, BarChart3, Bell, FileText, Smartphone, PoundSterling, QrCode, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import paymentsImg from "@/assets/features/payments-tracking.jpg";

const testimonials = [
  { quote: "Chasing payments used to be my least favourite part of the job. Now the app handles it and I just get paid.", name: "Mark D.", role: "ADI, Leeds", stars: 5 },
  { quote: "The QR code payments are a game-changer — pupils just scan and pay in the car. No more awkward conversations.", name: "Sarah M.", role: "ADI, Manchester", stars: 5 },
  { quote: "I can finally see exactly what I'm earning each week without spending hours on spreadsheets.", name: "Chris L.", role: "ADI, London", stars: 5 },
];

const detailFeatures = [
  { icon: PoundSterling, title: "Real-Time Balance Tracking", description: "See each pupil's credit or outstanding balance at a glance — updated instantly after every payment." },
  { icon: QrCode, title: "In-Car QR Payments", description: "Pupils scan a QR code in your car and pay instantly via Open Banking. No card machines, no cash." },
  { icon: Bell, title: "Automatic Payment Reminders", description: "Send SMS or email reminders to pupils with outstanding balances — one tap from their pupil card." },
  { icon: FileText, title: "Professional Invoices", description: "Generate and share PDF invoices for individual lessons or course packages with your branding." },
  { icon: BarChart3, title: "Revenue Reports", description: "Weekly and monthly earnings summaries with trend charts so you always know how your business is performing." },
  { icon: TrendingUp, title: "Commission Transparency", description: "Choose who absorbs platform fees — you or your pupil. Clear breakdowns so there are never any surprises." },
];

export default function InstructorPayments() {
  return (
    <InstructorSaaSLayout>
      <FeaturePageHero
        icon={CreditCard}
        title="Effortless Payment Tracking"
        description="Track every payment, chase outstanding balances, and generate professional invoices — all built into your diary."
        features={["Payment status tracking", "Automatic reminders", "PDF invoices", "Revenue reports"]}
        image={paymentsImg}
      />

      {/* Detail grid */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything You Need to Get Paid</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From instant QR payments to automated reminders, we handle the money so you can focus on teaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detailFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-[#0075c9]/50 transition-colors"
              >
                <div className="w-12 h-12 bg-[#0075c9]/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#0075c9]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialStrip testimonials={testimonials} />
      <FeatureCTA />
    </InstructorSaaSLayout>
  );
}
