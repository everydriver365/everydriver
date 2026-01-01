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
      Join thousands who passed with EveryDriver. Intensive courses designed to get you on the road faster.
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

export default function CollageDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-nav px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-nav-foreground hover:text-accent">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <h1 className="text-lg font-bold text-nav-foreground">Collage Layout Options</h1>
        </div>
      </header>

      {/* Option 1: Classic Masonry */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 1</Badge>
            <h2 className="text-2xl font-bold text-foreground">Classic Masonry</h2>
            <p className="text-muted-foreground">Tall left column with stacked right images</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="relative grid h-[400px] grid-cols-12 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="relative col-span-5 row-span-2 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Sarah</p>
                  <p className="text-sm text-white/80">Passed in 2 weeks</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative col-span-7 h-48 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialJames} alt="James" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">James</p>
                  <p className="text-sm text-white/80">Intensive Course</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative col-span-7 h-40 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Emma</p>
                  <p className="text-sm text-white/80">Weekly Lessons</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 2: Diagonal Overlap */}
      <section className="border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 2</Badge>
            <h2 className="text-2xl font-bold text-foreground">Diagonal Overlap</h2>
            <p className="text-muted-foreground">Images stacked diagonally with overlapping effect</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="relative h-[420px]">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="absolute left-0 top-0 z-10 w-64 overflow-hidden rounded-2xl shadow-2xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-80 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Sarah</p>
                  <p className="text-sm text-white/80">Passed 1st time!</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="absolute right-8 top-8 z-20 w-56 overflow-hidden rounded-2xl border-4 border-white shadow-2xl"
              >
                <img src={testimonialJames} alt="James" className="h-64 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">James</p>
                  <p className="text-sm text-white/80">Intensive Course</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-0 right-0 z-30 w-48 overflow-hidden rounded-2xl border-4 border-white shadow-2xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-52 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Emma</p>
                  <p className="text-sm text-white/80">Weekly Lessons</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 3: Horizontal Strip */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 3</Badge>
            <h2 className="text-2xl font-bold text-foreground">Horizontal Strip</h2>
            <p className="text-muted-foreground">Three equal images in a horizontal row with captions</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="flex gap-4">
              {[
                { img: testimonialSarah, name: "Sarah", text: "Passed 1st time!" },
                { img: testimonialJames, name: "James", text: "Intensive" },
                { img: testimonialEmma, name: "Emma", text: "Weekly" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex-1 overflow-hidden rounded-2xl shadow-xl"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-white/80">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Option 4: Featured + Grid */}
      <section className="border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 4</Badge>
            <h2 className="text-2xl font-bold text-foreground">Featured + Grid</h2>
            <p className="text-muted-foreground">Large featured image with small grid below</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialSarah} alt="Featured" className="h-64 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="mb-2 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg font-semibold text-white">"Best decision I ever made!"</p>
                  <p className="text-sm text-white/80">— Sarah, Passed in 2 weeks</p>
                </div>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { img: testimonialJames, name: "James", text: "Intensive Course" },
                  { img: testimonialEmma, name: "Emma", text: "Weekly Lessons" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="relative overflow-hidden rounded-xl shadow-lg"
                  >
                    <img src={item.img} alt={item.name} className="h-32 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-white/80">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 5: Staggered Cards */}
      <section className="border-b py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 5</Badge>
            <h2 className="text-2xl font-bold text-foreground">Staggered Cards</h2>
            <p className="text-muted-foreground">Cards at different heights creating depth</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="flex items-end justify-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="relative w-40 -translate-y-8 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialJames} alt="James" className="h-56 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-semibold text-white">James</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative w-48 overflow-hidden rounded-2xl border-4 border-white shadow-2xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-72 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Sarah</p>
                  <p className="text-sm text-white/80">⭐ Featured</p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative w-36 -translate-y-12 overflow-hidden rounded-2xl shadow-xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-48 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-semibold text-white">Emma</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Option 6: Hexagon Mosaic */}
      <section className="border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Option 6</Badge>
            <h2 className="text-2xl font-bold text-foreground">Rounded Mosaic</h2>
            <p className="text-muted-foreground">Mix of rounded shapes creating visual interest</p>
          </div>
          
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <HeroContent />
            
            <div className="relative h-[380px]">
              {/* Large rounded square */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="absolute left-0 top-0 h-64 w-64 overflow-hidden rounded-[2rem] shadow-xl"
              >
                <img src={testimonialSarah} alt="Sarah" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="font-semibold text-white">Sarah</p>
                </div>
              </motion.div>
              
              {/* Circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute right-4 top-4 h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-xl"
              >
                <img src={testimonialJames} alt="James" className="h-full w-full object-cover" />
              </motion.div>
              
              {/* Pill shape */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-0 right-0 h-36 w-56 overflow-hidden rounded-full shadow-xl"
              >
                <img src={testimonialEmma} alt="Emma" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <p className="font-semibold text-white">15k+ Happy Learners</p>
                </div>
              </motion.div>
              
              {/* Small circle accent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-24 left-56 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg"
              >
                <span className="text-lg font-bold text-primary-foreground">98%</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 text-center">
        <p className="text-muted-foreground">Which collage layout do you prefer? Let me know and I'll implement it!</p>
        <Link to="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </section>
    </div>
  );
}
