import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!code) return;
    if (typeof window !== "undefined") sessionStorage.setItem("referral_code", code);
    void (async () => {
      const { data } = await supabase.from("pupils")
        .select("instructor_id, instructors!inner(name)")
        .eq("referral_code", code)
        .maybeSingle();
      const inst = (data as unknown as { instructors?: { name: string } })?.instructors;
      if (inst) setInstructor({ name: inst.name });
    })();
  }, [code]);

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="pt-8 text-center space-y-3">
          <Gift className="h-12 w-12 mx-auto" />
          <h1 className="text-2xl font-bold">You've got £10 off!</h1>
          <p className="text-sm opacity-90">{instructor ? `${instructor.name} sent you £10 toward your first lesson.` : "Your friend sent you £10 toward your first lesson."}</p>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate("/courses")}>Find a course</Button>
        </CardContent>
      </Card>
    </div>
  );
}
