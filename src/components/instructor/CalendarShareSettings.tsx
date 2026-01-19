import { useState, useEffect } from 'react';
import { Share2, Copy, Check, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarShareSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  instructorName?: string;
}

interface ShareSettings {
  id: string;
  share_token: string;
  is_enabled: boolean;
  show_lesson_details: boolean;
  show_blocks: boolean;
  show_external_events: boolean;
  title: string | null;
  description: string | null;
}

export function CalendarShareSettings({
  open,
  onOpenChange,
  instructorId,
  instructorName,
}: CalendarShareSettingsProps) {
  const [settings, setSettings] = useState<ShareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const shareUrl = settings?.share_token 
    ? `${window.location.origin}/availability/${settings.share_token}`
    : '';

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open, instructorId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('instructor_calendar_shares')
        .select('*')
        .eq('instructor_id', instructorId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as ShareSettings);
      } else {
        // Create new share settings
        await createShareSettings();
      }
    } catch (error) {
      console.error('Error fetching share settings:', error);
      toast.error('Failed to load share settings');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = (): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createShareSettings = async () => {
    const token = generateToken();
    const { data, error } = await supabase
      .from('instructor_calendar_shares')
      .insert({
        instructor_id: instructorId,
        share_token: token,
        is_enabled: false,
        title: instructorName ? `${instructorName}'s Availability` : 'My Availability',
      })
      .select()
      .single();

    if (error) throw error;
    setSettings(data as ShareSettings);
  };

  const updateSettings = async (updates: Partial<ShareSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('instructor_calendar_shares')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const regenerateToken = async () => {
    if (!settings) return;

    setRegenerating(true);
    try {
      const newToken = generateToken();
      const { error } = await supabase
        .from('instructor_calendar_shares')
        .update({ share_token: newToken })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, share_token: newToken });
      toast.success('New link generated');
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error('Failed to generate new link');
    } finally {
      setRegenerating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openPreview = () => {
    window.open(shareUrl, '_blank');
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Availability
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Sharing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Public Link</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view your calendar
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
              disabled={saving}
            />
          </div>

          {settings?.is_enabled && (
            <>
              <Separator />

              {/* Share Link */}
              <div className="space-y-2">
                <Label>Your Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    title="Copy link"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openPreview}
                    title="Preview"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerateToken}
                  disabled={regenerating}
                  className="text-muted-foreground"
                >
                  {regenerating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Generate new link
                </Button>
              </div>

              <Separator />

              {/* Privacy Options */}
              <div className="space-y-4">
                <Label className="text-base">Privacy Options</Label>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Show lesson details</Label>
                    <p className="text-xs text-muted-foreground">
                      Show pupil names instead of just "Busy"
                    </p>
                  </div>
                  <Switch
                    checked={settings?.show_lesson_details || false}
                    onCheckedChange={(checked) => updateSettings({ show_lesson_details: checked })}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Show blocked time</Label>
                    <p className="text-xs text-muted-foreground">
                      Include personal blocks in the view
                    </p>
                  </div>
                  <Switch
                    checked={settings?.show_blocks || false}
                    onCheckedChange={(checked) => updateSettings({ show_blocks: checked })}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-normal">Show external calendar</Label>
                    <p className="text-xs text-muted-foreground">
                      Include synced Google Calendar events
                    </p>
                  </div>
                  <Switch
                    checked={settings?.show_external_events || false}
                    onCheckedChange={(checked) => updateSettings({ show_external_events: checked })}
                    disabled={saving}
                  />
                </div>
              </div>

              <Separator />

              {/* Custom Title */}
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={settings?.title || ''}
                  onChange={(e) => setSettings(s => s ? { ...s, title: e.target.value } : null)}
                  onBlur={() => settings?.title && updateSettings({ title: settings.title })}
                  placeholder="My Availability"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
