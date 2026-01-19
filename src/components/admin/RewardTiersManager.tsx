import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Save, 
  GripVertical,
  Sparkles,
  Gift,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RewardTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  min_points: number;
  perks: string[];
  badge_image_url: string | null;
  display_order: number;
}

const defaultEmojis = ['🌟', '🥉', '🥈', '🥇', '💎', '👑', '🏆', '⭐', '🎯', '🚀', '🔥', '💪'];
const defaultColors = ['#94A3B8', '#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2', '#9333EA', '#EF4444', '#22C55E', '#3B82F6', '#EC4899'];

const RewardTiersManager: React.FC = () => {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPerk, setNewPerk] = useState('');

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from('reward_tiers')
      .select('*')
      .order('display_order');

    if (!error && data) {
      const parsedTiers = data.map(tier => ({
        ...tier,
        perks: typeof tier.perks === 'string' ? JSON.parse(tier.perks) : tier.perks || []
      }));
      setTiers(parsedTiers);
    }
    setLoading(false);
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;
    setSaving(true);

    const tierData = {
      name: editingTier.name,
      icon: editingTier.icon,
      color: editingTier.color,
      min_points: editingTier.min_points,
      perks: editingTier.perks,
      badge_image_url: editingTier.badge_image_url,
      display_order: editingTier.display_order
    };

    if (editingTier.id.startsWith('new-')) {
      // Create new tier
      const { error } = await supabase
        .from('reward_tiers')
        .insert(tierData);

      if (error) {
        toast.error('Failed to create tier');
        console.error(error);
      } else {
        toast.success('Tier created successfully');
        fetchTiers();
      }
    } else {
      // Update existing tier
      const { error } = await supabase
        .from('reward_tiers')
        .update(tierData)
        .eq('id', editingTier.id);

      if (error) {
        toast.error('Failed to update tier');
        console.error(error);
      } else {
        toast.success('Tier updated successfully');
        fetchTiers();
      }
    }

    setSaving(false);
    setIsDialogOpen(false);
    setEditingTier(null);
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;

    const { error } = await supabase
      .from('reward_tiers')
      .delete()
      .eq('id', tierId);

    if (error) {
      toast.error('Failed to delete tier');
      console.error(error);
    } else {
      toast.success('Tier deleted');
      fetchTiers();
    }
  };

  const handleReorder = async (newOrder: RewardTier[]) => {
    setTiers(newOrder);

    // Update display_order for all tiers
    const updates = newOrder.map((tier, index) => ({
      id: tier.id,
      display_order: index + 1
    }));

    for (const update of updates) {
      await supabase
        .from('reward_tiers')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  };

  const addNewTier = () => {
    const newTier: RewardTier = {
      id: `new-${Date.now()}`,
      name: 'New Tier',
      icon: '🏆',
      color: '#FFD700',
      min_points: (tiers[tiers.length - 1]?.min_points || 0) + 500,
      perks: ['New perk 1'],
      badge_image_url: null,
      display_order: tiers.length + 1
    };
    setEditingTier(newTier);
    setIsDialogOpen(true);
  };

  const addPerk = () => {
    if (!editingTier || !newPerk.trim()) return;
    setEditingTier({
      ...editingTier,
      perks: [...editingTier.perks, newPerk.trim()]
    });
    setNewPerk('');
  };

  const removePerk = (index: number) => {
    if (!editingTier) return;
    setEditingTier({
      ...editingTier,
      perks: editingTier.perks.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Reward Tiers
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure badge tiers and perks that pupils unlock as they earn points
          </p>
        </div>
        <Button onClick={addNewTier} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tier
        </Button>
      </div>

      {/* Tiers List */}
      <Reorder.Group values={tiers} onReorder={handleReorder} className="space-y-3">
        {tiers.map((tier) => (
          <Reorder.Item key={tier.id} value={tier}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              
              {/* Badge Preview */}
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${tier.color}20`, borderColor: tier.color, borderWidth: 2 }}
              >
                {tier.icon}
              </div>

              {/* Tier Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{tier.name}</h4>
                  <Badge variant="outline" style={{ borderColor: tier.color, color: tier.color }}>
                    {tier.min_points.toLocaleString()} pts
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tier.perks.slice(0, 2).map((perk, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {perk}
                    </Badge>
                  ))}
                  {tier.perks.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tier.perks.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingTier(tier);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTier(tier.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTier?.id.startsWith('new-') ? (
                <>
                  <Plus className="h-5 w-5" />
                  Create New Tier
                </>
              ) : (
                <>
                  <Edit2 className="h-5 w-5" />
                  Edit Tier
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {editingTier && (
            <div className="space-y-6 py-4">
              {/* Preview */}
              <div className="flex justify-center">
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl border-4"
                  style={{ 
                    backgroundColor: `${editingTier.color}20`, 
                    borderColor: editingTier.color 
                  }}
                >
                  {editingTier.icon}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>Tier Name</Label>
                <Input
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  placeholder="e.g., Gold Driver"
                />
              </div>

              {/* Icon Selector */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {defaultEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setEditingTier({ ...editingTier, icon: emoji })}
                      className={`w-10 h-10 rounded-lg text-xl border-2 transition-all ${
                        editingTier.icon === emoji 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditingTier({ ...editingTier, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        editingTier.color === color 
                          ? 'ring-2 ring-offset-2 ring-primary' 
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={editingTier.color}
                  onChange={(e) => setEditingTier({ ...editingTier, color: e.target.value })}
                  className="w-full h-10"
                />
              </div>

              {/* Points Required */}
              <div className="space-y-2">
                <Label>Points Required</Label>
                <Input
                  type="number"
                  value={editingTier.min_points}
                  onChange={(e) => setEditingTier({ ...editingTier, min_points: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>

              {/* Perks */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Perks & Benefits
                </Label>
                <div className="space-y-2">
                  {editingTier.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={perk}
                        onChange={(e) => {
                          const newPerks = [...editingTier.perks];
                          newPerks[index] = e.target.value;
                          setEditingTier({ ...editingTier, perks: newPerks });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePerk(index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPerk}
                      onChange={(e) => setNewPerk(e.target.value)}
                      placeholder="Add a new perk..."
                      onKeyPress={(e) => e.key === 'Enter' && addPerk()}
                    />
                    <Button variant="outline" size="icon" onClick={addPerk}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingTier(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSaveTier}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Tier'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium">How Tiers Work</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Pupils automatically unlock tiers as they earn DriveCoins. Higher tiers offer better perks 
                and exclusive benefits. Drag tiers to reorder them. The points required should increase 
                with each tier.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardTiersManager;
