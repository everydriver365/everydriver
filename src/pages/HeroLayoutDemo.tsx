import { motion } from "framer-motion";
import { MapPin, Star, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import testimonialSarah from "@/assets/testimonial-sarah.jpg";
import testimonialJames from "@/assets/testimonial-james.jpg";
import testimonialEmma from "@/assets/testimonial-emma.jpg";

const HeroContent = () => (
  <div>
    <Badge className="mb-4 border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
      Free Re-test
    </Badge>
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
      Your Driving
      <span className="block text-primary">Success Story</span>
      <span className="block">Starts Here</span>
    </h1>
    <p className="mb-6 max-w-md text-muted-foreground">
      Join thousands who passed with DriveTime. Intensive courses designed to get you on the road faster.
    </p>
    <div className="mb-6 flex max-w-sm overflow-hidden rounded-full border bg-card shadow-md">
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Enter postcode..."
          className="h-12 border-0 bg-transparent pl-10 text-sm focus-visible:ring-0"
        />
      </div>
      <Button className="m-1 h-10 rounded-full px-4 text-sm">Find Courses</Button>
    </div>
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
      <span className="ml-1 font-semibold text-foreground">4.9</span>
    </div>
  </div>
);

export default function HeroLayoutDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-nav px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-nav-foreground hover:text-accent">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <h1 className="text-lg font-bold text-nav-foreground">Hero Layout Options</h1>
        </div>
      </header>

      {/* Option 1: Stacked Polaroid Grid */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 1</Badge>
            <h2 className="text-2xl font-bold text-foreground">Stacked Polaroid Grid</h2>
            <p className="text-muted-foreground">Clean grid layout with polaroid-style frames and subtle shadows</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="grid grid-cols-2 gap-4">
              {[testimonialSarah, testimonialJames, testimonialEmma].map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`overflow-hidden rounded-xl bg-white p-2 shadow-lg ${i === 2 ? "col-span-2" : ""}`}
                >
                  <img
                    src={img}
                    alt={`Testimonial ${i + 1}`}
                    className={`w-full rounded-lg object-cover ${i === 2 ? "h-48" : "h-56"}`}
                  />
                  <div className="p-3 text-center">
                    <p className="font-semibold text-foreground">{["Sarah", "James", "Emma"][i]}</p>
                    <p className="text-sm text-muted-foreground">Passed 1st time!</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Option 2: Floating Circular Avatars */}
      <section className="border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 2</Badge>
            <h2 className="text-2xl font-bold text-foreground">Floating Circular Avatars</h2>
            <p className="text-muted-foreground">Large circular images with floating testimonial cards</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="relative flex h-[400px] items-center justify-center">
              {/* Center large circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="relative z-10 h-64 w-64 overflow-hidden rounded-full border-4 border-white shadow-2xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-full w-full object-cover" />
              </motion.div>
              
              {/* Orbiting smaller circles */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute -left-4 top-8 h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-xl"
              >
                <img src={testimonialJames} alt="James" className="h-full w-full object-cover" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -right-4 bottom-12 h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-full w-full object-cover" />
              </motion.div>
              
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 left-1/4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
              >
                15k+ Happy Learners
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 3: Masonry Collage */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 3</Badge>
            <h2 className="text-2xl font-bold text-foreground">Masonry Collage</h2>
            <p className="text-muted-foreground">Modern masonry-style layout with varied heights and overlapping elements</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="relative grid h-[450px] grid-cols-12 gap-3">
              {/* Tall left image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="col-span-5 row-span-2 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Sarah</p>
                  <p className="text-sm text-white/80">Passed in 2 weeks</p>
                </div>
              </motion.div>
              
              {/* Top right image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative col-span-7 h-52 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialJames} alt="James" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">James</p>
                  <p className="text-sm text-white/80">Intensive Course</p>
                </div>
              </motion.div>
              
              {/* Bottom right image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative col-span-7 h-44 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Emma</p>
                  <p className="text-sm text-white/80">Weekly Lessons</p>
                </div>
              </motion.div>
              
              {/* Stats overlay */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-white px-6 py-3 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">98%</p>
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                  </div>
                  <div className="h-8 w-px bg-border"></div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">15k+</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 4: Single Hero with Thumbnail Strip */}
      <section className="border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 4</Badge>
            <h2 className="text-2xl font-bold text-foreground">Single Hero with Thumbnail Strip</h2>
            <p className="text-muted-foreground">One large featured image with smaller thumbnails below</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="space-y-4">
              {/* Main large image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl shadow-2xl"
              >
                <img src={testimonialSarah} alt="Featured" className="h-72 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Sarah Mitchell</p>
                      <p className="text-sm text-white/80">"Best decision I ever made!"</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Thumbnail strip */}
              <div className="flex gap-3">
                {[testimonialJames, testimonialEmma, testimonialSarah].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="group relative flex-1 cursor-pointer overflow-hidden rounded-xl"
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:bg-black/10" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 text-center">
        <p className="text-muted-foreground">Which layout do you prefer? Let me know and I'll implement it!</p>
        <Link to="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </section>
    </div>
  );
}
