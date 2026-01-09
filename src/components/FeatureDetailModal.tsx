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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconComponent className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">{feature.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Short description */}
          <p className="text-muted-foreground mb-4">{feature.description}</p>

          {/* Detailed content - render paragraphs */}
          {feature.detailed_content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {feature.detailed_content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-foreground leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              More detailed information coming soon.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
