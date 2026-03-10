import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, ExternalLink, Newspaper, BookOpen, TrendingUp, Sparkles, ChevronRight, Bookmark, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import newsFeatured from "@/assets/news-featured.jpg";
import newsArticle1 from "@/assets/news-article1.jpg";
import newsArticle2 from "@/assets/news-article2.jpg";

const mockNews = [
  { title: "New Driving Test Changes Coming in 2026", description: "Major updates to the practical driving test have been announced by the DVSA, including new manoeuvres and updated marking criteria.", category: "DVSA News", date: "5 Mar 2026", image: newsFeatured },
  { title: "How to Beat Test Day Nerves", description: "Expert tips from top instructors on staying calm and focused during your practical test.", category: "Tips", date: "2 Mar 2026", image: newsArticle1 },
  { title: "Theory Test Pass Rate Hits Record Low", description: "New statistics show theory test pass rates have dropped to their lowest point in a decade.", category: "Statistics", date: "28 Feb 2026", image: newsArticle2 },
];

const DemoNewsSections = () => {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const variants = [
    { id: "v1", label: "1 — Classic Grid" },
    { id: "v2", label: "2 — Magazine" },
    { id: "v3", label: "3 — Dark Editorial" },
    { id: "v4", label: "4 — Card Stack" },
    { id: "v5", label: "5 — Horizontal Scroll" },
    { id: "v6", label: "6 — Newspaper" },
    { id: "v7", label: "7 — Minimal List" },
    { id: "v8", label: "8 — Bento Grid" },
    { id: "v9", label: "9 — Warm Blog" },
    { id: "v10", label: "10 — Compact Ticker" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">News & Tips Section Variants</h1>
              <p className="text-sm text-muted-foreground">Choose a design for the Drive365 homepage</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActiveVariant(null)}>Show All</Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <Button key={v.id} size="sm" variant={activeVariant === v.id ? "default" : "outline"}
                onClick={() => setActiveVariant(activeVariant === v.id ? null : v.id)} className="text-xs h-7 px-2.5"
              >{v.label}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6" />

      {/* V1 — Classic Featured + Side */}
      {(!activeVariant || activeVariant === "v1") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V1 — Classic Grid</Badge></div>
          <div className="bg-background py-12">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black">Latest News & Tips</h2>
                <Button variant="outline" className="gap-2">View All <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-8 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                  className="group relative overflow-hidden rounded-2xl shadow-lg"
                >
                  <img src={mockNews[0].image} alt={mockNews[0].title} className="h-96 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge className="mb-3 bg-primary text-primary-foreground border-0">{mockNews[0].category}</Badge>
                    <h3 className="text-2xl font-bold text-white mb-2">{mockNews[0].title}</h3>
                    <p className="text-sm text-white/80">{mockNews[0].description}</p>
                  </div>
                </motion.div>
                <div className="flex flex-col gap-6">
                  {mockNews.slice(1).map((article, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                      className="group flex gap-4 rounded-xl bg-card p-4 shadow-md hover:shadow-lg transition-shadow"
                    >
                      <img src={article.image} alt={article.title} className="h-24 w-24 rounded-lg object-cover shrink-0" />
                      <div className="flex flex-col justify-center">
                        <Badge className="mb-1 w-fit bg-primary/10 text-primary border-0 text-xs">{article.category}</Badge>
                        <h4 className="font-semibold group-hover:text-primary transition-colors">{article.title}</h4>
                        <span className="text-xs text-muted-foreground mt-1">{article.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V2 — Magazine 3-Column */}
      {(!activeVariant || activeVariant === "v2") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V2 — Magazine</Badge></div>
          <div className="bg-stone-50 py-16">
            <div className="container">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                  <Newspaper className="h-4 w-4" /> News & Tips
                </div>
                <h2 className="text-4xl font-black">Stay In The Know</h2>
                <p className="text-muted-foreground mt-2">The latest from DVSA, tips from instructors, and driving insights</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {mockNews.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
                  >
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Badge className="absolute top-3 left-3 bg-white/90 text-foreground border-0 text-xs backdrop-blur">{article.category}</Badge>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                      <span className="text-sm font-semibold text-primary flex items-center gap-1 mt-4 group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V3 — Dark Editorial */}
      {(!activeVariant || activeVariant === "v3") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V3 — Dark Editorial</Badge></div>
          <div className="bg-zinc-950 py-16">
            <div className="container">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-2">Latest Updates</div>
                  <h2 className="text-3xl font-black text-white">News & Tips</h2>
                </div>
                <Button variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  All Articles <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {mockNews.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                    className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group hover:border-zinc-700 transition-colors"
                  >
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="h-44 w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs hover:bg-amber-500/20">{article.category}</Badge>
                        <span className="text-xs text-zinc-500">{article.date}</span>
                      </div>
                      <h3 className="font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{article.title}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2">{article.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V4 — Card Stack (stacked overlap) */}
      {(!activeVariant || activeVariant === "v4") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V4 — Card Stack</Badge></div>
          <div className="bg-background py-16">
            <div className="container max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black">Latest News & Tips</h2>
                <p className="text-muted-foreground mt-2">Everything you need to know about learning to drive</p>
              </div>
              <div className="space-y-5">
                {mockNews.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                    className="flex gap-6 rounded-2xl bg-card p-5 shadow-md border hover:shadow-lg transition-shadow group"
                  >
                    <img src={article.image} alt={article.title} className="h-32 w-44 rounded-xl object-cover shrink-0" />
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">{article.category}</Badge>
                        <span className="text-xs text-muted-foreground">{article.date}</span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-1">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                      <span className="text-sm font-semibold text-primary flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                        Read Article <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V5 — Horizontal Scroll Cards */}
      {(!activeVariant || activeVariant === "v5") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V5 — Horizontal Scroll</Badge></div>
          <div className="bg-gradient-to-b from-blue-50/50 to-background py-16">
            <div className="container">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Badge className="mb-2 bg-blue-100 text-blue-700 border-0 hover:bg-blue-100"><BookOpen className="h-3 w-3 mr-1" />Blog</Badge>
                  <h2 className="text-3xl font-black">News & Tips</h2>
                </div>
                <Button variant="outline" className="gap-2">View All <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
                {[...mockNews, ...mockNews].slice(0, 4).map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                    className="min-w-[300px] flex-shrink-0 snap-start bg-card rounded-2xl overflow-hidden shadow-md group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative overflow-hidden">
                      <img src={article.image} alt={article.title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur">
                        <Clock className="h-3 w-3" /> 3 min read
                      </div>
                    </div>
                    <div className="p-4">
                      <Badge className="mb-2 bg-primary/10 text-primary border-0 text-xs">{article.category}</Badge>
                      <h3 className="font-bold mb-1 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                      <p className="text-xs text-muted-foreground">{article.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V6 — Newspaper Layout */}
      {(!activeVariant || activeVariant === "v6") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V6 — Newspaper</Badge></div>
          <div className="bg-amber-50/40 py-16">
            <div className="container">
              <div className="border-b-4 border-double border-zinc-900 pb-3 mb-8">
                <h2 className="text-4xl font-black text-center tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>The Drive365 Gazette</h2>
                <p className="text-center text-sm text-muted-foreground mt-1" style={{ fontFamily: 'Georgia, serif' }}>Your weekly driving news & tips — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Lead story */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                  className="lg:col-span-2 group"
                >
                  <img src={mockNews[0].image} alt={mockNews[0].title} className="w-full h-64 object-cover rounded-xl mb-4" />
                  <Badge className="mb-2 bg-zinc-900 text-white border-0">{mockNews[0].category}</Badge>
                  <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{mockNews[0].title}</h3>
                  <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>{mockNews[0].description}</p>
                </motion.div>
                {/* Side stories */}
                <div className="space-y-6">
                  {mockNews.slice(1).map((article, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                      className="border-b pb-5 last:border-0 group"
                    >
                      <Badge className="mb-2 bg-primary/10 text-primary border-0 text-xs">{article.category}</Badge>
                      <h4 className="font-bold mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'Georgia, serif' }}>{article.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>{article.description}</p>
                      <span className="text-xs text-muted-foreground mt-2 block">{article.date}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V7 — Minimal List */}
      {(!activeVariant || activeVariant === "v7") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V7 — Minimal List</Badge></div>
          <div className="bg-background py-16">
            <div className="container max-w-3xl">
              <h2 className="text-3xl font-black mb-2">News & Tips</h2>
              <p className="text-muted-foreground mb-10">Latest from the world of driving</p>
              <div className="divide-y">
                {mockNews.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }}
                    className="py-6 flex items-center justify-between gap-6 group cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{article.category}</span>
                        <span className="text-xs text-muted-foreground">• {article.date}</span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{article.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="outline" className="gap-2 w-full">View All Articles <ExternalLink className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V8 — Bento Grid */}
      {(!activeVariant || activeVariant === "v8") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V8 — Bento Grid</Badge></div>
          <div className="bg-zinc-100 py-16">
            <div className="container">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black">Latest News & Tips</h2>
              </div>
              <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[500px]">
                {/* Big featured */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
                  className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group"
                >
                  <img src={mockNews[0].image} alt={mockNews[0].title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge className="mb-2 bg-white/20 text-white border-0 backdrop-blur">{mockNews[0].category}</Badge>
                    <h3 className="text-xl font-bold text-white">{mockNews[0].title}</h3>
                    <p className="text-sm text-white/70 mt-1 line-clamp-2">{mockNews[0].description}</p>
                  </div>
                </motion.div>

                {/* Top right */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
                  className="col-span-2 relative rounded-2xl overflow-hidden group"
                >
                  <img src={mockNews[1].image} alt={mockNews[1].title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <Badge className="mb-1 bg-white/20 text-white border-0 backdrop-blur text-xs">{mockNews[1].category}</Badge>
                    <h3 className="font-bold text-white">{mockNews[1].title}</h3>
                  </div>
                </motion.div>

                {/* Bottom right */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}
                  className="col-span-2 relative rounded-2xl overflow-hidden group"
                >
                  <img src={mockNews[2].image} alt={mockNews[2].title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <Badge className="mb-1 bg-white/20 text-white border-0 backdrop-blur text-xs">{mockNews[2].category}</Badge>
                    <h3 className="font-bold text-white">{mockNews[2].title}</h3>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V9 — Warm Blog */}
      {(!activeVariant || activeVariant === "v9") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V9 — Warm Blog</Badge></div>
          <div className="bg-gradient-to-b from-orange-50 to-background py-16">
            <div className="container max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-4xl font-black">News & Tips</h2>
                <p className="text-muted-foreground mt-2">Helpful reads for your driving journey</p>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-8">
                {mockNews.map((article, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} viewport={{ once: true }}
                    className="group"
                  >
                    <div className="rounded-2xl overflow-hidden shadow-md mb-4">
                      <img src={article.image} alt={article.title} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs hover:bg-amber-100 mb-2">{article.category}</Badge>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-amber-600 transition-colors">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {article.date} • 3 min read
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Button variant="outline" className="gap-2">View All Articles <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V10 — Compact Ticker */}
      {(!activeVariant || activeVariant === "v10") && (
        <section className="py-8">
          <div className="container"><Badge variant="outline" className="mb-6">V10 — Compact Ticker</Badge></div>
          <div className="bg-background py-12">
            <div className="container">
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="bg-zinc-900 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-bold text-white">Latest News & Tips</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white gap-1 text-xs h-7">
                    View All <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <div className="divide-y">
                  {mockNews.map((article, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.3, delay: i * 0.1 }} viewport={{ once: true }}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                    >
                      <img src={article.image} alt={article.title} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0">{article.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{article.date}</span>
                        </div>
                        <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{article.title}</h4>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="h-20" />
    </div>
  );
};

export default DemoNewsSections;
