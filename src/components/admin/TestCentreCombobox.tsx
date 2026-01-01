import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

interface TestCentre {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
}

interface TestCentreComboboxProps {
  testCentres: TestCentre[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function TestCentreCombobox({
  testCentres,
  selectedIds,
  onSelectionChange,
}: TestCentreComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCentres = useMemo(() => {
    if (!searchValue) return testCentres;
    const search = searchValue.toLowerCase();
    return testCentres.filter(
      (centre) =>
        centre.name.toLowerCase().includes(search) ||
        centre.postcode?.toLowerCase().includes(search) ||
        centre.address?.toLowerCase().includes(search)
    );
  }, [testCentres, searchValue]);

  const selectedCentres = useMemo(() => {
    return testCentres.filter((c) => selectedIds.includes(c.id));
  }, [testCentres, selectedIds]);

  const toggleCentre = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const removeCentre = (id: string) => {
    onSelectionChange(selectedIds.filter((i) => i !== id));
  };

  return (
    <div className="space-y-3">
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
        <PopoverContent className="w-[400px] p-0 z-50" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name, postcode, or address..."
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
                        selectedIds.includes(centre.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{centre.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {centre.postcode}
                        {centre.address && ` • ${centre.address}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCentres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCentres.map((centre) => (
            <Badge
              key={centre.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {centre.name}
              <button
                type="button"
                onClick={() => removeCentre(centre.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedIds.length} centre{selectedIds.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
