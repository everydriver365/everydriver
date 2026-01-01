import { MapPin, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      {/* Hero Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.image || heroImage}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Popular Badge - Top Left */}
        {course.isPopular && (
          <Badge className="absolute left-3 top-3 bg-emerald-500 text-white border-0 gap-1">
            <TrendingUp className="h-3 w-3" />
            Popular
          </Badge>
        )}
        
        {/* Tags - Top Right */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {course.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-primary/90 text-primary-foreground border-0 backdrop-blur-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex">
        {/* Next Available Date - Left Side */}
        <div className="flex flex-col items-center justify-center bg-primary px-4 py-6 text-primary-foreground min-w-[90px]">
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">Next</span>
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">Available</span>
          <span className="mt-1 text-3xl font-bold">{course.nextAvailableDay}</span>
          <span className="text-sm font-medium">{course.nextAvailableMonth}</span>
        </div>

        {/* Course Details - Right Side */}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
          
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{course.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
            {course.description}
          </p>

          {/* Instructor */}
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.instructorImage} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {course.instructor.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Instructor : <span className="font-medium text-foreground">{course.instructor}</span>
            </span>
          </div>

          {/* Price */}
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">£{course.price}</span>
          </div>

          {/* Payment Options */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Pay in 3 or 4 interest-free instalments</span>
            <div className="flex items-center gap-1">
              <span className="rounded bg-[#b2fce4] px-1.5 py-0.5 text-[10px] font-semibold text-[#000]">
                clearpay
              </span>
              <span className="rounded bg-[#ffb3c7] px-1.5 py-0.5 text-[10px] font-semibold text-[#000]">
                Klarna.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
