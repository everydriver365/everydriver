import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { CMSImageUpload } from './CMSImageUpload';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';

interface IncludedFeature {
  id: string;
  title: string;
  description: string;
  detailed_content: string | null;
  icon_name: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

const POPULAR_ICONS = [
  'BookOpen', 'CreditCard', 'Calendar', 'Award', 'Clock', 'GraduationCap',
  'CheckCircle', 'Shield', 'Star', 'Heart', 'ThumbsUp', 'Zap',
  'Target', 'TrendingUp', 'Phone', 'Mail', 'MessageCircle', 'Car',
];

const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.Star;
};

export function IncludedFeaturesManager() {
  const [features, setFeatures] = useState<IncludedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('included_features')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching included features:', error);
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const feature of features) {
        const { error } = await supabase
          .from('included_features')
          .update({
            title: feature.title,
            description: feature.description,
            detailed_content: feature.detailed_content,
            icon_name: feature.icon_name,
            image_url: feature.image_url,
            display_order: feature.display_order,
            is_active: feature.is_active,
          })
          .eq('id', feature.id);

        if (error) throw error;
      }
      toast.success('Features saved successfully');
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Failed to save features');
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (id: string, updates: Partial<IncludedFeature>) => {
    setFeatures(features.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const index = features.findIndex(f => f.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === features.length - 1)
    ) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newFeatures = [...features];
    const temp = newFeatures[index].display_order;
    newFeatures[index].display_order = newFeatures[swapIndex].display_order;
    newFeatures[swapIndex].display_order = temp;
    [newFeatures[index], newFeatures[swapIndex]] = [newFeatures[swapIndex], newFeatures[index]];
    setFeatures(newFeatures);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">What's Included Features</h3>
          <p className="text-sm text-muted-foreground">
            Edit the 6 feature cards shown in the "What's Included With Every Course" section
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {features.map((feature, index) => {
          const IconComponent = getIconComponent(feature.icon_name);
          return (
            <Card key={feature.id} className={!feature.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-4 space-y-4">
                {/* Header with reorder controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleReorder(feature.id, 'up')}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleReorder(feature.id, 'down')}
                        disabled={index === features.length - 1}
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </Button>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">{feature.title || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feature.is_active}
                      onCheckedChange={(checked) => updateFeature(feature.id, { is_active: checked })}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                </div>

                {/* Image Upload */}
                <CMSImageUpload
                  value={feature.image_url}
                  onChange={(url) => updateFeature(feature.id, { image_url: url })}
                  bucket="instructor-images"
                  folder="included-features"
                  label="Feature Image"
                />

                {/* Icon Picker */}
                <div className="space-y-1">
                  <Label className="text-xs">Icon (fallback if no image)</Label>
                  <Popover 
                    open={iconPickerOpen === feature.id} 
                    onOpenChange={(open) => setIconPickerOpen(open ? feature.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-3">
                        <IconComponent className="h-4 w-4" />
                        <span>{feature.icon_name}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search icons..." />
                        <CommandList>
                          <CommandEmpty>No icon found.</CommandEmpty>
                          <CommandGroup>
                            <div className="grid grid-cols-6 gap-1 p-2">
                              {POPULAR_ICONS.map((iconName) => {
                                const Icon = getIconComponent(iconName);
                                return (
                                  <button
                                    key={iconName}
                                    className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${
                                      feature.icon_name === iconName ? 'bg-accent text-accent-foreground' : ''
                                    }`}
                                    onClick={() => {
                                      updateFeature(feature.id, { icon_name: iconName });
                                      setIconPickerOpen(null);
                                    }}
                                    title={iconName}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={feature.title}
                    onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                    placeholder="Feature title"
                  />
                </div>

                {/* Short Description */}
                <div className="space-y-1">
                  <Label className="text-xs">Short Description</Label>
                  <Textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
                    placeholder="Brief description for the card..."
                    rows={2}
                  />
                </div>

                {/* Detailed Content */}
                <div className="space-y-1">
                  <Label className="text-xs">Detailed Content (Modal Popup)</Label>
                  <Textarea
                    value={feature.detailed_content || ''}
                    onChange={(e) => updateFeature(feature.id, { detailed_content: e.target.value || null })}
                    placeholder="Extended content shown when users tap 'more info'..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
