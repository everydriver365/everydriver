import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Accessibility, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ADAPTATIONS = ["hand controls", "left-foot accelerator", "steering ball", "pedal extensions", "automatic only", "wheelchair stowage"];
const EXPERIENCE = ["physical", "visual-impaired", "deaf/BSL", "autism/ADHD", "anxiety", "learning difficulties", "brain injury", "stroke recovery"];

export default function InstructorAccessibilitySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [bsl, setBsl] = useState(false);
  const [motability, setMotability] = useState(false);
  const [adaptations, setAdaptations] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return setLoading(false);
      const { data } = await supabase
        .from("instructors")
        .select("id,accessibility_enabled,adaptations,disability_experience,bsl_signing,motability_friendly,accessibility_bio")
        .eq("auth_user_id", u.user.id)
        .single();
      if (data) {
        setInstructorId(data.id);
        setEnabled(data.accessibility_enabled || false);
        setBsl(data.bsl_signing || false);
        setMotability(data.motability_friendly || false);
        setAdaptations(data.adaptations || []);
        setExperience(data.disability_experience || []);
        setBio(data.accessibility_bio || "");
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (list: string[], setList: (s: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const save = async () => {
    if (!instructorId) return;
    setSaving(true);
    const { error } = await supabase
      .from("instructors")
      .update({
        accessibility_enabled: enabled,
        bsl_signing: bsl,
        motability_friendly: motability,
        adaptations,
        disability_experience: experience,
        accessibility_bio: bio,
      })
      .eq("id", instructorId);
    setSaving(false);
    if (error) return toast.error("Could not save");
    toast.success("Accessibility profile saved");
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/instructor/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Settings</Link>
      </Button>

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Accessibility className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Accessibility profile</h1>
            <p className="text-sm text-muted-foreground">Show up in the Drive for all directory.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">List me in the Accessible directory</Label>
              <p className="text-xs text-muted-foreground">Your profile appears at /accessible/instructors when enabled.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-base">BSL signing</Label>
            <Switch checked={bsl} onCheckedChange={setBsl} />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-base">Motability friendly</Label>
            <Switch checked={motability} onCheckedChange={setMotability} />
          </div>

          <div>
            <Label className="text-base">Vehicle adaptations</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADAPTATIONS.map((a) => (
                <Badge
                  key={a}
                  variant={adaptations.includes(a) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggle(adaptations, setAdaptations, a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base">Disability teaching experience</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPERIENCE.map((e) => (
                <Badge
                  key={e}
                  variant={experience.includes(e) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggle(experience, setExperience, e)}
                >
                  {e}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="bio" className="text-base">Accessibility bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              placeholder="Tell disabled learners about your experience, your vehicle, and how you adapt your teaching."
              className="mt-2"
            />
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save accessibility profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
