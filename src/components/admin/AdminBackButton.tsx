import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface AdminBackButtonProps {
  onClick: () => void;
}

export function AdminBackButton({ onClick }: AdminBackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2 mb-4"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to Admin
    </Button>
  );
}
