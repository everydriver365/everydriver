import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Gift,
  Star,
  Ticket,
  ShoppingBag,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RedeemPointsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pupilId: string;
  instructorId: string;
  currentPoints: number;
  brandColour?: string;
}

interface RewardOption {
  id: string;
  type: 'free_lesson' | 'discount' | 'merchandise';
  title: string;
  description: string;
  pointsCost: number;
  value: number;
  icon: React.ElementType;
}

const rewardOptions: RewardOption[] = [
  {
    id: 'free_lesson',
    type: 'free_lesson',
    title: 'Free 1-Hour Lesson',
    description: 'Redeem for a complimentary driving lesson',
    pointsCost: 500,
    value: 40,
    icon: Star,
  },
  {
    id: 'discount_10',
    type: 'discount',
    title: '£10 Off Next Lesson',
    description: 'Get £10 discount on your next booking',
    pointsCost: 200,
    value: 10,
    icon: Ticket,
  },
  {
    id: 'discount_25',
    type: 'discount',
    title: '£25 Off Package',
    description: 'Save £25 on a lesson package',
    pointsCost: 400,
    value: 25,
    icon: Ticket,
  },
  {
    id: 'merchandise',
    type: 'merchandise',
    title: 'EveryDriver Merch',
    description: 'Branded keyring, air freshener, or sticker',
    pointsCost: 100,
    value: 5,
    icon: ShoppingBag,
  },
];

const RedeemPointsSheet: React.FC<RedeemPointsSheetProps> = ({
  open,
  onOpenChange,
  pupilId,
  instructorId,
  currentPoints,
  brandColour = '#3B82F6',
}) => {
  const [selectedReward, setSelectedReward] = useState<RewardOption | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const queryClient = useQueryClient();

  const redeemMutation = useMutation({
    mutationFn: async (reward: RewardOption) => {
      // Create redemption request
      const { error } = await supabase.from('reward_redemptions').insert({
        pupil_id: pupilId,
        instructor_id: instructorId,
        points_spent: reward.pointsCost,
        reward_type: reward.type,
        reward_value: reward.value,
        status: 'pending',
        notes: notes || null,
      });

      if (error) throw error;

      // Deduct points from pupil
      const { error: updateError } = await supabase
        .from('pupils')
        .update({ reward_points: currentPoints - reward.pointsCost })
        .eq('id', pupilId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pupil'] });
      queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
      toast({
        title: 'Reward Requested!',
        description: 'Your instructor will process your reward soon.',
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Redemption Failed',
        description: error.message || 'Unable to redeem points.',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setSelectedReward(null);
    setNotes('');
    setStep('select');
    onOpenChange(false);
  };

  const handleSelectReward = (reward: RewardOption) => {
    if (currentPoints >= reward.pointsCost) {
      setSelectedReward(reward);
      setStep('confirm');
    }
  };

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      redeemMutation.mutate(selectedReward);
    }
  };

  const affordableRewards = rewardOptions.filter((r) => currentPoints >= r.pointsCost);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" style={{ color: brandColour }} />
            Redeem Points
          </SheetTitle>
          <SheetDescription>
            You have{' '}
            <span className="font-bold" style={{ color: brandColour }}>
              {currentPoints}
            </span>{' '}
            points to redeem
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {step === 'select' && (
            <>
              {/* Reward Options */}
              <div className="space-y-3">
                {rewardOptions.map((reward) => {
                  const canAfford = currentPoints >= reward.pointsCost;
                  const Icon = reward.icon;

                  return (
                    <Card
                      key={reward.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        canAfford
                          ? "hover:border-primary hover:shadow-sm"
                          : "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleSelectReward(reward)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${brandColour}15` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: brandColour }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm">{reward.title}</h4>
                              <Badge
                                variant={canAfford ? "default" : "secondary"}
                                className="shrink-0"
                                style={canAfford ? { backgroundColor: brandColour } : {}}
                              >
                                {reward.pointsCost} pts
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {reward.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {affordableRewards.length === 0 && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Keep earning points! You need at least 100 to redeem a reward.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'confirm' && selectedReward && (
            <div className="space-y-4">
              {/* Selected Reward Summary */}
              <Card className="border-2" style={{ borderColor: brandColour }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${brandColour}15` }}
                    >
                      <selectedReward.icon
                        className="h-6 w-6"
                        style={{ color: brandColour }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium">{selectedReward.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedReward.pointsCost} points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Points Balance Preview */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Points after redemption</span>
                <span className="font-bold">
                  {currentPoints - selectedReward.pointsCost} pts
                </span>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('select')}
                  disabled={redeemMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmRedeem}
                  disabled={redeemMutation.isPending}
                  style={{ backgroundColor: brandColour }}
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RedeemPointsSheet;
