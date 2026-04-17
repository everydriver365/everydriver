import { useState } from "react";
import { Globe, Layout, Sparkles, Eye, Share2, ExternalLink, Palette, Code, Car, Pencil } from "lucide-react";
import { CarStickerGenerator } from "@/components/instructor/CarStickerGenerator";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { PageSkeleton } from "@/components/ui/skeletons/PageSkeleton";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { MiniWebsiteShare } from "@/components/instructor/MiniWebsiteShare";
import { MiniWebsiteCMS } from "@/components/instructor/MiniWebsiteCMS";
import { MiniWebsiteThemeEditor } from "@/components/instructor/MiniWebsiteThemeEditor";
import { WordPressEmbedSnippet } from "@/components/instructor/WordPressEmbedSnippet";
import { WebsitePageEditor } from "@/components/instructor/WebsitePageEditor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function InstructorMiniWebsiteSettings() {
  const { instructor: authInstructor, refreshInstructor } = useInstructorAuth();
  const instructorId = authInstructor?.id;
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  const handleVisibilityToggle = async (isVisible: boolean) => {
    if (!instructorId) return;
    setUpdatingVisibility(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ is_active: isVisible })
        .eq("id", instructorId);

      if (error) throw error;
      await refreshInstructor();
      toast.success(isVisible ? "Website is now visible" : "Website is now hidden");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const websiteUrl = authInstructor?.custom_domain 
    ? `https://${authInstructor.custom_domain}` 
    : authInstructor?.app_slug 
      ? `${window.location.origin}/i/${authInstructor.app_slug}` 
      : null;

  if (!instructorId) {
    return (
      <InstructorPortalLayout>
        <PageSkeleton />
      </InstructorPortalLayout>
    );
  }

  return (
    <InstructorPortalLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Mini Website
            </h1>
            <p className="text-muted-foreground">
              Manage your personal instructor website
            </p>
          </div>
          
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Live Site
              </Button>
            </a>
          )}
        </div>

        {/* Quick Stats / Info Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              {/* Drive365 Subdomain */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Your Drive365 Website</p>
                    {authInstructor?.app_slug ? (
                      <p className="text-sm text-primary font-mono">
                        {authInstructor.app_slug}.drive365.co.uk
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Setting up...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="website-visibility"
                      checked={authInstructor?.is_active ?? false}
                      onCheckedChange={handleVisibilityToggle}
                      disabled={updatingVisibility}
                    />
                    <Label htmlFor="website-visibility" className="text-sm">
                      {authInstructor?.is_active ? "Visible" : "Hidden"}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Custom Domain (if set and not the drive365 subdomain) */}
              {authInstructor?.custom_domain && !authInstructor.custom_domain.endsWith('.drive365.co.uk') && (
                <div className="flex items-center gap-3 pt-3 border-t border-primary/10">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Custom Domain</p>
                    <p className="text-sm font-mono">{authInstructor.custom_domain}</p>
                  </div>
                  <div className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                    authInstructor.custom_domain_verified 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-orange-500/10 text-orange-600'
                  }`}>
                    {authInstructor.custom_domain_verified ? '✓ Verified' : '⏳ Pending'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pages" className="space-y-4">
          <div className="-mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-visible">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-7 gap-1">
              <TabsTrigger value="pages" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Layout className="h-4 w-4" />
                <span className="sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Palette className="h-4 w-4" />
                <span className="sm:inline">Design</span>
              </TabsTrigger>
              <TabsTrigger value="share" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Share2 className="h-4 w-4" />
                <span className="sm:inline">Share</span>
              </TabsTrigger>
              <TabsTrigger value="sticker" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Car className="h-4 w-4" />
                <span className="sm:inline">Sticker</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Pencil className="h-4 w-4" />
                <span className="sm:inline">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Code className="h-4 w-4" />
                <span className="sm:inline">Embed</span>
              </TabsTrigger>
              <TabsTrigger value="visibility" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Eye className="h-4 w-4" />
                <span className="sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pages Tab */}
          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layout className="h-5 w-5 text-primary" />
                  Website Pages
                </CardTitle>
                <CardDescription>
                  Edit your 5-page mini-website content, headings, and images
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authInstructor?.app_slug ? (
                  <MiniWebsiteCMS 
                    instructorId={instructorId} 
                    instructorSlug={authInstructor.app_slug}
                    customDomain={authInstructor.custom_domain}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your website URL is being set up. Please refresh in a moment.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Website Design
                </CardTitle>
                <CardDescription>
                  Customize colors, fonts, header styles, and branding for your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MiniWebsiteThemeEditor
                  instructorId={instructorId}
                  currentSettings={{
                    website_theme: authInstructor?.website_theme,
                    website_font: authInstructor?.website_font,
                    website_header_style: authInstructor?.website_header_style,
                    brand_colour: authInstructor?.brand_colour,
                    secondary_colour: authInstructor?.secondary_colour,
                    website_button_color: authInstructor?.website_button_color,
                    website_footer_bg: authInstructor?.website_footer_bg,
                    logo_url: authInstructor?.logo_url,
                    phone: authInstructor?.phone,
                    email: authInstructor?.email,
                  }}
                  onUpdate={refreshInstructor}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Share2 className="h-5 w-5 text-primary" />
                  Share Your Website
                </CardTitle>
                <CardDescription>
                  Share your mini-website link with potential students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MiniWebsiteShare instructorId={instructorId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sticker Tab */}
          <TabsContent value="sticker">
            <CarStickerGenerator
              instructorName={authInstructor?.name || ""}
              instructorPhone={authInstructor?.phone || null}
              instructorSlug={authInstructor?.app_slug || null}
              logoUrl={authInstructor?.logo_url || null}
              brandColour={authInstructor?.brand_colour || null}
              customDomain={authInstructor?.custom_domain || null}
            />
          </TabsContent>

          {/* Page Editor Tab */}
          <TabsContent value="editor">
            <WebsitePageEditor instructorId={instructorId} />
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed">
            {authInstructor?.app_slug && (
              <WordPressEmbedSnippet
                slug={authInstructor.app_slug}
                brandColour={authInstructor.brand_colour}
              />
            )}
          </TabsContent>

          {/* Visibility/Settings Tab */}
          <TabsContent value="visibility">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-primary" />
                  Website Settings
                </CardTitle>
                <CardDescription>
                  Control your website visibility and listing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label className="font-medium">Listed on EveryDriver</Label>
                    <p className="text-sm text-muted-foreground">
                      Your courses will appear in search results when enabled
                    </p>
                  </div>
                  <Switch
                    checked={authInstructor?.is_active ?? false}
                    onCheckedChange={handleVisibilityToggle}
                    disabled={updatingVisibility}
                  />
                </div>

                <div className="rounded-lg border p-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Drive365 Website URL</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    This is your free Drive365 subdomain that you can share with students.
                  </p>
                  {authInstructor?.app_slug && (
                    <code className="block bg-background p-2 rounded text-sm font-mono text-primary">
                      {authInstructor.app_slug}.drive365.co.uk
                    </code>
                  )}
                </div>

                <div className="rounded-lg border p-4 bg-accent/50 border-accent">
                  <h4 className="font-medium mb-2">
                    Custom Domain
                  </h4>
                  {authInstructor?.custom_domain && !authInstructor.custom_domain.endsWith('.drive365.co.uk') ? (
                    <div className="space-y-2">
                      <code className="block bg-background p-2 rounded text-sm font-mono">
                        {authInstructor.custom_domain}
                      </code>
                      <p className={`text-sm ${authInstructor.custom_domain_verified ? 'text-green-600' : 'text-orange-600'}`}>
                        {authInstructor.custom_domain_verified ? '✓ Domain verified' : '⏳ Pending verification'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        Want your own domain like <strong>www.yourname.co.uk</strong>? 
                        Visit the Domains section to purchase and link a custom domain.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/instructor/domains">Manage Domains</a>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
