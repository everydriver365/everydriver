import { useState } from "react";
import { FeaturePageHero } from "@/components/instructor-features/FeaturePageHero";
import websiteImg from "@/assets/features/website-showcase.png";
import { motion } from "framer-motion";
import { Search, Globe, Server, Shield, Check, Loader2, ShoppingCart, ExternalLink, Star, Users, TrendingUp, Smartphone, Award, MapPin } from "lucide-react";
import { InstructorSaaSLayout } from "@/components/layout/InstructorSaaSLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DomainCheckoutModal } from "@/components/instructor/DomainCheckoutModal";
import { HostingCheckoutModal } from "@/components/instructor/HostingCheckoutModal";

interface DomainResult {
  domain: string;
  available: boolean;
  premium?: boolean;
  price?: number;
  currency?: string;
  period?: number;
  error?: boolean;
}

interface HostingPackage {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  features: string[];
}

const defaultHostingPackages: HostingPackage[] = [
  {
    id: 'starter',
    name: 'Starter Hosting',
    type: 'shared',
    price: 4.99,
    currency: 'GBP',
    features: ['5GB Storage', '50GB Bandwidth', '1 Website', 'Free SSL', 'Email Hosting']
  },
  {
    id: 'business',
    name: 'Business Hosting',
    type: 'shared',
    price: 9.99,
    currency: 'GBP',
    features: ['25GB Storage', '250GB Bandwidth', '10 Websites', 'Free SSL', 'Email Hosting', 'Daily Backups']
  },
  {
    id: 'professional',
    name: 'Professional Hosting',
    type: 'shared',
    price: 19.99,
    currency: 'GBP',
    features: ['Unlimited Storage', 'Unlimited Bandwidth', 'Unlimited Websites', 'Free SSL', 'Email Hosting', 'Daily Backups', 'Priority Support']
  },
];

