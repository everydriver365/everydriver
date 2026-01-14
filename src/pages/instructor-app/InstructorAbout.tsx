import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Award, Clock, Shield } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Built by Instructors",
    description: "Our team includes experienced driving instructors who understand your daily challenges and workflow needs."
  },
  {
    icon: Award,
    title: "Industry Leading",
    description: "We're committed to providing the most comprehensive and user-friendly platform for driving instructors."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate administrative tasks so you can focus on what you do best – teaching people to drive safely."
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data is protected with enterprise-grade security, and our platform is built for 99.9% uptime."
  }
];

export default function InstructorAbout() {
  return (
    <InstructorSaaSLayout>
      <div className="container max-w-6xl py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Drive365
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to empower driving instructors with the tools they need to run a successful, 
            stress-free business.
          </p>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <Card className="bg-secondary/30 border-0">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Drive365 was born from a simple observation: driving instructors spend too much time on 
                  paperwork and admin, and not enough time doing what they love – teaching.
                </p>
                <p>
                  We spoke with hundreds of instructors across the UK and discovered common pain points: 
                  juggling multiple apps for scheduling, chasing payments, managing pupil progress, and 
                  trying to fill gaps in their diary.
                </p>
                <p>
                  So we built Drive365 – a single, powerful platform that handles everything from diary 
                  management to automated reminders, payment tracking to pupil progress reports. All 
                  designed specifically for the unique needs of driving instructors.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="border-border/50">
                <CardContent className="p-6 flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <value.icon className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-emerald-500/10 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of instructors who have simplified their admin and grown their business with Drive365.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-emerald-500 text-white hover:bg-emerald-600" size="lg" asChild>
              <Link to="/instructor-app/signup">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/instructor-app/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </InstructorSaaSLayout>
  );
}
