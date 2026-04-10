import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Link, Check, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DomainLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  domainOrderId: string;
  instructorId: string;
  miniWebsiteSlug?: string | null;
  onSuccess?: () => void;
}

export function DomainLinkModal({
  open,
  onOpenChange,
  domain,
  domainOrderId,
  instructorId,
  miniWebsiteSlug,
  onSuccess,
}: DomainLinkModalProps) {
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState(false);

  const miniWebsiteUrl = miniWebsiteSlug
    ? `${window.location.origin}/i/${miniWebsiteSlug}`
    : null;

  const handleLinkDomain = async () => {
    setIsLinking(true);
    try {
      // Update instructor with custom domain
      const { error: instructorError } = await supabase
        .from("instructors")
        .update({
          custom_domain: domain,
          custom_domain_verified: false,
          mini_website_domain_id: domainOrderId,
        })
        .eq("id", instructorId);

      if (instructorError) throw instructorError;

      // Update domain order to mark as linked
      const { error: domainError } = await supabase
        .from("domain_orders")
        .update({ mini_website_linked: true })
        .eq("id", domainOrderId);

      if (domainError) throw domainError;

      toast.success(`${domain} linked to your mini-website!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error linking domain:", error);
      toast.error("Failed to link domain to mini-website");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Link Domain to Mini-Website
          </DialogTitle>
          <DialogDescription>
            Connect <strong>{domain}</strong> to your instructor mini-website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Domain Info */}
          <div className="rounded-none border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{domain}</p>
                <p className="text-sm text-muted-foreground">Your purchased domain</p>
              </div>
            </div>
          </div>

          {/* Mini-Website Info */}
          {miniWebsiteSlug ? (
            <div className="rounded-none border bg-accent/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-accent/10">
                    <ExternalLink className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Your Mini-Website</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {miniWebsiteUrl}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(miniWebsiteUrl!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-none border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You don't have a mini-website set up yet. Create one first in Settings.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/instructor/settings");
                }}
              >
                Go to Settings
              </Button>
            </div>
          )}

          {/* What happens when you link */}
          <div className="space-y-2">
            <p className="text-sm font-medium">When you link this domain:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span>Your mini-website will be accessible at {domain}</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span>DNS records will be configured automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                <span>Free SSL certificate will be provisioned</span>
              </li>
            </ul>
          </div>

          {/* DNS Note */}
          <div className="rounded-none bg-muted/50 p-3 text-xs text-muted-foreground">
            <strong>Note:</strong> DNS propagation can take up to 48 hours. Your domain may not
            work immediately after linking.
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLinking}
          >
            Skip for Now
          </Button>
          <Button
            className="flex-1"
            onClick={handleLinkDomain}
            disabled={isLinking || !miniWebsiteSlug}
          >
            {isLinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link className="mr-2 h-4 w-4" />
                Link Domain
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
