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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Globe, MoreHorizontal, Search, ExternalLink, CheckCircle, 
  XCircle, Palette, Link2, Edit, Unlink, Loader2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MiniWebsite {
  id: string;
  name: string;
  email: string | null;
  app_slug: string | null;
  website_theme: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean | null;
  is_active: boolean;
  created_at: string;
  brand_colour: string | null;
  bio: string | null;
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
  
  // Edit sheet state
  const [editingWebsite, setEditingWebsite] = useState<MiniWebsite | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Domain assignment dialog state
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [selectedWebsiteForDomain, setSelectedWebsiteForDomain] = useState<MiniWebsite | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [isAssigningDomain, setIsAssigningDomain] = useState(false);

  useEffect(() => {
    fetchWebsites();
    fetchDomains();
  }, []);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, name, email, app_slug, website_theme, custom_domain, custom_domain_verified, is_active, created_at, brand_colour, bio, mini_website_domain_id")
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
    setEditingWebsite({ ...website });
    setIsEditSheetOpen(true);
  };

  const handleSaveWebsite = async () => {
    if (!editingWebsite) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          app_slug: editingWebsite.app_slug,
          website_theme: editingWebsite.website_theme,
          brand_colour: editingWebsite.brand_colour,
          bio: editingWebsite.bio,
          is_active: editingWebsite.is_active,
        })
        .eq("id", editingWebsite.id);

      if (error) throw error;

      toast.success("Website updated successfully");
      setIsEditSheetOpen(false);
      setEditingWebsite(null);
      fetchWebsites();
    } catch (error) {
      console.error("Error updating website:", error);
      toast.error("Failed to update website");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDomainDialog = (website: MiniWebsite) => {
    setSelectedWebsiteForDomain(website);
    setSelectedDomainId(website.mini_website_domain_id || "");
    setDomainDialogOpen(true);
  };

  const handleAssignDomain = async () => {
    if (!selectedWebsiteForDomain) return;
    
    setIsAssigningDomain(true);
    try {
      const selectedDomain = domains.find(d => d.id === selectedDomainId);
      
      // Update the instructor with the new domain
      const { error: instructorError } = await supabase
        .from("instructors")
        .update({
          custom_domain: selectedDomain?.domain_name || null,
          custom_domain_verified: false,
          mini_website_domain_id: selectedDomainId || null,
        })
        .eq("id", selectedWebsiteForDomain.id);

      if (instructorError) throw instructorError;

      // Update the domain_orders table
      if (selectedDomainId) {
        const { error: domainError } = await supabase
          .from("domain_orders")
          .update({ mini_website_linked: true })
          .eq("id", selectedDomainId);

        if (domainError) throw domainError;
      }

      // If there was a previous domain, unlink it
      if (selectedWebsiteForDomain.mini_website_domain_id && 
          selectedWebsiteForDomain.mini_website_domain_id !== selectedDomainId) {
        await supabase
          .from("domain_orders")
          .update({ mini_website_linked: false })
          .eq("id", selectedWebsiteForDomain.mini_website_domain_id);
      }

      toast.success(selectedDomainId ? "Domain assigned successfully" : "Domain unlinked successfully");
      setDomainDialogOpen(false);
      setSelectedWebsiteForDomain(null);
      setSelectedDomainId("");
      fetchWebsites();
      fetchDomains();
    } catch (error) {
      console.error("Error assigning domain:", error);
      toast.error("Failed to assign domain");
    } finally {
      setIsAssigningDomain(false);
    }
  };

  const handleUnlinkDomain = async (website: MiniWebsite) => {
    try {
      // Update the instructor
      const { error: instructorError } = await supabase
        .from("instructors")
        .update({
          custom_domain: null,
          custom_domain_verified: false,
          mini_website_domain_id: null,
        })
        .eq("id", website.id);

      if (instructorError) throw instructorError;

      // Update the domain_orders table
      if (website.mini_website_domain_id) {
        await supabase
          .from("domain_orders")
          .update({ mini_website_linked: false })
          .eq("id", website.mini_website_domain_id);
      }

      toast.success("Domain unlinked successfully");
      fetchWebsites();
      fetchDomains();
    } catch (error) {
      console.error("Error unlinking domain:", error);
      toast.error("Failed to unlink domain");
    }
  };

  // Available domains (not linked or linked to this website)
  const availableDomains = domains.filter(
    d => !d.mini_website_linked || 
         (selectedWebsiteForDomain && d.id === selectedWebsiteForDomain.mini_website_domain_id)
  );

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
                <TableRow key={site.id} className="hover:bg-muted/50">
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
                        <a
                          href={`https://${site.custom_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          {site.custom_domain}
                        </a>
                        {site.custom_domain_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => handleOpenDomainDialog(site)}
                      >
                        <Link2 className="h-3 w-3 mr-1" />
                        Assign Domain
                      </Button>
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
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditWebsite(site)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Website
                        </DropdownMenuItem>
                        {site.app_slug && (
                          <DropdownMenuItem 
                            onClick={() => window.open(getWebsiteUrl(site.app_slug, site.custom_domain), "_blank")}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenDomainDialog(site)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          {site.custom_domain ? "Change Domain" : "Assign Domain"}
                        </DropdownMenuItem>
                        {site.custom_domain && (
                          <DropdownMenuItem 
                            onClick={() => handleUnlinkDomain(site)}
                            className="text-destructive"
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Unlink Domain
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

      {/* Edit Website Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Website</SheetTitle>
            <SheetDescription>
              Update the website settings for {editingWebsite?.name}
            </SheetDescription>
          </SheetHeader>
          
          {editingWebsite && (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="app_slug">Website Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/i/</span>
                  <Input
                    id="app_slug"
                    value={editingWebsite.app_slug || ""}
                    onChange={(e) => setEditingWebsite({
                      ...editingWebsite,
                      app_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    })}
                    placeholder="instructor-name"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL: everydriver.lovable.app/i/{editingWebsite.app_slug || "slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_theme">Theme</Label>
                <Select
                  value={editingWebsite.website_theme || "default"}
                  onValueChange={(value) => setEditingWebsite({
                    ...editingWebsite,
                    website_theme: value === "default" ? null : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_colour">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brand_colour"
                    type="color"
                    value={editingWebsite.brand_colour || "#1e3a5f"}
                    onChange={(e) => setEditingWebsite({
                      ...editingWebsite,
                      brand_colour: e.target.value
                    })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={editingWebsite.brand_colour || "#1e3a5f"}
                    onChange={(e) => setEditingWebsite({
                      ...editingWebsite,
                      brand_colour: e.target.value
                    })}
                    placeholder="#1e3a5f"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea
                  id="bio"
                  value={editingWebsite.bio || ""}
                  onChange={(e) => setEditingWebsite({
                    ...editingWebsite,
                    bio: e.target.value
                  })}
                  placeholder="A short description for the website..."
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Website Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable this website
                  </p>
                </div>
                <Button
                  variant={editingWebsite.is_active ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditingWebsite({
                    ...editingWebsite,
                    is_active: !editingWebsite.is_active
                  })}
                >
                  {editingWebsite.is_active ? "Active" : "Inactive"}
                </Button>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveWebsite}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Domain Assignment Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Custom Domain</DialogTitle>
            <DialogDescription>
              Select a domain to assign to {selectedWebsiteForDomain?.name}'s website
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="domain-select">Select Domain</Label>
            <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a domain..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No domain (unlink)</SelectItem>
                {availableDomains.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.domain_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableDomains.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No available domains. All domains are already linked to other websites.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignDomain} disabled={isAssigningDomain}>
              {isAssigningDomain && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedDomainId ? "Assign Domain" : "Unlink Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ArloPageLayout>
  );
}