export default function InstructorDomains() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>(defaultHostingPackages);
  const [isLoadingHosting, setIsLoadingHosting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
  const [selectedHosting, setSelectedHosting] = useState<HostingPackage | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a domain name to search");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setAvailabilityError(null);
    setDomainResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('twentyi-api', {
        body: {
          action: 'check-multiple',
          domain: searchQuery.toLowerCase().replace(/\s+/g, ''),
        },
      });

      if (error) throw error;

      if (!Array.isArray(data)) {
        throw new Error('Invalid response from domain lookup');
      }

      setDomainResults(data);
    } catch (error) {
      console.error('Error searching domains:', error);
      toast.error("Failed to search domains. Please try again.");
      setAvailabilityError(
        'Domain lookup is currently unavailable. Please try again later.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const loadHostingPackages = async () => {
    setIsLoadingHosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('twentyi-api', {
        body: { action: 'get-hosting-packages' },
      });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        setHostingPackages(data);
      }
    } catch (error) {
      console.error('Error loading hosting packages:', error);
      // Keep default packages
    } finally {
      setIsLoadingHosting(false);
    }
  };

  const handlePurchase = (result: DomainResult) => {
    setSelectedDomain(result);
  };

  const handleHostingPurchase = (plan: HostingPackage) => {
    setSelectedHosting(plan);
  };

  return (
    <InstructorSaaSLayout>
      {/* Checkout Modals */}
      {selectedDomain && (
        <DomainCheckoutModal
          open={!!selectedDomain}
          onOpenChange={(open) => !open && setSelectedDomain(null)}
          domain={selectedDomain.domain}
          price={selectedDomain.price || 0}
          currency={selectedDomain.currency || "GBP"}
          onSuccess={() => {
            setSelectedDomain(null);
            // Refresh results
            handleSearch();
          }}
        />
      )}
      {selectedHosting && (
        <HostingCheckoutModal
          open={!!selectedHosting}
          onOpenChange={(open) => !open && setSelectedHosting(null)}
          package_={selectedHosting}
          onSuccess={() => setSelectedHosting(null)}
        />
      )}
      {/* Hero - Feature Tile */}
      <FeaturePageHero
        icon={Globe}
        title="Your Own Professional Website"
        description="Get a branded .co.uk website with direct pupil booking. Show up in Google searches and stand out from the competition."
        features={["Custom domain name", "SEO optimised pages", "Online booking", "Review showcase"]}
        image={websiteImg}
      />

      {/* Why You Need a Custom Domain & Website */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Why It Matters</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Every Instructor Needs Their Own Website & Domain</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              You wouldn't teach without dual controls. So why run your business without a professional online presence?
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Card className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Get Found on Google</h3>
                <p className="text-muted-foreground">
                  When a learner searches "driving instructor near me", Google prioritises websites with custom domains over social media pages. A site like <strong>yourname-driving.co.uk</strong> tells Google you're a legitimate local business — not just another profile on a directory.
                </p>
                <p className="text-muted-foreground">
                  Without your own site, you're invisible to the 80% of learners who start their search on Google.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Look Professional, Win More Pupils</h3>
                <p className="text-muted-foreground">
                  Parents check you out before booking. A professional website with your own domain, reviews, pricing, and booking instantly builds trust. A Facebook page or free subdomain doesn't.
                </p>
                <p className="text-muted-foreground">
                  First impressions matter — and your website is your first impression for every new enquiry.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Take Bookings 24/7</h3>
                <p className="text-muted-foreground">
                  Your phone is off during lessons. Your website isn't. With online booking built in, pupils can check your availability and book while you're teaching — no missed calls, no lost revenue.
                </p>
                <p className="text-muted-foreground">
                  Every hour you're not answering your phone is an hour your website is working for you.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Own Your Brand, Not Someone Else's</h3>
                <p className="text-muted-foreground">
                  When you rely on directories, aggregators, or social media, you're building <em>their</em> brand — not yours. A custom domain means your name, your reputation, and your pupils stay with you.
                </p>
                <p className="text-muted-foreground">
                  If a directory shuts down or changes its algorithm, you lose nothing — because your website is yours.
                </p>
              </CardContent>
            </Card>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center space-y-4">
                <Star className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-xl font-bold">The Numbers Don't Lie</h3>
                <div className="grid sm:grid-cols-3 gap-6 mt-6">
                  <div>
                    <p className="text-3xl font-bold text-primary">80%</p>
                    <p className="text-sm text-muted-foreground mt-1">of learners find instructors via Google — not word of mouth</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">5×</p>
                    <p className="text-sm text-muted-foreground mt-1">more enquiries with a professional website vs. a directory listing alone</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">24/7</p>
                    <p className="text-sm text-muted-foreground mt-1">bookings taken automatically — even while you're on a lesson</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container max-w-6xl">
          <Tabs defaultValue="domains" className="w-full" onValueChange={(value) => {
            if (value === 'hosting') {
              loadHostingPackages();
            }
          }}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="domains">
                <Globe className="w-4 h-4 mr-2" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="hosting">
                <Server className="w-4 h-4 mr-2" />
                Hosting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="domains">
              {/* Search Results */}
              {hasSearched && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold mb-6">Search Results</h2>

                  {availabilityError && (
                    <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                      <p className="font-medium">Notice</p>
                      <p className="text-muted-foreground">{availabilityError}</p>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {domainResults.map((result, index) => (
                      <motion.div
                        key={result.domain}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={
                            result.error
                              ? 'border-destructive/30 bg-destructive/5'
                              : result.available
                                ? 'border-accent/30 bg-accent/5'
                                : 'border-border bg-muted/30'
                          }
                        >
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                              <Globe
                                className={
                                  `h-5 w-5 ${
                                    result.error
                                      ? 'text-destructive'
                                      : result.available
                                        ? 'text-accent'
                                        : 'text-muted-foreground'
                                  }`
                                }
                              />
                              <div>
                                <p className="font-semibold">{result.domain}</p>
                                {result.error ? (
                                  <p className="text-sm text-destructive">Couldn't check availability</p>
                                ) : result.available ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-accent">Available</p>
                                    {result.premium && (
                                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Taken</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {!result.error && result.available && result.price && (
                                <span className="font-bold text-lg">£{result.price.toFixed(2)}/yr</span>
                              )}

                              {result.error ? (
                                <Button variant="outline" size="sm" disabled>
                                  Check failed
                                </Button>
                              ) : result.available ? (
                                <Button
                                  variant="accent"
                                  size="sm"
                                  onClick={() => handlePurchase(result)}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Add to Cart
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  Unavailable
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Domain Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card>
                  <CardHeader>
                    <Shield className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Free Privacy Protection</CardTitle>
                    <CardDescription>
                      Keep your personal information private with free WHOIS privacy on all domains.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Globe className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Free DNS Management</CardTitle>
                    <CardDescription>
                      Full control over your DNS settings with an easy-to-use management panel.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <Server className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>Email Forwarding</CardTitle>
                    <CardDescription>
                      Create professional email addresses that forward to your existing inbox.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Popular TLDs Pricing */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Popular Domain Extensions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { tld: '.co.uk', price: 9.99, desc: 'Perfect for UK businesses' },
                    { tld: '.com', price: 12.99, desc: 'Most popular worldwide' },
                    { tld: '.uk', price: 5.99, desc: 'Short UK domain' },
                    { tld: '.org', price: 14.99, desc: 'For organizations' },
                    { tld: '.net', price: 14.99, desc: 'Great alternative' },
                    { tld: '.info', price: 4.99, desc: 'Information sites' },
                    { tld: '.biz', price: 14.99, desc: 'Business focused' },
                    { tld: '.me', price: 19.99, desc: 'Personal branding' },
                  ].map((item) => (
                    <Card key={item.tld} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xl font-bold text-primary">{item.tld}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">£{item.price}</p>
                            <p className="text-xs text-muted-foreground">/year</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hosting">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Web Hosting Plans</h2>
                <p className="text-muted-foreground">
                  Reliable hosting for your driving school website, powered by 20i
                </p>
              </div>

              {isLoadingHosting ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {hostingPackages.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`h-full ${index === 1 ? 'border-accent ring-2 ring-accent/20' : ''}`}>
                        {index === 1 && (
                          <div className="bg-accent text-accent-foreground text-center py-1 text-sm font-medium">
                            Most Popular
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription className="capitalize">{plan.type} Hosting</CardDescription>
                          <div className="mt-4">
                            <span className="text-3xl font-bold">£{plan.price}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full" 
                            variant={index === 1 ? 'accent' : 'outline'}
                            onClick={() => handleHostingPurchase(plan)}
                          >
                            Get Started
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Hosting Features */}
              <div className="mt-12 grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">99.9% Uptime</CardTitle>
                    <CardDescription>
                      Your website stays online with our reliable infrastructure and global CDN.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Free SSL Certificate</CardTitle>
                    <CardDescription>
                      Secure your website with HTTPS encryption included at no extra cost.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">1-Click WordPress</CardTitle>
                    <CardDescription>
                      Install WordPress with a single click and start building immediately.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-12">
        <div className="container max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help Choosing?</h2>
          <p className="text-muted-foreground mb-6">
            Our team can help you select the perfect domain and hosting package for your driving school.
          </p>
          <Button variant="accent" size="lg" asChild>
            <a href="/instructor-app/contact">
              Contact Our Team
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </InstructorSaaSLayout>
  );
}
