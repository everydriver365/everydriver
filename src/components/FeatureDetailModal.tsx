import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeatureData } from "@/hooks/useHomepageFeatures";

interface FeatureDetailModalProps {
  feature: FeatureData | null;
  open: boolean;
  onClose: () => void;
}

export function FeatureDetailModal({ feature, open, onClose }: FeatureDetailModalProps) {
  if (!feature) return null;

  const IconComponent = feature.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <IconComponent className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base">{feature.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div>
          <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>

          {feature.detailed_content ? (
            <div className="text-sm leading-relaxed text-foreground space-y-2">
              {feature.detailed_content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              More details coming soon.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
