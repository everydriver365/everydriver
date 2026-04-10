import { useState } from "react";
import { Loader2, Server, Globe, User, Mail, Phone, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface HostingPackage {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  features: string[];
}

interface HostingCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package_: HostingPackage;
  onSuccess?: () => void;
}

interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  domainName: string;
}

export function HostingCheckoutModal({
  open,
  onOpenChange,
  package_,
  onSuccess,
}: HostingCheckoutModalProps) {
  const { instructor } = useInstructorAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [contact, setContact] = useState<ContactDetails>(() => {
    const nameParts = instructor?.name?.split(" ") || [];
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: instructor?.email || "",
      phone: instructor?.phone || "",
      domainName: "",
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
    if (!contact.domainName.trim()) {
      toast.error("Domain name is required for hosting");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Provision hosting with 20i
      const { data, error } = await supabase.functions.invoke("twentyi-api", {
        body: {
          action: "provision-hosting",
          packageId: package_.id,
          domain: contact.domainName,
          label: `${contact.firstName} ${contact.lastName} - ${contact.domainName}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Save order to database
        if (instructor?.id) {
          await supabase.from("hosting_orders").insert({
            instructor_id: instructor.id,
            domain_name: contact.domainName,
            package_id: package_.id,
            package_name: package_.name,
            status: "active",
            provider_package_ref: data.packageRef,
            price_amount: package_.price,
            currency: package_.currency,
            billing_period: "yearly",
            expires_at: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }

        toast.success(`${package_.name} hosting provisioned successfully!`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(data?.error || "Failed to provision hosting");
      }
    } catch (error) {
      console.error("Error provisioning hosting:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to provision hosting"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Get Hosting
          </DialogTitle>
          <DialogDescription>
            Complete your purchase for <strong>{package_.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-none border bg-muted/30 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-semibold">{package_.name}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {package_.type} Hosting
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">
                {package_.currency === "GBP" ? "£" : package_.currency}
                {package_.price.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
            {package_.features.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-center gap-1">
                <span className="text-emerald-500">✓</span> {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="domainName">Domain Name *</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="domainName"
                placeholder="yourdomain.com"
                value={contact.domainName}
                onChange={(e) => handleChange("domainName", e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the domain you want to host (you must own this domain)
            </p>
          </div>

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
              `Pay £${package_.price.toFixed(2)}/mo`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
