import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArloPageLayout } from "@/components/ui/arlo-page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Globe, MoreHorizontal, Search, ExternalLink, CheckCircle, 
  XCircle, Palette, Link2, Edit, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MiniWebsiteFullEditor } from "./MiniWebsiteFullEditor";

interface MiniWebsite {
  id: string;
  name: string;
  email: string | null;
  app_slug: string | null;
  website_theme: string | null;
  website_font?: string | null;
  website_header_style?: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  is_active: boolean;
  created_at: string;
  brand_colour: string | null;
  secondary_colour: string | null;
  website_button_color: string | null;
  website_footer_bg: string | null;
  website_text_color?: string | null;
  website_heading_color?: string | null;
  logo_url: string | null;
  hero_image_url?: string | null;
  bio: string | null;
  phone?: string | null;
  mini_website_domain_id: string | null;
}

interface DomainOrder {
  id: string;
  domain_name: string;
  status: string;
  mini_website_linked: boolean;
}

export function MiniWebsitesManager() {
  const [websites, setWebsites] = useState<MiniWebsite[]>([]);
  const [domains, setDomains] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Full-screen editor state
  const [editingWebsite, setEditingWebsite] = useState<MiniWebsite | null>(null);

  useEffect(() => {
    fetchWebsites();
    fetchDomains();
  }, []);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, email, app_slug, website_theme, custom_domain, custom_domain_verified, is_active, created_at, brand_colour, secondary_colour, website_button_color, website_footer_bg, website_text_color, website_heading_color, logo_url, bio, mini_website_domain_id, phone, hero_image_url, website_font, website_header_style")
        .not("app_slug", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error("Error fetching mini websites:", error);
      toast.error("Failed to load mini websites");
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from("domain_orders")
        .select("id, domain_name, status, mini_website_linked")
        .in("status", ["active", "completed"])
        .order("domain_name");

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error("Error fetching domains:", error);
    }
  };

  const filteredWebsites = websites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.app_slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.custom_domain?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && site.is_active;
    if (statusFilter === "inactive") return matchesSearch && !site.is_active;
    if (statusFilter === "custom-domain") return matchesSearch && site.custom_domain;
    return matchesSearch;
  });

  const totalWebsites = websites.length;
  const activeWebsites = websites.filter((s) => s.is_active).length;
  const withCustomDomain = websites.filter((s) => s.custom_domain).length;
  const verifiedDomains = websites.filter((s) => s.custom_domain_verified).length;

  const stats = [
    { label: "Total Sites", value: totalWebsites.toString() },
    { label: "Active", value: activeWebsites.toString(), color: "success" as const },
    { label: "Custom Domains", value: withCustomDomain.toString() },
    { label: "Verified", value: verifiedDomains.toString(), color: "success" as const },
  ];

  const getWebsiteUrl = (slug: string | null, customDomain: string | null) => {
    if (customDomain) return `https://${customDomain}`;
    if (!slug) return null;
    return `https://everydriver.lovable.app/i/${slug}`;
  };

  const handleEditWebsite = (website: MiniWebsite) => {
    setEditingWebsite(website);
  };

  const handleCloseEditor = () => {
    setEditingWebsite(null);
  };

  const handleSaveComplete = () => {
    setEditingWebsite(null);
    fetchWebsites();
    fetchDomains();
  };

  // Show full-screen editor if editing
  if (editingWebsite) {
    return (
      <MiniWebsiteFullEditor
        website={editingWebsite}
        domains={domains}
        onClose={handleCloseEditor}
        onSave={handleSaveComplete}
      />
    );
  }

  return (
    <ArloPageLayout stats={stats}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="custom-domain">With Custom Domain</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => { fetchWebsites(); fetchDomains(); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Instructor</TableHead>
              <TableHead>Slug / URL</TableHead>
              <TableHead>Custom Domain</TableHead>
              <TableHead className="text-center">Theme</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading mini websites...
                </TableCell>
              </TableRow>
            ) : filteredWebsites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No mini websites found
                </TableCell>
              </TableRow>
            ) : (
              filteredWebsites.map((site) => (
                <TableRow 
                  key={site.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleEditWebsite(site)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {site.brand_colour && (
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: site.brand_colour }}
                        />
                      )}
                      <span className="font-medium">{site.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {site.app_slug ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /i/{site.app_slug}
                        </code>
                        <a
                          href={getWebsiteUrl(site.app_slug, null) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No slug</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {site.custom_domain ? (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{site.custom_domain}</span>
                        {site.custom_domain_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        No domain
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {site.website_theme ? (
                      <Badge variant="outline" className="text-xs capitalize">
                        <Palette className="h-3 w-3 mr-1" />
                        {site.website_theme}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Default</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        site.is_active 
                          ? "bg-green-500/10 text-green-600 border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {site.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(site.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditWebsite(site); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Website
                        </DropdownMenuItem>
                        {site.app_slug && (
                          <DropdownMenuItem 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              window.open(getWebsiteUrl(site.app_slug, site.custom_domain), "_blank"); 
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Website
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ArloPageLayout>
  );
}
