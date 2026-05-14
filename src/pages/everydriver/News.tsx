import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { useDVSANews } from "@/hooks/useDVSANews";
import { Link } from "react-router-dom";
import newsFeatured from "@/assets/news-featured.jpg";
import newsArticle1 from "@/assets/news-article1.jpg";
import newsArticle2 from "@/assets/news-article2.jpg";

const fallbackImages = [newsFeatured, newsArticle1, newsArticle2];

export default function News() {
  const { news: dvsaNews, loading: newsLoading } = useDVSANews();

  return (
    <MainLayout>
      <SEOHead
        title="Driving News & Tips | Drive365"
        description="Latest DVSA news, driving test updates, and helpful tips for learner drivers across the UK."
      />

      {/* Hero */}
      <section className="bg-background pt-16 pb-12">
        <div className="container max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-5xl font-black mb-3">News & Tips</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stay up to date with the latest DVSA news, driving test changes, and helpful tips for your driving journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="container max-w-5xl">
          {newsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : dvsaNews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dvsaNews.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/news/${article.slug}`} className="group block">
                    <div className="rounded-2xl overflow-hidden shadow-md mb-4">
                      <img
                        src={article.imageUrl || fallbackImages[i % fallbackImages.length]}
                        alt={article.title}
                        className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100 mb-2">
                      {article.category || "DVSA News"}
                    </Badge>
                    <h2 className="font-bold text-lg mb-1 group-hover:text-amber-600 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {article.pubDate
                        ? new Date(article.pubDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}{" "}
                      • 3 min read
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No news articles available right now. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
