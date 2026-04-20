import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accessibility, Users, MessageSquare, Wrench, Radio, Heart, ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const tiles = [
  { to: "/accessible/instructors", icon: Users, title: "Find an accessible instructor", desc: "Search instructors with adapted vehicles, BSL signing and disability experience." },
  { to: "/accessible/forum", icon: MessageSquare, title: "Community forum", desc: "Share tips, ask questions and connect with other disabled drivers." },
  { to: "/accessible/garages", icon: Wrench, title: "Adapted vehicle garages", desc: "UK directory of WAV converters and adaptation specialists." },
  { to: "/accessible/trackers", icon: Radio, title: "Trackers for adapted cars", desc: "Compare GPS trackers that work with adapted and Motability vehicles." },
];

const audiences = [
  "Wheelchair users",
  "Hand-control drivers",
  "Deaf & hard of hearing",
  "Autistic & neurodiverse learners",
  "Anxiety & confidence rebuilds",
  "Stroke & brain-injury recovery",
];

export default function AccessibleHome() {
  return (
    <MainLayout>
      <SEOHead
        title="Drive365 Accessible — Driving for disabled drivers"
        description="Find accessible driving instructors, adapted vehicle garages, trackers and a supportive community for disabled drivers across the UK."
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="container max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Accessibility className="h-4 w-4" />
            Drive365 Accessible
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Driving designed around you</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Accessible instructors, adapted-vehicle garages, trackers and a community — built for disabled drivers, learners and their families.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/accessible/instructors">Find an instructor <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/accessible/forum">Visit the forum</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Hub tiles */}
      <section className="container py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to}>
              <Card className="group h-full p-6 transition-all hover:border-primary hover:shadow-md">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <t.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Who we help */}
      <section className="bg-secondary/30 py-12">
        <div className="container max-w-4xl">
          <h2 className="mb-6 text-center text-3xl font-bold">Who we help</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a} className="flex items-center gap-2 rounded-lg bg-card p-4 shadow-sm">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl py-12">
        <h2 className="mb-6 text-center text-3xl font-bold">Frequently asked</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="1">
            <AccordionTrigger>Can I learn in my own adapted car?</AccordionTrigger>
            <AccordionContent>
              Yes — many of our instructors will teach in your adapted vehicle, or provide a dual-control adapted car. Filter by adaptation when searching.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>What is a DVSA Special Needs test?</AccordionTrigger>
            <AccordionContent>
              The DVSA offers an extended practical test for disabled candidates with extra time and the option for an interpreter. Apply when booking your test.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="3">
            <AccordionTrigger>Do you support Motability scheme drivers?</AccordionTrigger>
            <AccordionContent>
              Many garages and instructors in the directory are Motability-friendly. Look for the Motability badge when browsing.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </MainLayout>
  );
}
