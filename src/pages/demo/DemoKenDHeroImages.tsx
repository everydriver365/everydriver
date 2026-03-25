import heroOption1 from "@/assets/hero-option-1.jpg";
import heroOption2 from "@/assets/hero-option-2.jpg";
import heroOption3 from "@/assets/hero-option-3.jpg";
import currentHero from "@/assets/frontpagesquare-4.png";
import earlyTestBadge from "@/assets/free-retest-badge.png";
import { Star, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const PRIMARY_COLOR = "#0075c9";

const HeroPreview = ({ image, label, description }: { image: string; label: string; description: string }) => (
  <div className="mb-16">
    <div className="mb-4 text-center">
      <span className="inline-block bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-sm mb-2">{label}</span>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <section style={{ backgroundColor: '#e9f4f9' }} className="rounded-2xl overflow-hidden shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <img
              src={image}
              alt="Hero option"
              className="w-full h-[300px] sm:h-[420px] object-cover rounded-2xl sm:rounded-3xl shadow-xl"
            />
            <img
              src={earlyTestBadge}
              alt="Earlier Test Guaranteed"
              className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-20 h-20 sm:w-36 sm:h-36 object-contain drop-shadow-lg"
            />
          </motion.div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="font-bold text-muted-foreground">5.0 (47 reviews)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              Learn to Drive in Winchester, Southampton and Portsmouth
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg">
              Book direct and pass, weekly or intensive driving courses in Winchester, Southampton &amp; Portsmouth
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Your postcode" className="pl-10 h-12 rounded-full border-border shadow-sm" />
              </div>
              <Button size="lg" className="h-12 px-8 rounded-full font-bold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
                Find Lessons
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default function DemoKenDHeroImages() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Ken-D Hero Image Options</h1>
          <p className="text-muted-foreground">Compare the current hero with 3 new options</p>
        </div>

        <HeroPreview
          image={currentHero}
          label="Current"
          description="The existing hero image — woman with steering wheel on turquoise background"
        />

        <HeroPreview
          image={heroOption1}
          label="Option A"
          description="Confident learner behind the wheel — warm, professional, natural lighting"
        />

        <HeroPreview
          image={heroOption2}
          label="Option B"
          description="Happy learner with L-plate car — British residential street, energetic and fun"
        />

        <HeroPreview
          image={heroOption3}
          label="Option C"
          description="Aerial countryside driving — scenic, aspirational, motion and freedom"
        />
      </div>
    </div>
  );
}
