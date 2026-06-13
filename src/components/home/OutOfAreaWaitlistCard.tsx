import { useState } from "react";
import { z } from "zod";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  postcode: z.string().trim().min(2, "Postcode required").max(12),
  looking_for: z.enum(["intensive", "semi-intensive", "weekly", "refresher", "not-sure"]),
});

interface Props {
  postcode?: string;
  areaLabel?: string;
  sourcePage?: string;
}

function postcodeArea(pc: string) {
  const clean = pc.trim().toUpperCase().replace(/\s+/g, " ");
  return clean.split(" ")[0] || clean;
}

/**
 * Shown when a pupil searches a postcode we don't currently cover with a real
 * instructor. Writes to `coverage_waitlist` so admin can prioritise recruitment
 * in that area and contact the pupil when coverage opens up.
 */
export function OutOfAreaWaitlistCard({ postcode = "", areaLabel, sourcePage }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pc, setPc] = useState(postcode);
  const [lookingFor, setLookingFor] = useState<string>("not-sure");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const label = areaLabel || (postcode ? postcodeArea(postcode) : "your area");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      name,
      email,
      phone: phone || undefined,
      postcode: pc,
      looking_for: lookingFor,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first || "Please check the form and try again");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("coverage_waitlist").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      postcode: parsed.data.postcode,
      postcode_area: postcodeArea(parsed.data.postcode),
      looking_for: parsed.data.looking_for,
      source: "out_of_area_waitlist",
      source_page: sourcePage || (typeof window !== "undefined" ? window.location.pathname : null),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit — please try again in a moment");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">You're on the list</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks {name.split(" ")[0]} — we'll be in touch the moment we cover{" "}
          <span className="font-medium text-foreground">{label}</span>.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            We're not in <span className="text-primary">{label}</span> yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Leave your details — we'll let you know the moment we do.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="oaw-name">Your name</Label>
            <Input id="oaw-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="oaw-postcode">Postcode</Label>
            <Input
              id="oaw-postcode"
              value={pc}
              onChange={(e) => setPc(e.target.value.toUpperCase())}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="oaw-email">Email</Label>
          <Input
            id="oaw-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="oaw-phone">Phone (optional)</Label>
          <Input id="oaw-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>What are you looking for?</Label>
          <Select value={lookingFor} onValueChange={setLookingFor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="intensive">Intensive course (test in days)</SelectItem>
              <SelectItem value="semi-intensive">Semi-intensive (a few weeks)</SelectItem>
              <SelectItem value="weekly">Weekly lessons</SelectItem>
              <SelectItem value="refresher">Refresher / pass plus</SelectItem>
              <SelectItem value="not-sure">Not sure yet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding you…
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          We'll only use these details to let you know when we cover {label}.
        </p>
      </form>
    </Card>
  );
}
