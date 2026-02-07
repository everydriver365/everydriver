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

export function useMenuFeatureGates() {
  const [gates, setGates] = useState<MenuFeatureGate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_feature_gates')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setGates(data || []);
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

  const getUpgradeMessage = (menuItemKey: string): string => {
    const gate = gates.find(g => g.menu_item_key === menuItemKey);
    return gate?.upgrade_message || 'Upgrade your plan to access this feature';
  };

  return { gates, loading, isFeatureLocked, getUpgradeMessage, refetch: fetchGates };
}
