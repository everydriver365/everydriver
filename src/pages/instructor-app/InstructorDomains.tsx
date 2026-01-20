import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Globe, Server, Shield, Check, Loader2, ShoppingCart, ExternalLink } from "lucide-react";
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
        'Domain lookup is currently unavailable. Showing demo results for now.'
      );

      // Show mock results for demo
      const mockDomain = searchQuery.toLowerCase().replace(/\s+/g, '');
      setDomainResults([
        { domain: `${mockDomain}.co.uk`, available: true, price: 9.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.com`, available: true, price: 12.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.uk`, available: false, price: 5.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.org`, available: true, price: 14.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.net`, available: true, price: 14.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.info`, available: true, price: 4.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.biz`, available: false, price: 14.99, currency: 'GBP', period: 1 },
        { domain: `${mockDomain}.me`, available: true, price: 19.99, currency: 'GBP', period: 1 },
      ]);
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-16 md:py-20">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Globe className="w-3 h-3 mr-1" />
              Domain & Hosting Services
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Get Your Perfect Domain
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Secure your professional driving school domain and hosting. Build your online presence with trusted, reliable services powered by 20i.
            </p>

            {/* Domain Search */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Enter your domain name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 bg-background text-foreground"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                size="lg"
                variant="accent"
                className="h-12"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search Domains'
                )}
              </Button>
            </div>
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
