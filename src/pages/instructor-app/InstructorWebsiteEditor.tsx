import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, ExternalLink, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorWebsitePages, type WebsitePage } from "@/hooks/useInstructorWebsitePages";
import { useInstructorWebsiteSettings } from "@/hooks/useInstructorWebsiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PAGE_ORDER: WebsitePage["page_type"][] = ["home", "about", "services", "reviews", "contact"];

function PageEditor({
  page,
  onSave,
}: {
  page: WebsitePage;
  onSave: (updates: Partial<WebsitePage>) => Promise<{ success: boolean }>;
}) {
  const [draft, setDraft] = useState<WebsitePage>(page);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => setDraft(page), [page.id]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(page), [draft, page]);

  const set = <K extends keyof WebsitePage>(k: K, v: WebsitePage[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const res = await onSave({
      page_title: draft.page_title,
      hero_heading: draft.hero_heading,
      hero_subheading: draft.hero_subheading,
      hero_image_url: draft.hero_image_url,
      content_blocks: draft.content_blocks,
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
      is_published: draft.is_published,
      // SEO extras (cast — types regenerate after migration)
      ...({
        og_image_url: (draft as any).og_image_url ?? null,
        canonical_url: (draft as any).canonical_url ?? null,
        keywords: (draft as any).keywords ?? null,
        last_edited_at: new Date().toISOString(),
      } as any),
    });
    setSaving(false);
    if (res.success) {
      setSavedAt(Date.now());
      toast.success(`${draft.page_title} saved`);
    } else {
      toast.error("Save failed");
    }
  };

  const metaDescLen = (draft.meta_description || "").length;
  const metaTitleLen = (draft.meta_title || "").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{draft.page_title}</h2>
          <p className="text-xs text-muted-foreground">
            /{draft.page_type === "home" ? "" : draft.page_type}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={draft.is_published}
              onCheckedChange={(v) => set("is_published", v)}
            />
            Published
          </div>
          <Button onClick={save} disabled={!dirty || saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          {savedAt && !dirty && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 pt-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label>Page title</Label>
              <Input
                value={draft.page_title}
                onChange={(e) => set("page_title", e.target.value)}
              />
            </div>
            <div>
              <Label>Hero heading</Label>
              <Input
                value={draft.hero_heading || ""}
                onChange={(e) => set("hero_heading", e.target.value)}
                placeholder="Big headline at the top of the page"
              />
            </div>
            <div>
              <Label>Hero subheading</Label>
              <Textarea
                rows={2}
                value={draft.hero_subheading || ""}
                onChange={(e) => set("hero_subheading", e.target.value)}
                placeholder="Supporting line under the headline"
              />
            </div>
            <div>
              <Label>Hero image URL</Label>
              <Input
                value={draft.hero_image_url || ""}
                onChange={(e) => set("hero_image_url", e.target.value)}
                placeholder="https://…"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Content blocks (JSON)</Label>
              <span className="text-[11px] text-muted-foreground">
                Array of {`{ type, title, content, items[] }`}
              </span>
            </div>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              value={JSON.stringify(draft.content_blocks, null, 2)}
              onChange={(e) => {
                try {
                  set("content_blocks", JSON.parse(e.target.value));
                } catch {
                  // ignore invalid json
                }
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 pt-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label className="flex items-center justify-between">
                <span>Meta title</span>
                <span className={`text-[11px] ${metaTitleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {metaTitleLen}/60
                </span>
              </Label>
              <Input
                value={draft.meta_title || ""}
                onChange={(e) => set("meta_title", e.target.value)}
                placeholder="Driving Lessons in [Area] | [Your School]"
              />
            </div>
            <div>
              <Label className="flex items-center justify-between">
                <span>Meta description</span>
                <span className={`text-[11px] ${metaDescLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                  {metaDescLen}/160
                </span>
              </Label>
              <Textarea
                rows={3}
                value={draft.meta_description || ""}
                onChange={(e) => set("meta_description", e.target.value)}
                placeholder="One short paragraph that shows in Google results."
              />
            </div>
            <div>
              <Label>Keywords (comma separated)</Label>
              <Input
                value={(draft as any).keywords || ""}
                onChange={(e) => set("keywords" as any, e.target.value as any)}
                placeholder="driving lessons, watford, intensive course"
              />
            </div>
            <div>
              <Label>Open Graph image URL (1200x630)</Label>
              <Input
                value={(draft as any).og_image_url || ""}
                onChange={(e) => set("og_image_url" as any, e.target.value as any)}
                placeholder="https://…/share-image.jpg"
              />
            </div>
            <div>
              <Label>Canonical URL (optional)</Label>
              <Input
                value={(draft as any).canonical_url || ""}
                onChange={(e) => set("canonical_url" as any, e.target.value as any)}
                placeholder="https://yourdomain.co.uk/about"
              />
            </div>
          </Card>

          {metaDescLen > 0 && metaDescLen < 70 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Meta description is short. Aim for 120–160 chars to fill Google's snippet.
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SiteSettingsCard({ instructorId }: { instructorId: string }) {
  const { settings, loading, save } = useInstructorWebsiteSettings(instructorId);
  const [draft, setDraft] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setDraft(settings);
    else if (!loading) setDraft({
      instructor_id: instructorId,
      site_tagline: "",
      default_meta_description: "",
      default_keywords: "",
      default_og_image_url: "",
      google_analytics_id: "",
      google_site_verification: "",
      robots_indexable: true,
    });
  }, [settings, loading, instructorId]);

  if (!draft) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Site-wide SEO defaults</h3>
        <Button
          size="sm"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const ok = await save(draft);
            setSaving(false);
            toast[ok ? "success" : "error"](ok ? "Settings saved" : "Save failed");
          }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save defaults
        </Button>
      </div>
      <div>
        <Label>Site tagline</Label>
        <Input
          value={draft.site_tagline || ""}
          onChange={(e) => setDraft({ ...draft, site_tagline: e.target.value })}
        />
      </div>
      <div>
        <Label>Default meta description</Label>
        <Textarea
          rows={2}
          value={draft.default_meta_description || ""}
          onChange={(e) => setDraft({ ...draft, default_meta_description: e.target.value })}
        />
      </div>
      <div>
        <Label>Default keywords</Label>
        <Input
          value={draft.default_keywords || ""}
          onChange={(e) => setDraft({ ...draft, default_keywords: e.target.value })}
        />
      </div>
      <div>
        <Label>Default OG image URL</Label>
        <Input
          value={draft.default_og_image_url || ""}
          onChange={(e) => setDraft({ ...draft, default_og_image_url: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Google Analytics ID</Label>
          <Input
            value={draft.google_analytics_id || ""}
            onChange={(e) => setDraft({ ...draft, google_analytics_id: e.target.value })}
            placeholder="G-XXXXXXXXXX"
          />
        </div>
        <div>
          <Label>Google site verification</Label>
          <Input
            value={draft.google_site_verification || ""}
            onChange={(e) => setDraft({ ...draft, google_site_verification: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Switch
          checked={!!draft.robots_indexable}
          onCheckedChange={(v) => setDraft({ ...draft, robots_indexable: v })}
        />
        <Label className="!mb-0">Allow search engines to index this site</Label>
      </div>
    </Card>
  );
}

export default function InstructorWebsiteEditor() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const { pages, loading, updatePage } = useInstructorWebsitePages(instructorId);
  const [activeType, setActiveType] = useState<WebsitePage["page_type"]>("home");

  const ordered = useMemo(
    () => [...pages].sort(
      (a, b) => PAGE_ORDER.indexOf(a.page_type) - PAGE_ORDER.indexOf(b.page_type)
    ),
    [pages]
  );
  const activePage = ordered.find((p) => p.page_type === activeType) || ordered[0];

  const previewSlug = (instructor as any)?.app_slug;
  const previewUrl = previewSlug
    ? `https://everydriver.lovable.app/i/${previewSlug}${activeType === "home" ? "" : `/${activeType}`}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!instructorId) {
    return <div className="p-6 text-sm text-muted-foreground">Sign in to edit your website.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit each page's content and SEO. Changes go live immediately.
          </p>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View live <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <SiteSettingsCard instructorId={instructorId} />

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <nav className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 mb-1">
            Pages
          </p>
          {ordered.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveType(p.page_type)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                p.page_type === activeType
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{p.page_title}</span>
                {!p.is_published && (
                  <span className="text-[10px] text-muted-foreground">Draft</span>
                )}
              </div>
            </button>
          ))}
        </nav>

        <div>
          {activePage ? (
            <PageEditor
              key={activePage.id}
              page={activePage}
              onSave={(updates) => updatePage(activePage.id, updates)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No pages yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
