import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { TheoryContent } from "@/pages/Theory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

function NotFoundView() {
  // Mark this page noindex for crawlers
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (created) meta?.remove();
      else if (meta) meta.content = prev;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
      <Card className="max-w-md w-full text-center p-8">
        <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find this instructor.</p>
        <Link to="/"><Button>Go Home</Button></Link>
      </Card>
    </div>
  );
}

export default function MiniWebsiteTheory() {
  const { slug } = useParams<{ slug: string }>();

  const { data: instructor, isLoading } = useQuery({
    queryKey: ["mini-website-instructor", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_instructors")
        .select("*")
        .eq("app_slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!instructor) {
    return <NotFoundView />;
  }

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Theory" pageDescription={`Practice theory test questions with ${(instructor as any).business_name || instructor.name}. Free theory revision tools.`}>
      <div>
        <TheoryContent />
      </div>
    </MiniWebsiteLayout>
  );
}
