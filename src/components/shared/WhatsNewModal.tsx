import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  version: string | null;
  created_at: string;
}

interface WhatsNewModalProps {
  portalType: 'instructor' | 'pupil' | 'parent' | 'admin';
  userId?: string;
}

export function WhatsNewModal({ portalType, userId }: WhatsNewModalProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    checkForNewEntries();
  }, [portalType, userId]);

  const checkForNewEntries = async () => {
    const storageKey = `changelog_seen_${portalType}_${userId || 'anon'}`;
    const lastSeen = localStorage.getItem(storageKey);

    let query = supabase
      .from('changelog')
      .select('id, title, description, version, created_at')
      .eq('is_published', true)
      .contains('portal_types', [portalType])
      .order('created_at', { ascending: false })
      .limit(10);

    if (lastSeen) {
      query = query.gt('created_at', lastSeen);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      setEntries(data);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Mark as seen
    const storageKey = `changelog_seen_${portalType}_${userId || 'anon'}`;
    localStorage.setItem(storageKey, new Date().toISOString());
  };

  if (entries.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            What's New
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{entry.title}</h3>
                {entry.version && (
                  <Badge variant="outline" className="text-[10px]">
                    v{entry.version}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          ))}
        </div>
        <Button onClick={handleClose} className="w-full">
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
