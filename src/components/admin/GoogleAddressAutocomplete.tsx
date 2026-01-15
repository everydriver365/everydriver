import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AddressPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressDetails {
  formattedAddress: string;
  streetAddress: string;
  locality: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPostcodeChange?: (postcode: string) => void;
  onAddressVerified?: (verified: boolean, details?: AddressDetails) => void;
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
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-autocomplete", {
        body: { input, sessionToken },
      });

      if (error) throw error;

      setPredictions(data.predictions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setVerified(null);
    onAddressVerified?.(false);

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  const handleSelectPrediction = async (prediction: AddressPrediction) => {
    setLoading(true);
    setShowDropdown(false);

    try {
      const { data, error } = await supabase.functions.invoke("google-places-details", {
        body: { placeId: prediction.placeId, sessionToken },
      });

      if (error) throw error;

      const details = data as AddressDetails;
      onChange(details.streetAddress || prediction.mainText);
      
      if (details.postalCode && onPostcodeChange) {
        onPostcodeChange(details.postalCode);
      }

      setVerified(true);
      onAddressVerified?.(true, details);
    } catch (error) {
      console.error("Error fetching place details:", error);
      onChange(prediction.description);
      setVerified(false);
      onAddressVerified?.(false);
    } finally {
      setLoading(false);
    }
  };

  const clearVerification = () => {
    setVerified(null);
    onAddressVerified?.(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn(
            "pl-9 pr-10",
            verified === true && "border-green-500 focus-visible:ring-green-500",
            verified === false && "border-amber-500 focus-visible:ring-amber-500"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!loading && verified === true && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {!loading && verified === false && (
            <button
              type="button"
              onClick={clearVerification}
              className="text-amber-500 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {predictions.map((prediction) => (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelectPrediction(prediction)}
                  className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="font-medium text-sm">{prediction.mainText}</div>
                  <div className="text-xs text-muted-foreground">{prediction.secondaryText}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-1">
            <img
              src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png"
              alt="Powered by Google"
              className="h-3"
            />
          </div>
        </div>
      )}

      {verified === true && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Address verified by Google
        </p>
      )}
    </div>
  );
}
