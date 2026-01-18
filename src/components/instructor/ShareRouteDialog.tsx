import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Share2, Copy, Check, Link2 } from "lucide-react";

interface ShareRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  routeName: string;
  isShared?: boolean;
  shareCode?: string | null;
  onUpdated?: () => void;
}

export function ShareRouteDialog({
  open,
  onOpenChange,
  routeId,
  routeName,
  isShared = false,
  shareCode = null,
  onUpdated
}: ShareRouteDialogProps) {
  const [sharing, setSharing] = useState(isShared);
  const [code, setCode] = useState(shareCode);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSharing(isShared);
    setCode(shareCode);
  }, [isShared, shareCode]);

  const generateShareCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleToggleSharing = async (enabled: boolean) => {
    setSaving(true);
    try {
      const newCode = enabled && !code ? generateShareCode() : code;
      
      const { error } = await supabase
        .from("saved_routes")
        .update({
          is_shared: enabled,
          share_code: enabled ? newCode : code,
          shared_at: enabled ? new Date().toISOString() : null
        })
        .eq("id", routeId);

      if (error) throw error;

      setSharing(enabled);
      if (enabled && !code) setCode(newCode);
      
      toast.success(enabled ? "Route is now shared" : "Route is no longer shared");
      onUpdated?.();
    } catch (error) {
      console.error("Error updating share status:", error);
      toast.error("Failed to update sharing");
    } finally {
      setSaving(false);
    }
  };

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-route/${code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareVia = (platform: 'whatsapp' | 'email') => {
    const url = getShareUrl();
    const text = `Check out this driving route: ${routeName}`;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('Driving Route: ' + routeName)}&body=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to view this route
              </p>
            </div>
            <Switch
              checked={sharing}
              onCheckedChange={handleToggleSharing}
              disabled={saving}
            />
          </div>

          {sharing && code && (
            <>
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={getShareUrl()}
                    readOnly
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Share Code</Label>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{code}</code>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareVia('whatsapp')}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => shareVia('email')}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 6-10 7L2 6"/>
                  </svg>
                  Email
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
