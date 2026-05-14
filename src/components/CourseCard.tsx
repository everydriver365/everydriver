import { useState } from "react";
import { MapPin, Clock, TrendingUp, Star, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroImage from "@/assets/hero-driving.jpg";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    instructor: string;
    instructorImage?: string;
    price: number;
    location: string;
    duration: string;
    description: string;
    nextAvailableDay: string;
    nextAvailableMonth: string;
    tags: string[];
    isPopular?: boolean;
    image?: string;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group h-[420px] cursor-pointer [perspective:1000px] transition-transform duration-300 hover:-translate-y-2"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 overflow-hidden border border-border/50 bg-card shadow-lg shadow-black/10 [backface-visibility:hidden] transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/15">
          {/* Hero Image Section */}
          <div className="relative h-44 overflow-hidden bg-muted">
            <img
              src={course.image || heroImage}
              alt={course.title}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            
            {course.isPopular && (
              <Badge className="absolute left-3 top-3 border-0 bg-emerald-500 text-white gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular
              </Badge>
            )}
            
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              {course.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="border-0 bg-primary/90 text-primary-foreground backdrop-blur-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex h-[calc(100%-11rem)]">
            <div className="flex flex-col items-center justify-center bg-accent px-3 py-4 text-accent-foreground min-w-[80px]">
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Next</span>
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">Available</span>
              <span className="mt-1 text-2xl font-bold">{course.nextAvailableDay}</span>
              <span className="text-xs font-medium">{course.nextAvailableMonth}</span>
            </div>

            <div className="flex-1 p-3">
              <h3 className="text-base font-bold text-foreground line-clamp-2">{course.title}</h3>
              
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{course.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{course.duration}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={course.instructorImage} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {course.instructor.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {course.instructor}
                </span>
              </div>

              <div className="mt-2">
                <span className="text-xl font-bold text-foreground">£{course.price}</span>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded-md bg-[#b2fce4] px-1 py-0.5 font-semibold text-[#000]">
                  clearpay
                </span>
                <span className="rounded-md bg-[#ffb3c7] px-1 py-0.5 font-semibold text-[#000]">
                  Klarna.
                </span>
              </div>
            </div>
          </div>

          {/* Flip hint */}
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Click to view details →
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 overflow-hidden border border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-black/10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-full flex-col p-5">
            <h3 className="text-lg font-bold text-primary-foreground">{course.title}</h3>
            
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={course.instructorImage} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {course.instructor.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-primary-foreground">{course.instructor}</div>
                <div className="flex items-center gap-1 text-xs text-primary-foreground/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>4.9 (127 reviews)</span>
                </div>
              </div>
            </div>

            <p className="mt-4 flex-1 text-sm text-primary-foreground/80">
              {course.description}
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Free re-test if needed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Theory test support included</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Pick-up from home/work</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-4">
              <div>
                <span className="text-2xl font-bold text-primary-foreground">£{course.price}</span>
                <div className="text-xs text-primary-foreground/70">or from £{Math.round(course.price / 4)}/month</div>
              </div>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle booking
                }}
              >
                Learn More
              </Button>
            </div>

            <div className="mt-2 text-center text-[10px] text-primary-foreground/60">
              ← Click to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
