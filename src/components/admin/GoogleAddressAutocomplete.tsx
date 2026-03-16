import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AddressSuggestion {
  label: string;
  street: string;
  houseNumber: string;
  buildingName?: string;
  subBuildingName?: string;
  district: string;
  city: string;
  county: string;
  postcode: string;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPostcodeChange?: (postcode: string) => void;
  onAddressVerified?: (verified: boolean, details?: any) => void;
  placeholder?: string;
  className?: string;
}

export function GoogleAddressAutocomplete({
  value,
  onChange,
  onPostcodeChange,
  onAddressVerified,
  placeholder = "Start typing an address...",
  className,
}: GoogleAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("address-lookup", {
        body: { query: input },
      });

      if (error) throw error;

      const items: AddressSuggestion[] = (data?.addresses || []).map((a: any) => ({
        label: a.label || "",
        street: a.street || "",
        houseNumber: a.houseNumber || "",
        buildingName: a.buildingName || "",
        subBuildingName: a.subBuildingName || "",
        district: a.district || "",
        city: a.city || "",
        county: a.county || "",
        postcode: a.postcode || "",
      }));

      setSuggestions(items);
      setShowDropdown(items.length > 0);
    } catch (error) {
      console.error("Address autocomplete error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setVerified(null);
    onAddressVerified?.(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setShowDropdown(false);
    onChange(suggestion.label);

    if (suggestion.postcode && onPostcodeChange) {
      onPostcodeChange(suggestion.postcode);
    }

    setVerified(true);
    onAddressVerified?.(true, {
      formattedAddress: suggestion.label,
      streetAddress: [suggestion.houseNumber, suggestion.street].filter(Boolean).join(" "),
      locality: suggestion.city,
      postalCode: suggestion.postcode,
      country: "GB",
    });
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn(
            "pl-9 pr-10",
            verified === true && "border-green-500 focus-visible:ring-green-500"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!loading && verified === true && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((s, i) => {
              const line1 = [s.houseNumber, s.street].filter(Boolean).join(" ") || s.label;
              const line2 = [s.district, s.city, s.postcode].filter(Boolean).join(", ");
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                  >
                    <div className="font-medium text-sm">{line1}</div>
                    {line2 && <div className="text-xs text-muted-foreground">{line2}</div>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {verified === true && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Address verified
        </p>
      )}
    </div>
  );
}
