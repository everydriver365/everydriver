import { useParams } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface MiniWebsiteTestsProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteTests({ subdomainSlug }: MiniWebsiteTestsProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "tests");

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Button onClick={() => window.location.href = "/"}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const primaryColor = instructor.brand_colour || "#1e3a5f";

  return (
    <MiniWebsiteLayout
      instructor={instructor}
      pageTitle="Tests"
      pageDescription={`Get help finding and booking your driving test with ${instructor.business_name || instructor.name}.`}
      metaTitle={page?.meta_title}
      metaDescription={page?.meta_description}
    >
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Driving Test Support</h1>
            <p className="text-lg text-white/90">
              Get in touch and we'll help you find and book the right test slot.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Card style={{ backgroundColor: "#e9f4f9" }}>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Pupils and instructors using our swap system can post test slot requests inside the app.
              Contact us and we'll match you with available swaps.
            </p>
            <Button
              size="lg"
              style={{ backgroundColor: primaryColor }}
              className="text-white gap-2"
              onClick={() => (window.location.href = `/i/${slug}/contact`)}
            >
              <MessageCircle className="h-4 w-4" /> Contact us
            </Button>
          </CardContent>
        </Card>
      </section>
    </MiniWebsiteLayout>
  );
}
