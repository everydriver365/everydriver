import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useDVSANews } from "@/hooks/useDVSANews";
import newsFeatured from "@/assets/news-featured.jpg";

export default function NewsArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { news, loading, getArticleBySlug } = useDVSANews();

  const article = slug ? getArticleBySlug(slug) : undefined;

  if (loading) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-20">
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!article) {
    return (
      <MainLayout>
        <div className="container max-w-3xl py-20 text-center">
          <h1 className="text-3xl font-black mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">This article could not be found.</p>
          <Link to="/news">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to News
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const paragraphs = article.fullContent
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <MainLayout>
      <SEOHead
        title={`${article.title} | Drive365 News`}
        description={article.description}
        type="article"
        image={article.imageUrl || undefined}
        jsonLd={{
          id: "article-jsonld",
          data: {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            description: article.description,
            image: article.imageUrl || undefined,
            datePublished: article.pubDate || undefined,
            dateModified: article.pubDate || undefined,
            mainEntityOfPage: typeof window !== "undefined" ? window.location.href : undefined,
            publisher: {
              "@type": "Organization",
              name: "Drive365",
              logo: { "@type": "ImageObject", url: "https://everydriver.lovable.app/drive365-logo.png" },
            },
          },
        }}
      />

      <article className="py-12">
        <div className="container max-w-3xl">
          {/* Back link */}
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to News & Tips
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Category & date */}
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100">
                {article.category || "DVSA News"}
              </Badge>
              {article.pubDate && (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(article.pubDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-black mb-6 leading-tight">{article.title}</h1>

            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
              <img
                src={article.imageUrl || newsFeatured}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>

            {/* Article body */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {paragraphs.map((paragraph, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Source link */}
            <div className="mt-10 pt-6 border-t">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Read original article on DVSA Despatch Blog
              </a>
            </div>
          </motion.div>
        </div>
      </article>
    </MainLayout>
  );
}
