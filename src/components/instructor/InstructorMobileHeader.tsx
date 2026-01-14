import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logoDark from "@/assets/logo-instructor-dark.png";

interface InstructorMobileHeaderProps {
  instructorName?: string;
  profileImageUrl?: string | null;
  isActive?: boolean;
}

export function InstructorMobileHeader({ 
  instructorName = "Instructor",
  profileImageUrl,
  isActive
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
    <div className="sticky top-0 z-40 bg-nav px-4 py-3 flex items-center justify-between border-b border-nav-foreground/10">
      {/* Left side: Back button + Logo */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-nav-foreground hover:bg-nav-foreground/10 -ml-2 h-8 w-8"
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
      
      {/* Name, visibility badge, and avatar on the right */}
      <div className="flex items-center gap-2">
        <span className="text-nav-foreground text-sm font-medium">
          {instructorName}
        </span>
        {isActive !== undefined && (
          <Badge 
            variant="secondary" 
            className={`gap-1 text-xs ${isActive ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"}`}
          >
            {isActive ? (
              <>
                <Eye className="h-3 w-3" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Hidden
              </>
            )}
          </Badge>
        )}
        <Avatar className="h-9 w-9 border-2 border-nav-foreground/30">
          <AvatarImage src={profileImageUrl || undefined} alt={instructorName} />
          <AvatarFallback className="bg-nav-foreground text-nav font-semibold text-sm">
            {getInitials(instructorName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
