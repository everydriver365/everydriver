import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ComparisonSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Instructors Choose EveryDriver</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card className="border-border h-full">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-4">Without EveryDriver</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    {[
                      "Juggling paper diaries and spreadsheets",
                      "Chasing payments manually",
                      "No online presence for bookings",
                      "Forgetting to send reminders",
                      "No visibility on business performance",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-destructive">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Card className="border-accent shadow-lg shadow-accent/10 h-full">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">With EveryDriver</h3>
                  <ul className="space-y-3 text-foreground">
                    {[
                      "Everything organised in one smart app",
                      "Automated payment requests & tracking",
                      "Professional website with direct bookings",
                      "Automatic SMS & push notifications",
                      "Clear analytics on earnings & growth",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
