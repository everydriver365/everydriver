import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import logoDark from "@/assets/logo-instructor-dark.png";

interface InstructorMobileHeaderProps {
  instructorName?: string;
  profileImageUrl?: string | null;
}

export function InstructorMobileHeader({ 
  instructorName = "Instructor",
  profileImageUrl
}: InstructorMobileHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Show back button on all pages except the main instructor home
  const showBackButton = location.pathname !== "/instructor";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleBack = () => {
    navigate("/instructor");
  };

  return (
    <div className="bg-primary px-4 py-3 flex items-center justify-between">
      {/* Left side: Back button + Logo */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-primary-foreground hover:bg-primary-foreground/10 -ml-2 h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <img 
          src={logoDark} 
          alt="Logo" 
          className="h-7 object-contain"
        />
      </div>
      
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
