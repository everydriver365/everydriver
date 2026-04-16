import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CalendarColors {
  lesson: string;
  lesson_unpaid: string;
  block_personal: string;
  block_break: string;
  block_meeting: string;
  external: string;
}

export const DEFAULT_CALENDAR_COLORS: CalendarColors = {
  lesson: '#10b981',
  lesson_unpaid: '#ef4444',
  block_personal: '#1e3a5f',
  block_break: '#f59e0b',
  block_meeting: '#8b5cf6',
  external: '#1e3a5f',
};

interface CalendarColorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  colors: CalendarColors;
  onColorsChange: (colors: CalendarColors) => void;
}

const COLOR_PRESETS = [
  '#10b981', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
  '#2A394F', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#6b7280',
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="w-10 h-10 rounded-2xl border-2 border-border shadow-sm cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: value }}
          onClick={() => setShowPresets(!showPresets)}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {showPresets && (
        <div className="grid grid-cols-6 gap-1.5 p-2 bg-muted rounded-2xl">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-7 h-7 rounded-2xl border border-border/50 hover:scale-110 transition-transform relative"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setShowPresets(false);
              }}
            >
              {value === color && (
                <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CalendarColorSettings({ 
  open, 
  onOpenChange, 
  instructorId, 
  colors,
  onColorsChange 
}: CalendarColorSettingsProps) {
  const [localColors, setLocalColors] = useState<CalendarColors>(colors);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const colorsJson = JSON.parse(JSON.stringify(localColors));
      const { error } = await supabase
        .from('instructors')
        .update({ calendar_colors: colorsJson })
        .eq('id', instructorId);

      if (error) throw error;

      onColorsChange(localColors);
      toast.success('Calendar colors saved');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error('Failed to save colors');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalColors(DEFAULT_CALENDAR_COLORS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Calendar Colors
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Lessons</h3>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Paid Lessons"
                value={localColors.lesson}
                onChange={(v) => setLocalColors({ ...localColors, lesson: v })}
              />
              <ColorPicker
                label="Unpaid Lessons"
                value={localColors.lesson_unpaid}
                onChange={(v) => setLocalColors({ ...localColors, lesson_unpaid: v })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Blocked Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Personal"
                value={localColors.block_personal}
                onChange={(v) => setLocalColors({ ...localColors, block_personal: v })}
              />
              <ColorPicker
                label="Break"
                value={localColors.block_break}
                onChange={(v) => setLocalColors({ ...localColors, block_break: v })}
              />
              <ColorPicker
                label="Meeting"
                value={localColors.block_meeting}
                onChange={(v) => setLocalColors({ ...localColors, block_meeting: v })}
              />
              <ColorPicker
                label="External Calendar"
                value={localColors.external}
                onChange={(v) => setLocalColors({ ...localColors, external: v })}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Preview</h3>
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.lesson }}
              >
                Paid Lesson
              </div>
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.lesson_unpaid }}
              >
                Unpaid Lesson
              </div>
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.block_personal }}
              >
                Personal
              </div>
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.block_break }}
              >
                Break
              </div>
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.block_meeting }}
              >
                Meeting
              </div>
              <div 
                className="p-2 rounded-2xl text-white text-xs font-medium text-center"
                style={{ backgroundColor: localColors.external }}
              >
                External
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="sm:mr-auto">
            Reset to Default
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Colors'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
