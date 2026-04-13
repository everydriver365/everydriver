import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import SchoolWebsiteLayout from "./SchoolWebsiteLayout";

interface ContentBlock {
  type: "text" | "features";
  title?: string;
  content?: string;
  items?: string[];
}

export default function SchoolWebsiteAbout() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ hero_heading: string | null; hero_subheading: string | null; content_blocks: ContentBlock[] } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data: school } = await supabase.from("schools").select("id").eq("slug", slug).maybeSingle();
      if (!school) return;
      const { data } = await supabase
        .from("school_website_pages")
        .select("hero_heading, hero_subheading, content_blocks")
        .eq("school_id", school.id)
        .eq("page_type", "about")
        .eq("is_published", true)
        .maybeSingle();
      if (data) {
        setPage({ ...data, content_blocks: (data.content_blocks as unknown as ContentBlock[]) || [] });
      }
    };
    fetch();
  }, [slug]);

  return (
    <SchoolWebsiteLayout pageType="about">
      {(school) => {
        const brandColor = school.brand_colour || "#3b82f6";
        return (
          <div>
            <section className="py-16 md:py-20" style={{ background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)` }}>
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{page?.hero_heading || `About ${school.name}`}</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{page?.hero_subheading || "Learn more about our driving school"}</p>
              </div>
            </section>

            {page?.content_blocks?.map((block, idx) => (
              <section key={idx} className="py-10">
                <div className="container mx-auto px-4 max-w-3xl">
                  {block.type === "text" && (
                    <>
                      {block.title && <h2 className="text-2xl font-bold mb-4">{block.title}</h2>}
                      {block.content && <p className="text-muted-foreground leading-relaxed">{block.content}</p>}
                    </>
                  )}
                  {block.type === "features" && block.items && (
                    <>
                      {block.title && <h2 className="text-2xl font-bold mb-4">{block.title}</h2>}
                      <div className="grid sm:grid-cols-2 gap-3">
                        {block.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: brandColor }} />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            ))}
          </div>
        );
      }}
    </SchoolWebsiteLayout>
  );
}
