import { MapPin, Car } from "lucide-react";

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
    <div className="flex gap-2 overflow-x-auto pb-1 pt-2 scrollbar-hide">
      {instructors.map((inst, i) => (
        <a
          key={i}
          href={inst.slug ? `/i/${inst.slug}/courses` : "/courses"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-40 rounded-xl border border-border/60 bg-background shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
        >
          {/* Avatar / header */}
          <div className="h-12 bg-primary/10 flex items-center justify-center">
            {inst.profileImage ? (
              <img
                src={inst.profileImage}
                alt={inst.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-background"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {inst.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
          </div>

          <div className="p-2 space-y-1">
            <p className="text-xs font-semibold truncate">{inst.name}</p>

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{inst.distance} mi</span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Car className="h-3 w-3" />
              <span>{inst.transmission}</span>
            </div>

            {inst.hourlyRate && (
              <p className="text-xs font-semibold text-primary">£{inst.hourlyRate}/hr</p>
            )}

            <div className="pt-1">
              <span className="block text-center text-[10px] font-medium text-primary group-hover:underline">
                View Courses →
              </span>
            </div>
          </div>
        </a>
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
