import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { TheoryContent } from "@/pages/Theory";

export default function MiniWebsiteTheory() {
  const { slug } = useParams<{ slug: string }>();

  const { data: instructor, isLoading } = useQuery({
    queryKey: ["mini-website-instructor", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_instructors")
        .select("*")
        .eq("app_slug", slug)
        .single();
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
    return <div className="min-h-screen flex items-center justify-center">Instructor not found</div>;
  }

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Theory" pageDescription={`Practice theory test questions with ${(instructor as any).business_name || instructor.name}. Free theory revision tools.`}>
      <div>
        <TheoryContent />
      </div>
    </MiniWebsiteLayout>
  );
}
