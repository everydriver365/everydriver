import { MapPin, Car, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface InstructorCard {
  name: string;
  slug: string | null;
  hourlyRate: number | null;
  distance: number;
  profileImage: string | null;
  transmission: string;
}

interface InstructorChatCardsProps {
  instructors: InstructorCard[];
}

export function InstructorChatCards({ instructors }: InstructorChatCardsProps) {
  if (!instructors.length) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-1 px-1">
      {instructors.map((inst, i) => (
        <motion.a
          key={i}
          href={inst.slug ? `/i/${inst.slug}/courses` : "/courses"}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
          className="flex-shrink-0 w-44 rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/30 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
        >
          {/* Gradient header with avatar */}
          <div className="relative h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 flex items-end justify-center pb-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" />
            <div className="relative -mb-5 z-10">
              {inst.profileImage ? (
                <img
                  src={inst.profileImage}
                  alt={inst.name}
                  className="h-12 w-12 rounded-full object-cover border-[3px] border-background shadow-lg ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg ring-2 ring-primary/20 border-[3px] border-background">
                  {inst.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
          </div>

          <div className="px-3 pt-7 pb-3 space-y-2">
            <p className="text-xs font-bold truncate text-center">{inst.name}</p>

            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3 text-primary/60" />
                <span>{inst.distance} mi</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Car className="h-3 w-3 text-primary/60" />
                <span>{inst.transmission}</span>
              </div>
            </div>

            {inst.hourlyRate && (
              <div className="text-center">
                <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                  £{inst.hourlyRate}/hr
                </span>
              </div>
            )}

            <div className="pt-1">
              <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-primary group-hover:gap-2 transition-all duration-200">
                View Courses
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}

/** Parse a message for embedded instructor cards JSON */
export function parseCardsFromMessage(content: string): {
  text: string;
  cards: InstructorCard[] | null;
} {
  const match = content.match(/<!--CARDS:(\[.*?\])-->/s);
  if (!match) return { text: content, cards: null };

  try {
    const cards = JSON.parse(match[1]) as InstructorCard[];
    const text = content.replace(match[0], "").trim();
    return { text, cards };
  } catch {
    return { text: content, cards: null };
  }
}
