import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, ChevronDown, Search, PenLine, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ukPostcodeRegex } from "@/lib/booking-validation";

interface AddressOption {
  placeId?: string;
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
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
  const [doorNumber, setDoorNumber] = useState("");
  const [showDoorPrompt, setShowDoorPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const doorInputRef = useRef<HTMLInputElement>(null);
  const lastLookedUp = useRef("");
  const [sessionToken] = useState(() => crypto.randomUUID());

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

  // Focus door input when it appears
  useEffect(() => {
    if (showDoorPrompt && doorInputRef.current) {
      doorInputRef.current.focus();
    }
  }, [showDoorPrompt]);

  const lookupAddresses = useCallback(async (pc?: string) => {
    const clean = (pc ?? postcode).trim();
    if (!ukPostcodeRegex.test(clean) || clean === lastLookedUp.current) return;
    lastLookedUp.current = clean;

    setLoading(true);
    setNoResults(false);
    try {
      const { data, error } = await supabase.functions.invoke("postcode-address-lookup", {
        body: { postcode: clean },
      });
      if (error) throw error;

      const items = data?.addresses || [];
      const results: AddressOption[] = items.map((a: any) => ({
        placeId: a.placeId,
        label: a.label,
        street: a.mainText,
        houseNumber: "",
        district: "",
        city: a.secondaryText || "",
        county: "",
        postcode: clean,
      }));

      setAddresses(results);
      if (results.length > 0) {
        setTimeout(() => {
          setShowDropdown(true);
          setManualEntry(false);
        }, 150);
      } else {
        setNoResults(true);
        setManualEntry(true);
      }
    } catch (err: any) {
      console.error("Address lookup failed:", err);
      const isServiceError = err?.message?.includes("non-2xx") || err?.status >= 400;
      setNoResults(true);
      setManualEntry(true);
      if (isServiceError) {
        console.warn("Address lookup service unavailable — falling back to manual entry");
      }
    } finally {
      setLoading(false);
    }
  }, [postcode]);

  const handlePostcodeChange = (value: string) => {
    onPostcodeChange(value);
    if (value.trim() !== lastLookedUp.current) {
      setAddresses([]);
      setShowDropdown(false);
      setNoResults(false);
      setSelectedAddress(null);
      setShowDoorPrompt(false);
      setDoorNumber("");
    }
  };

  const handlePostcodeBlur = () => {
    onBlurPostcode?.();
    // Don't auto-lookup on blur — use the "Find Address" button instead
  };

  const handlePostcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      lookupAddresses();
    }
  };

  const buildFullAddress = (addr: AddressOption, door: string) => {
    const parts = [door || addr.houseNumber, addr.street, addr.district, addr.city].filter(Boolean);
    return parts.join(", ");
  };

  const handleSelectAddress = async (addr: AddressOption) => {
    setShowDropdown(false);

    if (addr.placeId) {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-details", {
          body: { placeId: addr.placeId, sessionToken },
        });
        if (error) throw error;

        const enriched: AddressOption = {
          ...addr,
          street: data.streetAddress || addr.street,
          houseNumber: "",
          city: data.locality || "",
          district: "",
          county: "",
          postcode: data.postalCode || addr.postcode,
        };

        // Extract house number from street address if present
        const streetMatch = (data.streetAddress || "").match(/^(\d+\w*)\s+(.+)/);
        if (streetMatch) {
          enriched.houseNumber = streetMatch[1];
          enriched.street = streetMatch[2];
        }

        setSelectedAddress(enriched);
        setDoorNumber(enriched.houseNumber);
        setShowDoorPrompt(true);
        const preliminary = buildFullAddress(enriched, enriched.houseNumber);
        onAddressChange(preliminary);
        if (enriched.postcode) {
          onPostcodeChange(enriched.postcode);
        }
      } catch (err) {
        console.error("Place details failed:", err);
        // Fallback to basic selection
        setSelectedAddress(addr);
        setDoorNumber("");
        setShowDoorPrompt(true);
        onAddressChange(addr.label);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedAddress(addr);
      setDoorNumber(addr.houseNumber);
      setShowDoorPrompt(true);
      const preliminary = buildFullAddress(addr, addr.houseNumber);
      onAddressChange(preliminary);
      if (addr.postcode) {
        onPostcodeChange(addr.postcode);
      }
    }
  };

  const handleDoorNumberChange = (value: string) => {
    setDoorNumber(value);
    if (selectedAddress) {
      const updated = buildFullAddress(selectedAddress, value);
      onAddressChange(updated);
    }
  };

  const handleDoorNumberBlur = () => {
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
        <div className="flex gap-2">
          <Input
            id="postcodeLookup"
            value={postcode}
            onChange={(e) => handlePostcodeChange(e.target.value.toUpperCase())}
            onBlur={handlePostcodeBlur}
            onKeyDown={handlePostcodeKeyDown}
            placeholder="SW1A 1AA"
            className={cn("h-10 flex-1", postcodeError && "border-destructive focus-visible:ring-destructive")}
          />
          <button
            type="button"
            onClick={() => lookupAddresses()}
            disabled={loading || !ukPostcodeRegex.test(postcode.trim())}
            className={cn(
              "h-10 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find Address
          </button>
        </div>
        {postcodeError && (
          <p className="text-[11px] text-destructive font-medium">{postcodeError}</p>
        )}
      </div>

      {/* Door number / property name — shown after selecting from dropdown */}
      {showDoorPrompt && selectedAddress && (
        <div className="space-y-1.5">
          <Label htmlFor="doorNumber" className="text-xs">
            Door Number / Property Name *
          </Label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={doorInputRef}
              id="doorNumber"
              value={doorNumber}
              onChange={(e) => handleDoorNumberChange(e.target.value)}
              onBlur={handleDoorNumberBlur}
              placeholder="e.g. 42, Flat 3, Rose Cottage"
              className="h-10 pl-9"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {[selectedAddress.street, selectedAddress.district, selectedAddress.city].filter(Boolean).join(", ")}
          </p>
        </div>
      )}

      {/* Address dropdown or manual entry */}
      <div className="space-y-1.5">
        <Label htmlFor="addressField" className="text-xs">
          Home Address *
        </Label>

        {/* Show dropdown selector when addresses are available and not in manual mode */}
        {!manualEntry && addresses.length > 0 && !showDoorPrompt ? (
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
        ) : showDoorPrompt ? (
          /* Show the composed address as a read-only display after selection */
          <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mr-2" />
            <span className="truncate">{address || "—"}</span>
            <button
              type="button"
              onClick={() => { setShowDoorPrompt(false); setSelectedAddress(null); setShowDropdown(true); }}
              className="ml-auto text-xs text-primary hover:underline shrink-0"
            >
              Change
            </button>
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
