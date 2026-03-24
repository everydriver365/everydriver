import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuFeatureGate {
  id: string;
  menu_item_key: string;
  menu_item_label: string;
  menu_section: string;
  required_feature: string | null;
  is_locked_for_free: boolean;
  upgrade_message: string | null;
  display_order: number;
}

interface PlanInfo {
  slug: string;
  name: string;
  features: string[];
  display_order: number;
}

// Plan tier order for determining minimum required plan
const PLAN_ORDER = ['free', 'all_in', 'gps', 'single_dashcam'];

export function useMenuFeatureGates() {
  const [gates, setGates] = useState<MenuFeatureGate[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGates = async () => {
    setLoading(true);
    try {
      const [gatesRes, plansRes] = await Promise.all([
        supabase
          .from('menu_feature_gates')
          .select('*')
          .order('display_order'),
        supabase
          .from('subscription_plans')
          .select('slug, name, features, display_order')
          .eq('is_active', true)
          .order('display_order'),
      ]);

      if (gatesRes.error) throw gatesRes.error;
      setGates(gatesRes.data || []);
      setPlans((plansRes.data as PlanInfo[]) || []);
    } catch (error) {
      console.error('Error fetching menu feature gates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGates();
  }, []);

  const isFeatureLocked = (menuItemKey: string, features: string[] | undefined): boolean => {
    const gate = gates.find(g => g.menu_item_key === menuItemKey);
    if (!gate) return false;
    if (!gate.required_feature) return false;
    if (!features || features.length === 0) return gate.is_locked_for_free;
    return !features.includes(gate.required_feature);
  };

  const getMinimumPlanName = (menuItemKey: string): string => {
    const gate = gates.find(g => g.menu_item_key === menuItemKey);
    if (!gate?.required_feature) return 'PRO';
    
    // Find the lowest-tier plan that includes this feature
    const sortedPlans = [...plans].sort((a, b) => {
      const aIdx = PLAN_ORDER.indexOf(a.slug);
      const bIdx = PLAN_ORDER.indexOf(b.slug);
      return aIdx - bIdx;
    });

    for (const plan of sortedPlans) {
      if (plan.features?.includes(gate.required_feature)) {
        return plan.name.toUpperCase();
      }
    }
    return 'PRO';
  };

  const getUpgradeMessage = (menuItemKey: string): string => {
    const gate = gates.find(g => g.menu_item_key === menuItemKey);
    return gate?.upgrade_message || 'Upgrade your plan to access this feature';
  };

  return { gates, loading, isFeatureLocked, getUpgradeMessage, getMinimumPlanName, refetch: fetchGates };
}
