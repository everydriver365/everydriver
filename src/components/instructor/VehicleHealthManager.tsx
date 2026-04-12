import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Fuel, 
  Wrench, 
  Calendar,
  Plus,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VehicleHealth {
  id: string;
  current_odometer_km: number;
  last_service_date: string | null;
  next_service_due_km: number | null;
  next_service_due_date: string | null;
  fuel_efficiency_avg: number | null;
  notes: string | null;
}

interface MileageEntry {
  id: string;
  date: string;
  start_odometer_km: number;
  end_odometer_km: number;
  distance_km: number;
  fuel_added_liters: number | null;
  fuel_cost: number | null;
  purpose: string | null;
}

interface VehicleHealthManagerProps {
  instructorId: string;
}

const VehicleHealthManager: React.FC<VehicleHealthManagerProps> = ({ instructorId }) => {
  const [vehicleHealth, setVehicleHealth] = useState<VehicleHealth | null>(null);
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMileage, setShowAddMileage] = useState(false);
  const [newEntry, setNewEntry] = useState({
    start_odometer_km: '',
    end_odometer_km: '',
    fuel_added_liters: '',
    fuel_cost: '',
    purpose: ''
  });

  useEffect(() => {
    fetchVehicleData();
  }, [instructorId]);

  const fetchVehicleData = async () => {
    setIsLoading(true);
    try {
      // Fetch or create vehicle health record
      let { data: health } = await supabase
        .from('vehicle_health')
        .select('*')
        .eq('instructor_id', instructorId)
        .maybeSingle();

      if (!health) {
        const { data: newHealth } = await supabase
          .from('vehicle_health')
          .insert({ instructor_id: instructorId })
          .select()
          .single();
        health = newHealth;
      }

      setVehicleHealth(health);

      // Fetch mileage entries
      const { data: entries } = await supabase
        .from('mileage_log')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('date', { ascending: false })
        .limit(10);

      setMileageEntries(entries || []);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMileage = async () => {
    if (!vehicleHealth || !newEntry.start_odometer_km || !newEntry.end_odometer_km) {
      toast.error('Please enter odometer readings');
      return;
    }

    try {
      const startKm = parseFloat(newEntry.start_odometer_km);
      const endKm = parseFloat(newEntry.end_odometer_km);

      await supabase.from('mileage_log').insert({
        instructor_id: instructorId,
        vehicle_health_id: vehicleHealth.id,
        start_odometer_km: startKm,
        end_odometer_km: endKm,
        fuel_added_liters: newEntry.fuel_added_liters ? parseFloat(newEntry.fuel_added_liters) : null,
        fuel_cost: newEntry.fuel_cost ? parseFloat(newEntry.fuel_cost) : null,
        purpose: newEntry.purpose || null
      });

      // Update vehicle health with new odometer
      await supabase
        .from('vehicle_health')
        .update({ current_odometer_km: endKm, updated_at: new Date().toISOString() })
        .eq('id', vehicleHealth.id);

      toast.success('Mileage entry added');
      setShowAddMileage(false);
      setNewEntry({ start_odometer_km: '', end_odometer_km: '', fuel_added_liters: '', fuel_cost: '', purpose: '' });
      fetchVehicleData();
    } catch (error) {
      toast.error('Failed to add mileage entry');
    }
  };

  const serviceProgress = vehicleHealth?.next_service_due_km && vehicleHealth?.current_odometer_km
    ? Math.min(100, (vehicleHealth.current_odometer_km / vehicleHealth.next_service_due_km) * 100)
    : 0;

  const needsService = serviceProgress > 90;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vehicle Health
          </CardTitle>
          <Dialog open={showAddMileage} onOpenChange={setShowAddMileage}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Log Mileage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Mileage Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Odometer (km)</Label>
                    <Input
                      type="number"
                      value={newEntry.start_odometer_km}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, start_odometer_km: e.target.value }))}
                      placeholder={vehicleHealth?.current_odometer_km?.toString() || '0'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Odometer (km)</Label>
                    <Input
                      type="number"
                      value={newEntry.end_odometer_km}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, end_odometer_km: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fuel Added (L)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newEntry.fuel_added_liters}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, fuel_added_liters: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Cost (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newEntry.fuel_cost}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, fuel_cost: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Input
                    value={newEntry.purpose}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Lessons, Test centre run"
                  />
                </div>
                <Button onClick={handleAddMileage} className="w-full">
                  Add Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted/50 rounded-2xl text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{vehicleHealth?.current_odometer_km?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">km total</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-2xl text-center">
            <Fuel className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{vehicleHealth?.fuel_efficiency_avg?.toFixed(1) || '--'}</p>
            <p className="text-xs text-muted-foreground">L/100km</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-2xl text-center">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">
              {vehicleHealth?.last_service_date 
                ? new Date(vehicleHealth.last_service_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                : '--'}
            </p>
            <p className="text-xs text-muted-foreground">last service</p>
          </div>
        </div>

        {/* Service Due */}
        {vehicleHealth?.next_service_due_km && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                Service Due
              </span>
              {needsService ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Due Soon
                </Badge>
              ) : (
                <span className="text-muted-foreground">
                  {(vehicleHealth.next_service_due_km - (vehicleHealth.current_odometer_km || 0)).toLocaleString()} km remaining
                </span>
              )}
            </div>
            <Progress value={serviceProgress} className={needsService ? 'bg-destructive/20' : ''} />
          </div>
        )}

        {/* Recent Mileage */}
        {mileageEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Journeys</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {mileageEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <span>{new Date(entry.date).toLocaleDateString('en-GB')}</span>
                  <span className="text-muted-foreground">{entry.purpose || 'Journey'}</span>
                  <span className="font-medium">{entry.distance_km} km</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleHealthManager;
