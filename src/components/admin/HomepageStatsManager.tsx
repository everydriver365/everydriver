import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Save, HelpCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface HomepageStat {
  id: string;
  stat_value: string;
  stat_label: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const POPULAR_ICONS = [
  "Award", "Users", "Clock", "GraduationCap", "Star", "Trophy", "Target", "CheckCircle",
  "Calendar", "Car", "Heart", "ThumbsUp", "Zap", "Shield", "MapPin", "TrendingUp"
];

// Get icon component by name with type safety
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || HelpCircle;
};

export function HomepageStatsManager() {
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('homepage_stats')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load homepage stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const stat of stats) {
        const { error } = await supabase
          .from('homepage_stats')
          .update({
            stat_value: stat.stat_value,
            stat_label: stat.stat_label,
            icon_name: stat.icon_name,
            display_order: stat.display_order,
            is_active: stat.is_active,
          })
          .eq('id', stat.id);

        if (error) throw error;
      }
      toast.success('Homepage stats saved successfully');
    } catch (error) {
      console.error('Error saving stats:', error);
      toast.error('Failed to save homepage stats');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      const newOrder = stats.length > 0 ? Math.max(...stats.map(s => s.display_order)) + 1 : 1;
      const { data, error } = await supabase
        .from('homepage_stats')
        .insert({
          stat_value: 'New',
          stat_label: 'New Stat',
          icon_name: 'Award',
          display_order: newOrder,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setStats([...stats, data]);
      toast.success('Stat added');
    } catch (error) {
      console.error('Error adding stat:', error);
      toast.error('Failed to add stat');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('homepage_stats')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStats(stats.filter(s => s.id !== id));
      toast.success('Stat deleted');
    } catch (error) {
      console.error('Error deleting stat:', error);
      toast.error('Failed to delete stat');
    }
  };

  const updateStat = (id: string, updates: Partial<HomepageStat>) => {
    setStats(stats.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newStats = [...stats];
    [newStats[index - 1], newStats[index]] = [newStats[index], newStats[index - 1]];
    newStats.forEach((s, i) => s.display_order = i + 1);
    setStats(newStats);
  };

  const moveDown = (index: number) => {
    if (index === stats.length - 1) return;
    const newStats = [...stats];
    [newStats[index], newStats[index + 1]] = [newStats[index + 1], newStats[index]];
    newStats.forEach((s, i) => s.display_order = i + 1);
    setStats(newStats);
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
        <p className="text-sm text-muted-foreground">
          Manage the statistics displayed on the homepage (e.g., "15,000+ Students Passed")
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stat
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map((stat, index) => {
          const IconComponent = getIconComponent(stat.icon_name);
          return (
            <Card key={stat.id} className={!stat.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        value={stat.stat_value}
                        onChange={(e) => updateStat(stat.id, { stat_value: e.target.value })}
                        placeholder="15,000+"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={stat.stat_label}
                        onChange={(e) => updateStat(stat.id, { stat_label: e.target.value })}
                        placeholder="Students Passed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={stat.icon_name}
                        onValueChange={(value) => updateStat(stat.id, { icon_name: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_ICONS.map((iconName) => {
                            const Icon = getIconComponent(iconName);
                            return (
                              <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{iconName}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={stat.is_active}
                        onCheckedChange={(checked) => updateStat(stat.id, { is_active: checked })}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(stat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No stats configured. Click "Add Stat" to create one.
        </div>
      )}
    </div>
  );
}
