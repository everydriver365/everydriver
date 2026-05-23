import { useEffect, useState, useCallback } from "react";
import { detectNativeWrapper } from "./useIsNativeWrapper";

export interface ImportedContact {
  name: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
}

const UK_POSTCODE_RE =
  /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

function extractPostcode(address: string): string {
  if (!address) return "";
  const m = address.match(UK_POSTCODE_RE);
  return m ? `${m[1]} ${m[2]}`.toUpperCase() : "";
}

function clean(s: unknown, max = 200): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function pickFirst<T>(arr: T[] | undefined | null): T | undefined {
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined;
}

type ContactsCapability = "none" | "capacitor" | "web";

function detectCapability(): ContactsCapability {
  if (typeof window === "undefined") return "none";
  if (detectNativeWrapper()) {
    // Native wrapper present — assume Capacitor contacts plugin is bundled.
    return "capacitor";
  }
  const nav = navigator as unknown as {
    contacts?: { select?: (props: string[], opts?: unknown) => Promise<unknown[]> };
  };
  if (nav.contacts && typeof nav.contacts.select === "function") {
    return "web";
  }
  return "none";
}

export function useContactImport() {
  const [capability, setCapability] = useState<ContactsCapability>(() => detectCapability());

  useEffect(() => {
    // Re-check after mount in case the native bridge injects late.
    const t = setTimeout(() => setCapability(detectCapability()), 150);
    return () => clearTimeout(t);
  }, []);

  const pickContact = useCallback(async (): Promise<ImportedContact | null> => {
    try {
      if (capability === "capacitor") {
        // Dynamic import keeps web bundle clean and avoids breaking SSR/preview.
        const mod: any = await import("@capacitor-community/contacts");
        const Contacts = mod.Contacts;
        if (!Contacts) return null;

        const perm = await Contacts.requestPermissions();
        if (perm?.contacts !== "granted") return null;

        const picked = await Contacts.pickContact({
          projection: {
            name: true,
            phones: true,
            emails: true,
            postalAddresses: true,
          },
        });
        const c = picked?.contact;
        if (!c) return null;

        const name = clean(c.name?.display, 100);
        const phoneEntry =
          c.phones?.find((p: any) => /mobile|cell/i.test(p.label || p.type || "")) ??
          pickFirst(c.phones);
        const phone = clean(phoneEntry?.number, 30);
        const emailEntry = pickFirst(c.emails) as { address?: string } | undefined;
        const email = clean(emailEntry?.address, 255);
        const addressParts = postal
          ? [postal.street, postal.city, postal.region, postal.country].filter(Boolean)
          : [];
        const address = clean(addressParts.join(", "), 200);
        const postcode =
          clean(postal?.postcode, 10) || extractPostcode(address);

        if (!name && !phone && !email) return null;
        return { name, phone, email, address, postcode };
      }

      if (capability === "web") {
        const nav = navigator as any;
        const props = ["name", "tel", "email"];
        // Address is technically supported but unreliable; omit to stay portable.
        const results = await nav.contacts.select(props, { multiple: false });
        const c = results?.[0];
        if (!c) return null;
        const name = clean(pickFirst<string>(c.name), 100);
        const phone = clean(pickFirst<string>(c.tel), 30);
        const email = clean(pickFirst<string>(c.email), 255);
        if (!name && !phone && !email) return null;
        return { name, phone, email, address: "", postcode: "" };
      }

      return null;
    } catch (err) {
      // User-cancelled or permission denied — swallow silently.
      console.warn("[useContactImport] pick failed", err);
      return null;
    }
  }, [capability]);

  return {
    supported: capability !== "none",
    pickContact,
  };
}
