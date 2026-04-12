import { useState, useEffect, useMemo } from "react";
import { Loader2, MapPin, Check, ChevronsUpDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  pass_rate: number | null;
}

interface InstructorTestCentresManagerProps {
  instructorId: string;
}

export function InstructorTestCentresManager({ instructorId }: InstructorTestCentresManagerProps) {
  const [testCentres, setTestCentres] = useState<TestCentre[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchData();
  }, [instructorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all active test centres
      const { data: centresData, error: centresError } = await supabase
        .from("test_centres")
        .select("id, name, address, postcode, pass_rate")
        .eq("is_active", true)
        .order("name");

      if (centresError) throw centresError;
      setTestCentres(centresData || []);

      // Fetch instructor's assigned test centres
      const { data: assignedData, error: assignedError } = await supabase
        .from("instructor_test_centres")
        .select("test_centre_id")
        .eq("instructor_id", instructorId);

      if (assignedError) throw assignedError;
      setSelectedIds((assignedData || []).map(a => a.test_centre_id));
    } catch (error) {
      console.error("Error fetching test centres:", error);
      toast.error("Failed to load test centres");
    } finally {
      setLoading(false);
    }
  };

  const filteredCentres = useMemo(() => {
    if (!searchValue) return testCentres;
    const search = searchValue.toLowerCase();
    return testCentres.filter(
      centre =>
        centre.name.toLowerCase().includes(search) ||
        centre.postcode?.toLowerCase().includes(search) ||
        centre.address?.toLowerCase().includes(search)
    );
  }, [testCentres, searchValue]);

  const selectedCentres = useMemo(() => {
    return testCentres.filter(c => selectedIds.includes(c.id));
  }, [testCentres, selectedIds]);

  const toggleCentre = async (id: string) => {
    const isSelected = selectedIds.includes(id);
    const newSelectedIds = isSelected
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    
    setSelectedIds(newSelectedIds);

    // Save immediately
    setSaving(true);
    try {
      if (isSelected) {
        // Remove
        const { error } = await supabase
          .from("instructor_test_centres")
          .delete()
          .eq("instructor_id", instructorId)
          .eq("test_centre_id", id);

        if (error) throw error;
        toast.success("Test centre removed");
      } else {
        // Add
        const { error } = await supabase
          .from("instructor_test_centres")
          .insert({
            instructor_id: instructorId,
            test_centre_id: id,
          });

        if (error) throw error;
        toast.success("Test centre added");
      }
    } catch (error) {
      console.error("Error updating test centres:", error);
      // Revert
      setSelectedIds(isSelected ? [...newSelectedIds, id] : newSelectedIds.filter(i => i !== id));
      toast.error("Failed to update test centres");
    } finally {
      setSaving(false);
    }
  };

  const removeCentre = (id: string) => {
    toggleCentre(id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Add */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Search test centres...
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0 z-50" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name, postcode..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No test centres found.</CommandEmpty>
              <CommandGroup>
                {filteredCentres.map((centre) => (
                  <CommandItem
                    key={centre.id}
                    value={centre.id}
                    onSelect={() => toggleCentre(centre.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(centre.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{centre.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {centre.postcode}
                        {centre.pass_rate && ` • ${centre.pass_rate}% pass rate`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Centres */}
      {selectedCentres.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No test centres selected.</p>
          <p className="text-sm">Search above to add test centres you cover.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedCentres.map(centre => (
            <Card key={centre.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{centre.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{centre.postcode}</span>
                        {centre.pass_rate && (
                          <Badge variant="secondary" className="text-xs">
                            {centre.pass_rate}% pass
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCentre(centre.id)}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} test centre{selectedIds.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
