import { useState } from "react";
import { Loader2, Globe, User, Mail, Phone, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAddressAutocomplete } from "@/components/admin/GoogleAddressAutocomplete";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { DomainLinkModal } from "./DomainLinkModal";

interface DomainCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  price: number;
  currency: string;
  onSuccess?: () => void;
}

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

export function DomainCheckoutModal({
  open,
  onOpenChange,
  domain,
  price,
  currency,
  onSuccess,
}: DomainCheckoutModalProps) {
  const { instructor } = useInstructorAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [purchasedOrderId, setPurchasedOrderId] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactDetails>(() => {
    // Pre-fill with instructor data if available
    const nameParts = instructor?.name?.split(" ") || [];
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: instructor?.email || "",
      phone: instructor?.phone || "",
      address: "",
      city: "",
      postcode: "",
      country: "GB",
    };
  });

  const handleChange = (field: keyof ContactDetails, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!contact.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!contact.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!contact.email.trim() || !contact.email.includes("@")) {
      toast.error("Valid email is required");
      return false;
    }
    if (!contact.address.trim()) {
      toast.error("Address is required for domain registration");
      return false;
    }
    if (!contact.postcode.trim()) {
      toast.error("Postcode is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Register domain with 20i
      const { data, error } = await supabase.functions.invoke("twentyi-api", {
        body: {
          action: "register-domain",
          domain,
          period: 1,
          contact,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Save order to database
        let orderId: string | null = null;
        if (instructor?.id) {
          const { data: insertData, error: insertError } = await supabase
            .from("domain_orders")
            .insert({
              instructor_id: instructor.id,
              domain_name: domain.split(".")[0],
              tld: domain.substring(domain.indexOf(".")),
              order_type: "registration",
              status: "active",
              provider_order_id: data.orderId,
              price_amount: price,
              currency: currency,
              period_years: 1,
              auto_renew: true,
              expires_at: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .select("id")
            .single();

          if (!insertError && insertData) {
            orderId = insertData.id;
          }
        }

        toast.success(`Domain ${domain} registered successfully!`);
        onOpenChange(false);
        
        // Show link modal if we have an order ID and instructor has a mini-website
        if (orderId && instructor?.app_slug) {
          setPurchasedOrderId(orderId);
          setShowLinkModal(true);
        } else {
          onSuccess?.();
        }
      } else {
        throw new Error(data?.error || "Failed to register domain");
      }
    } catch (error) {
      console.error("Error registering domain:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to register domain"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Link to Mini-Website Modal */}
      {showLinkModal && purchasedOrderId && instructor?.id && (
        <DomainLinkModal
          open={showLinkModal}
          onOpenChange={(open) => {
            setShowLinkModal(open);
            if (!open) onSuccess?.();
          }}
          domain={domain}
          domainOrderId={purchasedOrderId}
          instructorId={instructor.id}
          miniWebsiteSlug={instructor.app_slug}
          onSuccess={onSuccess}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Register Domain
          </DialogTitle>
          <DialogDescription>
            Complete your purchase for <strong>{domain}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border bg-muted/30 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{domain}</p>
              <p className="text-sm text-muted-foreground">1 year registration</p>
            </div>
            <p className="text-xl font-bold">
              {currency === "GBP" ? "£" : currency}
              {price.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Contact details for domain WHOIS registration
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  value={contact.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Smith"
                value={contact.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={contact.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7700 900000"
                value={contact.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address *</Label>
            <GoogleAddressAutocomplete
              value={contact.address}
              onChange={(v) => handleChange("address", v)}
              onPostcodeChange={(pc) => handleChange("postcode", pc)}
              placeholder="Start typing an address..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="London"
                value={contact.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                placeholder="SW1A 1AA"
                value={contact.postcode}
                onChange={(e) => handleChange("postcode", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay £${price.toFixed(2)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
