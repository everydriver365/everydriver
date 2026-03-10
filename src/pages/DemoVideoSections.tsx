import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Film, Sparkles, Quote, Star, ChevronRight, ArrowRight, Clock, Users, Award, MapPin, Shield, Clapperboard, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import videoThumbnail from "@/assets/video-thumbnail.jpg";

const DemoVideoSections = () => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "cinematic", label: "Cinematic Full-Width" },
    { id: "editorial", label: "Editorial Split" },
    { id: "minimal", label: "Minimal Card" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-xl font-bold">Video Section Variants</h1>
            <p className="text-sm text-muted-foreground">Choose a design for the Drive365 homepage</p>
          </div>
          <div className="flex gap-2">
            {variants.map((v) => (
              <Button
                key={v.id}
                size="sm"
                variant={activeVariant === v.id ? "default" : "outline"}
                onClick={() => setActiveVariant(activeVariant === v.id ? null : v.id)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Variant 1: Cinematic Full-Width */}
      {(!activeVariant || activeVariant === "cinematic") && (
        <section className="relative">
          <div className="py-8 container">
            <Badge variant="outline" className="mb-4">Variant 1 — Cinematic Full-Width</Badge>
          </div>
          <div className="relative overflow-hidden bg-zinc-950 py-24">
            {/* Background Video Thumbnail with overlay */}
            <div className="absolute inset-0">
              <img
                src={videoThumbnail}
                alt=""
                className="h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            </div>

            <div className="container relative z-10">
              <div className="grid items-center gap-16 lg:grid-cols-5">
                {/* Content — wider */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  viewport={{ once: true }}
                  className="lg:col-span-2"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
                      <Film className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-widest text-amber-400">
                      Our Story
                    </span>
                  </div>
                  <h2 className="mb-6 text-4xl font-black leading-tight text-white md:text-5xl">
                    Every Driver
                    <br />
                    <span className="text-amber-400">Has a Story</span>
                  </h2>
                  <p className="mb-8 max-w-md text-lg leading-relaxed text-zinc-400">
                    From nervous first-timers to confident road users. Watch how we've transformed thousands of driving journeys across the UK.
                  </p>
                  <div className="flex items-center gap-6">
                    <Button
                      size="lg"
                      onClick={() => setVideoModalOpen(true)}
                      className="gap-3 bg-amber-500 px-8 text-base font-bold hover:bg-amber-400 text-zinc-950"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Watch Now
                    </Button>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">2 min watch</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-12 flex gap-8 border-t border-zinc-800 pt-8">
                    {[
                      { icon: Users, value: "10,000+", label: "Drivers Trained" },
                      { icon: Star, value: "4.9★", label: "Average Rating" },
                      { icon: Award, value: "15+", label: "Years Experience" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-xs text-zinc-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Video Player — narrower */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="lg:col-span-3"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-amber-500/10">
                    <img
                      src={videoThumbnail}
                      alt="Our Story Video"
                      className="aspect-video w-full object-cover"
                    />
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="absolute inset-0 flex items-center justify-center transition-all hover:bg-black/10"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 shadow-xl shadow-amber-500/30"
                      >
                        <Play className="h-8 w-8 fill-white text-white ml-1" />
                      </motion.div>
                    </button>
                    {/* Progress-style bar at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div className="h-full w-1/3 bg-amber-500" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Variant 2: Editorial Split */}
      {(!activeVariant || activeVariant === "editorial") && (
        <section>
          <div className="py-8 container">
            <Badge variant="outline" className="mb-4">Variant 2 — Editorial Split</Badge>
          </div>
          <div className="bg-gradient-to-br from-stone-50 to-amber-50/40 py-20">
            <div className="container">
              <div className="grid items-stretch gap-0 overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2">
                {/* Left — Video */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <img
                    src={videoThumbnail}
                    alt="Our Story Video"
                    className="h-full w-full object-cover"
                    style={{ minHeight: 400 }}
                  />
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/10 transition-all hover:bg-black/20"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full bg-white/30"
                      />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                        <Play className="h-7 w-7 fill-amber-500 text-amber-500 ml-0.5" />
                      </div>
                    </div>
                  </button>
                  {/* Duration badge */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                    <Clock className="h-3 w-3" />
                    2:14
                  </div>
                </motion.div>

                {/* Right — Content */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  viewport={{ once: true }}
                  className="flex flex-col justify-center bg-white p-10 lg:p-14"
                >
                  <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700">
                    <Sparkles className="h-4 w-4" />
                    Our Story
                  </div>
                  <h2 className="mb-4 text-3xl font-black leading-tight text-zinc-900 lg:text-4xl">
                    Built by Instructors,
                    <br />
                    <span className="text-amber-600">for Instructors</span>
                  </h2>
                  <p className="mb-6 text-base leading-relaxed text-zinc-600">
                    We started as driving instructors ourselves. We know the early mornings, the nervous pupils, and the joy of seeing someone pass. That's why we built something different.
                  </p>

                  {/* Quote */}
                  <div className="mb-8 rounded-xl border-l-4 border-amber-400 bg-amber-50/50 p-5">
                    <Quote className="mb-2 h-5 w-5 text-amber-400" />
                    <p className="text-sm italic text-zinc-700">
                      "Every learner deserves an instructor who truly cares. That's the standard we set."
                    </p>
                    <p className="mt-2 text-xs font-semibold text-zinc-500">— Drive365 Founders</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setVideoModalOpen(true)}
                      className="gap-2 bg-amber-500 font-bold hover:bg-amber-600"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      Watch Our Story
                    </Button>
                    <Button variant="ghost" className="gap-2 text-amber-700 hover:text-amber-800" asChild>
                      <Link to="/about">
                        Learn More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Variant 3: Minimal Card */}
      {(!activeVariant || activeVariant === "minimal") && (
        <section>
          <div className="py-8 container">
            <Badge variant="outline" className="mb-4">Variant 3 — Minimal Card</Badge>
          </div>
          <div className="bg-background py-20">
            <div className="container max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <h2 className="text-4xl font-black mb-3">
                  See What Makes Us <span className="text-amber-500">Different</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  A 2-minute look at how we're changing driving education in the UK
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl bg-zinc-950"
              >
                <img
                  src={videoThumbnail}
                  alt="Our Story Video"
                  className="aspect-video w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                {/* Play button */}
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <Play className="h-8 w-8 fill-white text-white ml-1" />
                  </motion.div>
                  <span className="text-sm font-semibold text-white/80">Click to play</span>
                </button>

                {/* Bottom content bar */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Every Driver Has a Story</h3>
                    <p className="text-sm text-zinc-400">Our founding journey • 2:14</p>
                  </div>
                  <Button
                    onClick={() => setVideoModalOpen(true)}
                    size="sm"
                    className="gap-2 bg-amber-500 font-bold hover:bg-amber-400 text-zinc-950"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Play
                  </Button>
                </div>
              </motion.div>

              {/* Feature pills below */}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {["Trusted by 10,000+ Drivers", "4.9★ Average Rating", "15+ Years Experience", "UK-Wide Coverage"].map((text) => (
                  <div
                    key={text}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Spacer */}
      <div className="h-20" />

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <div className="aspect-video flex items-center justify-center text-zinc-500">
            <p>Video player placeholder</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoVideoSections;
