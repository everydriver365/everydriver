import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Car, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  registration: string;
  color_code?: string;
  is_primary: boolean;
}

interface VehicleSelectorProps {
  instructorId: string;
  value?: string;
  onValueChange: (vehicleId: string | undefined) => void;
  className?: string;
  placeholder?: string;
  showNoneOption?: boolean;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  instructorId,
  value,
  onValueChange,
  className,
  placeholder = 'Select vehicle',
  showNoneOption = true,
}) => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['instructor-vehicles', instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_vehicles')
        .select('id, make, model, registration, color_code, is_primary')
        .eq('instructor_id', instructorId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!instructorId,
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder="Loading vehicles..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-none", className)}>
        <AlertCircle className="h-4 w-4" />
        <span>No vehicles configured</span>
      </div>
    );
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onValueChange(val === 'none' ? undefined : val)}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value ? (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>
                {vehicles.find((v) => v.id === value)?.registration || 'Unknown'}
              </span>
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showNoneOption && (
          <SelectItem value="none">
            <span className="text-muted-foreground">No vehicle assigned</span>
          </SelectItem>
        )}
        {vehicles.map((vehicle) => (
          <SelectItem key={vehicle.id} value={vehicle.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: vehicle.color_code || '#3B82F6' }}
              />
              <span className="font-mono">{vehicle.registration}</span>
              <span className="text-muted-foreground">
                {vehicle.make} {vehicle.model}
              </span>
              {vehicle.is_primary && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  Primary
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VehicleSelector;
