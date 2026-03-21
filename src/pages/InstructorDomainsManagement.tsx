import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Server, Plus, Loader2, ExternalLink, ShoppingBag, Link, Settings } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { DomainManagementCard } from "@/components/instructor/DomainManagementCard";
import { HostingManagementCard } from "@/components/instructor/HostingManagementCard";
import { DNSManagementPanel } from "@/components/instructor/DNSManagementPanel";
import { DomainLinkModal } from "@/components/instructor/DomainLinkModal";
import { toast } from "sonner";

interface DomainOrder {
  id: string;
  domain_name: string;
  tld: string;
  status: string;
  price_amount: number;
  currency: string;
  period_years: number;
  auto_renew: boolean;
  expires_at?: string | null;
  created_at: string;
  mini_website_linked?: boolean;
  ssl_status?: string;
  ssl_provisioned_at?: string | null;
  ssl_expires_at?: string | null;
}

interface HostingOrder {
  id: string;
  domain_name: string;
  package_id: string;
  package_name: string;
  status: string;
  price_amount: number;
  currency: string;
  billing_period: string;
  expires_at: string | null;
  created_at: string;
}

export default function InstructorDomainsManagement() {
  const navigate = useNavigate();
  const { instructor, loading: authLoading } = useInstructorAuth();
  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [hostings, setHostings] = useState<HostingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomainForDNS, setSelectedDomainForDNS] = useState<DomainOrder | null>(null);
  const [selectedDomainForLink, setSelectedDomainForLink] = useState<DomainOrder | null>(null);

  useEffect(() => {
    if (!authLoading && instructor?.id) {
      fetchOrders();
    }
  }, [instructor?.id, authLoading]);

  const fetchOrders = async () => {
    if (!instructor?.id) return;
    
    setIsLoading(true);
    try {
      const [domainsResult, hostingsResult] = await Promise.all([
        supabase
          .from("domain_orders")
          .select("*")
          .eq("instructor_id", instructor.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("hosting_orders")
          .select("*")
          .eq("instructor_id", instructor.id)
          .order("created_at", { ascending: false }),
      ]);

      if (domainsResult.error) throw domainsResult.error;
      if (hostingsResult.error) throw hostingsResult.error;

      setDomains(domainsResult.data || []);
      setHostings(hostingsResult.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load your domains and hosting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageDomain = (domain: DomainOrder) => {
    setSelectedDomainForDNS(domain);
  };

  const handleRenewDomain = (domain: DomainOrder) => {
    toast.info(`Contact support to renew ${domain.domain_name}${domain.tld}`);
  };

  const handleLinkDomain = (domain: DomainOrder) => {
    setSelectedDomainForLink(domain);
  };

  const handleManageHosting = (hosting: HostingOrder) => {
    toast.info(`Contact support to manage hosting for ${hosting.domain_name}`);
  };

  const handleUpgradeHosting = (hosting: HostingOrder) => {
    toast.info(`Contact support to upgrade hosting for ${hosting.domain_name}`);
  };

  if (authLoading) {
    return (
      <InstructorPortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Domains & Hosting</h1>
            <p className="text-muted-foreground">
              Manage your domains and hosting packages
            </p>
          </div>
          <Button onClick={() => navigate("/instructor-app/domains")}>
            <Plus className="h-4 w-4 mr-2" />
            Get New Domain
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{domains.length}</p>
                  <p className="text-sm text-muted-foreground">Domains</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Server className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hostings.length}</p>
                  <p className="text-sm text-muted-foreground">Hosting</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {domains.filter((d) => d.status === "active").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Globe className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {domains.filter(
                      (d) =>
                        d.expires_at &&
                        new Date(d.expires_at).getTime() - Date.now() <
                          30 * 24 * 60 * 60 * 1000
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="domains" className="flex-1">
              <Globe className="h-4 w-4 mr-2" />
              My Domains ({domains.length})
            </TabsTrigger>
            <TabsTrigger value="hosting" className="flex-1">
              <Server className="h-4 w-4 mr-2" />
              My Hosting ({hostings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : domains.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No domains yet</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-sm">
                    Get a professional domain for your driving school to build your online presence.
                  </p>
                  <Button onClick={() => navigate("/instructor-app/domains")}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Domains
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <DomainManagementCard
                    key={domain.id}
                    domain={domain}
                    onManage={handleManageDomain}
                    onRenew={handleRenewDomain}
                    onLink={handleLinkDomain}
                    onRefresh={fetchOrders}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hosting" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hostings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Server className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No hosting yet</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-sm">
                    Get reliable web hosting to power your driving school website.
                  </p>
                  <Button onClick={() => navigate("/instructor-app/domains")}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Hosting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {hostings.map((hosting) => (
                  <HostingManagementCard
                    key={hosting.id}
                    hosting={hosting}
                    onManage={handleManageHosting}
                    onUpgrade={handleUpgradeHosting}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/instructor-app/domains")}
              >
                <Globe className="h-5 w-5" />
                <span>Search Domains</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/instructor/settings")}
              >
                <ExternalLink className="h-5 w-5" />
                <span>Mini Website</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => toast.info("DNS management coming soon")}
              >
                <Server className="h-5 w-5" />
                <span>DNS Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DNS Management Panel */}
        {selectedDomainForDNS && (
          <DNSManagementPanel
            domainOrderId={selectedDomainForDNS.id}
            domain={`${selectedDomainForDNS.domain_name}${selectedDomainForDNS.tld}`}
            onUpdate={fetchOrders}
          />
        )}

        {/* Link Domain Modal */}
        {selectedDomainForLink && instructor?.id && (
          <DomainLinkModal
            open={!!selectedDomainForLink}
            onOpenChange={(open) => !open && setSelectedDomainForLink(null)}
            domain={`${selectedDomainForLink.domain_name}${selectedDomainForLink.tld}`}
            domainOrderId={selectedDomainForLink.id}
            instructorId={instructor.id}
            miniWebsiteSlug={instructor.app_slug}
            onSuccess={() => {
              setSelectedDomainForLink(null);
              fetchOrders();
            }}
          />
        )}
      </div>
    </InstructorPortalLayout>
  );
}
