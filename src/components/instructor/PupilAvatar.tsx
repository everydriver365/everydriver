import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PupilAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PupilAvatar({ name, imageUrl, size = "md", className }: PupilAvatarProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      {imageUrl && !imageError ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name} 
          onError={() => setImageError(true)}
        />
      ) : null}
      <AvatarFallback className="text-white font-semibold" style={{ backgroundColor: '#1877F2' }}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
