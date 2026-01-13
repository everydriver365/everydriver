import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoDark from "@/assets/logo-instructor-dark.png";

interface InstructorMobileHeaderProps {
  instructorName?: string;
  profileImageUrl?: string | null;
}

export function InstructorMobileHeader({ 
  instructorName = "Instructor",
  profileImageUrl
}: InstructorMobileHeaderProps) {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="bg-primary px-4 py-3 flex items-center justify-between">
      {/* Logo on the left */}
      <img 
        src={logoDark} 
        alt="Logo" 
        className="h-7 object-contain"
      />
      
      {/* Avatar and name on the right */}
      <div className="flex items-center gap-3">
        <span className="text-primary-foreground text-sm font-medium">
          {instructorName}
        </span>
        <Avatar className="h-9 w-9 border-2 border-primary-foreground/30">
          <AvatarImage src={profileImageUrl || undefined} alt={instructorName} />
          <AvatarFallback className="bg-primary-foreground text-primary font-semibold text-sm">
            {getInitials(instructorName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
