import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Save, 
  Gift,
  Calculator,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RewardSettings {
  points_per_lesson: number;
  points_for_free_lesson: number;
  lessons_for_free_lesson: number;
}

const LoyaltyRewardsManager: React.FC = () => {
  const [settings, setSettings] = useState<RewardSettings>({
    points_per_lesson: 10,
    points_for_free_lesson: 100,
    lessons_for_free_lesson: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['points_per_lesson', 'points_for_free_lesson', 'lessons_for_free_lesson']);

      if (!error && data) {
        const settingsMap: Record<string, string> = {};
        data.forEach(s => {
          settingsMap[s.setting_key] = s.setting_value || '';
        });

        setSettings({
          points_per_lesson: parseInt(settingsMap.points_per_lesson) || 10,
          points_for_free_lesson: parseInt(settingsMap.points_for_free_lesson) || 100,
          lessons_for_free_lesson: parseInt(settingsMap.lessons_for_free_lesson) || 10
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'points_per_lesson', value: String(settings.points_per_lesson) },
        { key: 'points_for_free_lesson', value: String(settings.points_for_free_lesson) },
        { key: 'lessons_for_free_lesson', value: String(settings.lessons_for_free_lesson) }
      ];

      for (const update of updates) {
        await supabase
          .from('site_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast.success('Rewards settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Calculate example scenarios
  const lessonsForFree = Math.ceil(settings.points_for_free_lesson / settings.points_per_lesson);

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Coins className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Points Per Lesson</Label>
                  <p className="text-xs text-muted-foreground">Earned on completion</p>
                </div>
              </div>
              <Input
                type="number"
                value={settings.points_per_lesson}
                onChange={(e) => setSettings({ ...settings, points_per_lesson: parseInt(e.target.value) || 0 })}
                min={1}
                className="text-2xl font-bold h-14 text-center"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Gift className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Points for Free Lesson</Label>
                  <p className="text-xs text-muted-foreground">Redemption threshold</p>
                </div>
              </div>
              <Input
                type="number"
                value={settings.points_for_free_lesson}
                onChange={(e) => setSettings({ ...settings, points_for_free_lesson: parseInt(e.target.value) || 0 })}
                min={1}
                className="text-2xl font-bold h-14 text-center"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Lessons for Free</Label>
                  <p className="text-xs text-muted-foreground">Alternative method</p>
                </div>
              </div>
              <Input
                type="number"
                value={settings.lessons_for_free_lesson}
                onChange={(e) => setSettings({ ...settings, lessons_for_free_lesson: parseInt(e.target.value) || 0 })}
                min={1}
                className="text-2xl font-bold h-14 text-center"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Example Calculations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Example Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">After 1 lesson</p>
                <p className="text-lg font-semibold">{settings.points_per_lesson} points earned</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">After 5 lessons</p>
                <p className="text-lg font-semibold">{settings.points_per_lesson * 5} points earned</p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <p className="text-sm text-muted-foreground">Free lesson unlocked after</p>
                <p className="text-lg font-semibold text-green-600">{lessonsForFree} lessons</p>
                <Badge variant="secondary" className="mt-1">
                  {settings.points_for_free_lesson} points
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">How the Rewards System Works</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Pupils earn <strong>{settings.points_per_lesson} DriveCoins</strong> for each completed lesson</li>
                  <li>• When they reach <strong>{settings.points_for_free_lesson} points</strong>, they can redeem a free lesson</li>
                  <li>• Alternatively, after <strong>{settings.lessons_for_free_lesson} lessons</strong>, they get one free</li>
                  <li>• Points are tracked automatically and displayed in the pupil portal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default LoyaltyRewardsManager;
