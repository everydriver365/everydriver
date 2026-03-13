import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, ChevronDown, Search, PenLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ukPostcodeRegex } from "@/lib/booking-validation";

interface AddressOption {
  label: string;
  street: string;
  houseNumber: string;
  district: string;
  city: string;
  county: string;
  postcode: string;
}

interface PostcodeAddressLookupProps {
  postcode: string;
  address: string;
  onPostcodeChange: (postcode: string) => void;
  onAddressChange: (address: string) => void;
  onBlurPostcode?: () => void;
  onBlurAddress?: () => void;
  postcodeError?: string | null;
  addressError?: string | null;
  className?: string;
}

export function PostcodeAddressLookup({
  postcode,
  address,
  onPostcodeChange,
  onAddressChange,
  onBlurPostcode,
  onBlurAddress,
  postcodeError,
  addressError,
  className,
}: PostcodeAddressLookupProps) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLookedUp = useRef("");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const lookupAddresses = useCallback(async (pc: string) => {
    const clean = pc.trim();
    if (!ukPostcodeRegex.test(clean) || clean === lastLookedUp.current) return;
    lastLookedUp.current = clean;

    setLoading(true);
    setNoResults(false);
    try {
      const { data, error } = await supabase.functions.invoke("address-lookup", {
        body: { postcode: clean },
      });
      if (error) throw error;

      const results: AddressOption[] = data?.addresses || [];
      setAddresses(results);
      if (results.length > 0) {
        setShowDropdown(true);
        setManualEntry(false);
      } else {
        setNoResults(true);
        setManualEntry(true);
      }
    } catch (err) {
      console.error("Address lookup failed:", err);
      setNoResults(true);
      setManualEntry(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePostcodeChange = (value: string) => {
    onPostcodeChange(value);
    // Reset if postcode changes significantly
    if (value.trim() !== lastLookedUp.current) {
      setAddresses([]);
      setShowDropdown(false);
      setNoResults(false);
    }
  };

  const handlePostcodeBlur = () => {
    onBlurPostcode?.();
    lookupAddresses(postcode);
  };

  const handlePostcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupAddresses(postcode);
    }
  };

  const handleSelectAddress = (addr: AddressOption) => {
    const parts = [addr.houseNumber, addr.street, addr.district, addr.city].filter(Boolean);
    const formatted = parts.join(", ");
    onAddressChange(formatted);
    if (addr.postcode) {
      onPostcodeChange(addr.postcode);
    }
    setShowDropdown(false);
    onBlurAddress?.();
  };

  const formatDisplayAddress = (addr: AddressOption) => {
    const line1 = [addr.houseNumber, addr.street].filter(Boolean).join(" ");
    const line2 = [addr.district, addr.city].filter(Boolean).join(", ");
    return { line1, line2 };
  };

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      {/* Postcode field */}
      <div className="space-y-1.5">
        <Label htmlFor="postcodeLookup" className="text-xs">
          Postcode *
        </Label>
        <div className="relative">
          <Input
            id="postcodeLookup"
            value={postcode}
            onChange={(e) => handlePostcodeChange(e.target.value.toUpperCase())}
            onBlur={handlePostcodeBlur}
            onKeyDown={handlePostcodeKeyDown}
            placeholder="SW1A 1AA"
            className={cn("h-10 pr-9", postcodeError && "border-destructive focus-visible:ring-destructive")}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        {postcodeError && (
          <p className="text-[11px] text-destructive font-medium">{postcodeError}</p>
        )}
      </div>

      {/* Address dropdown or manual entry */}
      <div className="space-y-1.5">
        <Label htmlFor="addressField" className="text-xs">
          Home Address *
        </Label>

        {/* Show dropdown selector when addresses are available and not in manual mode */}
        {!manualEntry && addresses.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "hover:bg-accent/50 transition-colors",
                !address && "text-muted-foreground",
                addressError && "border-destructive"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {address || `${addresses.length} addresses found — select one`}
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showDropdown && "rotate-180")} />
            </button>

            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                <ul className="max-h-52 overflow-auto py-1">
                  {addresses.map((addr, i) => {
                    const { line1, line2 } = formatDisplayAddress(addr);
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handleSelectAddress(addr)}
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                        >
                          <div className="font-medium text-sm">{line1 || addr.label}</div>
                          {line2 && <div className="text-xs text-muted-foreground">{line2}</div>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t">
                  <button
                    type="button"
                    onClick={() => { setManualEntry(true); setShowDropdown(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Enter address manually
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual text input fallback */
          <Input
            id="addressField"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onBlur={onBlurAddress}
            placeholder={noResults ? "No addresses found — type your address" : "Enter your full address"}
            className={cn("h-10", addressError && "border-destructive focus-visible:ring-destructive")}
          />
        )}

        {addressError && (
          <p className="text-[11px] text-destructive font-medium">{addressError}</p>
        )}

        {/* Toggle back to dropdown if available */}
        {manualEntry && addresses.length > 0 && (
          <button
            type="button"
            onClick={() => { setManualEntry(false); setShowDropdown(true); }}
            className="text-xs text-primary hover:underline"
          >
            ← Back to address list
          </button>
        )}
      </div>
    </div>
  );
}
