import { Clock, GraduationCap, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface CourseCard {
  courseName: string;
  courseHours: number;
  price: number | null;
  instructorName: string;
  instructorSlug: string | null;
  isIntensive: boolean;
  isPopular: boolean;
}

interface CourseChatCardsProps {
  courses: CourseCard[];
}

export function CourseChatCards({ courses }: CourseChatCardsProps) {
  if (!courses.length) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-2 scrollbar-hide -mx-1 px-1">
      {courses.map((course, i) => (
        <motion.a
          key={i}
          href={course.instructorSlug ? `/i/${course.instructorSlug}/courses` : "/courses"}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
          className="flex-shrink-0 w-44 rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/30 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
        >
          {/* Gradient header */}
          <div className="relative h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.15),transparent_70%)]" />
            <div className="relative z-10 flex items-center gap-1.5">
              {course.isIntensive ? (
                <Zap className="h-5 w-5 text-primary" />
              ) : (
                <GraduationCap className="h-5 w-5 text-primary" />
              )}
              {course.isPopular && (
                <span className="text-[9px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  Popular
                </span>
              )}
            </div>
          </div>

          <div className="px-3 pt-3 pb-3 space-y-2">
            <p className="text-xs font-bold truncate text-center">{course.courseName}</p>

            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3 text-primary/60" />
                <span>{course.courseHours} hrs</span>
              </div>
              {course.isIntensive && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Zap className="h-3 w-3 text-primary/60" />
                  <span>Intensive</span>
                </div>
              )}
            </div>

            {course.price && (
              <div className="text-center">
                <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                  £{course.price}
                </span>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center truncate">
              with {course.instructorName}
            </p>

            <div className="pt-1">
              <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-primary group-hover:gap-2 transition-all duration-200">
                View & Book
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}

/** Parse a message for embedded course cards JSON */
export function parseCourseCardsFromMessage(content: string): {
  text: string;
  courseCards: CourseCard[] | null;
} {
  const match = content.match(/<!--COURSES:(\[.*?\])-->/s);
  if (!match) return { text: content, courseCards: null };

  try {
    const courseCards = JSON.parse(match[1]) as CourseCard[];
    const text = content.replace(match[0], "").trim();
    return { text, courseCards };
  } catch {
    return { text: content, courseCards: null };
  }
}
