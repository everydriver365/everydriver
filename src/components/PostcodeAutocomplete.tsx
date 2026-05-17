import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PostcodeSuggestion {
  postcode: string;
  area_name: string | null;
}

interface PostcodeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (postcode: string, areaName?: string | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showGeolocation?: boolean;
  showInputIcon?: boolean;
  enableDictation?: boolean;
  prefixElement?: React.ReactNode;
}

export function PostcodeAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter postcode...",
  className,
  inputClassName,
  showGeolocation = true,
  showInputIcon = true,
  enableDictation = true,
  prefixElement,
}: PostcodeAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PostcodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasFetched, setHasFetched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextFetchRef = useRef(false);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch suggestions from edge function. Keeps any previous suggestions
  // visible until the new response lands, so the dropdown never flashes empty.
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setHasFetched(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('postcode-autocomplete', {
        body: { query },
      });

      if (error) throw error;

      const parsedSuggestions: PostcodeSuggestion[] = data?.suggestions || [];
      setSuggestions(parsedSuggestions);
      setHighlightedIndex(-1);
      setHasFetched(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
      setHasFetched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input handler. Opens the panel immediately on ≥2 chars so the
  // user sees the loading state instead of a blank gap before results land.
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    if (value.length >= 2) {
      setShowDropdown(true);
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 200);
    } else {
      setSuggestions([]);
      setHasFetched(false);
      setIsLoading(false);
      setShowDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const handleSelect = (suggestion: PostcodeSuggestion) => {
    skipNextFetchRef.current = true;
    onChange(suggestion.postcode);
    setShowDropdown(false);
    setSuggestions([]);
    setHasFetched(false);
    onSelect?.(suggestion.postcode, suggestion.area_name);
  };

  // Geolocation handler
  const handleGeolocation = async () => {
    console.log('Geolocation button clicked');
    
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    console.log('Requesting geolocation...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Got position:', position.coords);
        try {
          const { latitude, longitude } = position.coords;
          console.log(`Coordinates: ${latitude}, ${longitude}`);
          
          // Reverse geocode to get postcode
          const response = await fetch(
            `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`
          );
          
          console.log('Postcodes.io response status:', response.status);
          
          if (!response.ok) throw new Error('Failed to fetch postcode');
          
          const data = await response.json();
          console.log('Postcodes.io data:', data);
          
          if (data.result && data.result.length > 0) {
            const result = data.result[0];
            const formattedPostcode = result.postcode;
            const areaName = result.admin_district || result.admin_ward || null;
            
            console.log('Found postcode:', formattedPostcode, areaName);
            
            skipNextFetchRef.current = true;
            onChange(formattedPostcode);
            onSelect?.(formattedPostcode, areaName);
            
            toast({
              title: "Location found!",
              description: `Using ${formattedPostcode}${areaName ? `, ${areaName}` : ''}`,
            });
          } else {
            console.log('No postcode in result');
            toast({
              title: "No postcode found",
              description: "Couldn't find a postcode for your location",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Location error",
            description: "Failed to get postcode from your location",
            variant: "destructive",
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error.code, error.message);
        setIsLocating(false);
        let message = "Failed to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Please allow location access in your browser settings";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location unavailable - please try again";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out - please try again";
        }
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          {prefixElement}
          {showInputIcon && (
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          )}
          <Input
            ref={inputRef}
            type="text"
            enableDictation={enableDictation}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.length >= 2) setShowDropdown(true);
            }}
            className={cn(showInputIcon ? "pl-10" : "pl-3", inputClassName)}
            autoComplete="off"
          />
        </div>
        
        {/* Geolocation button */}
        {showGeolocation && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGeolocation}
            disabled={isLocating}
            className="h-auto aspect-square flex-shrink-0 border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            title="Use my location"
          >
            {isLocating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LocateFixed className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Dropdown — stays open during lookups so the user always sees state. */}
      {showDropdown && value.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-muted-foreground">
              {isLoading ? "Searching" : suggestions.length > 0 ? "Suggestions" : "No matches"}
            </span>
            {isLoading && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Looking up…
              </span>
            )}
          </div>

          {isLoading && suggestions.length === 0 ? (
            <ul className="py-1">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ height: 44 }}
                >
                  <div className="h-4 w-4 flex-shrink-0 animate-pulse rounded-sm bg-muted" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-32 animate-pulse rounded bg-muted/70" />
                  </div>
                </li>
              ))}
            </ul>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.postcode}
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                    highlightedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  style={{ minHeight: 44 }}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{suggestion.postcode}</span>
                    {suggestion.area_name && (
                      <span className="text-sm text-muted-foreground truncate">
                        {suggestion.area_name}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : hasFetched ? (
            <div className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              No matches for “{value}”
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
