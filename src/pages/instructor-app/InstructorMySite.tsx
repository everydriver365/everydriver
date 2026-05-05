import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Copy, Monitor, Tablet, Smartphone, ExternalLink, Check, Loader2,
  Trash2, Plus, GripVertical, Star,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { DashboardShell } from "@/components/instructor/dashboardV2/DashboardShell";
import { SiteEditorProvider, useSiteEditor } from "@/context/SiteEditorContext";
import { SitePreview } from "@/components/instructor/siteEditor/SitePreview";
import {
  EditorSection, SavedPill, CountPill, FieldLabel, TextField, TextArea,
} from "@/components/instructor/siteEditor/EditorSection";
import { ImageUploadTile } from "@/components/instructor/siteEditor/ImageUploadTile";
import { ColorSwatch } from "@/components/instructor/siteEditor/ColorSwatch";

const FONTS = ["Inter", "Plus Jakarta Sans", "Manrope", "Source Serif", "Inter Tight"];
const DEVICE_WIDTH = { desktop: 540, tablet: 380, mobile: 320 } as const;
type Device = keyof typeof DEVICE_WIDTH;

function EditorToolbar({
  device, onDevice, onPublish, hasChanges, publishing, domain,
}: {
  device: Device; onDevice: (d: Device) => void;
  onPublish: () => void; hasChanges: boolean; publishing: boolean;
  domain: string;
}) {

  return (
    <div
      className="sticky z-10 flex items-center gap-3"
      style={{
        top: 56,
        padding: "10px 16px",
        background: "var(--d2-surface)",
        borderBottom: "0.5px solid var(--d2-border)",
      }}
    >
      <div className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
        <span style={{ color: "var(--d2-text-3)" }}>Website</span>
        <span style={{ color: "var(--d2-text-3)" }}>/</span>
        <span style={{ color: "var(--d2-text-1)", fontWeight: 500 }}>My site</span>
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{
          background: "var(--d2-surface-soft)", border: "0.5px solid var(--d2-border)",
          borderRadius: 999, padding: "3px 8px 3px 10px", fontSize: 11, color: "var(--d2-text-2)",
        }}
      >
        <span>{domain}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(domain); toast("Domain copied"); }}
          style={{ color: "var(--d2-text-3)" }}
          aria-label="Copy domain"
        >
          <Copy size={11} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center" style={{ background: "var(--d2-surface-soft)", borderRadius: 8, padding: 3, gap: 2 }}>
        {(Object.keys(DEVICE_WIDTH) as Device[]).map((d) => {
          const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
          const active = device === d;
          return (
            <button
              key={d}
              onClick={() => onDevice(d)}
              aria-label={d}
              style={{
                width: 28, height: 24, borderRadius: 6,
                background: active ? "#fff" : "transparent",
                color: active ? "var(--d2-text-1)" : "var(--d2-text-3)",
                boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 150ms ease-out",
              }}
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      <a
        href={`https://${domain}`}
        target="_blank" rel="noreferrer"
        className="flex items-center gap-1.5"
        style={{
          height: 30, padding: "0 12px", borderRadius: 8,
          border: "0.5px solid var(--d2-border)", background: "var(--d2-surface)",
          color: "var(--d2-text-1)", fontSize: 12, fontWeight: 500,
        }}
      >
        <ExternalLink size={12} /> View live
      </a>

      <button
        onClick={onPublish}
        disabled={publishing}
        className="flex items-center gap-1.5 relative"
        style={{
          height: 30, padding: "0 12px", borderRadius: 8,
          background: "var(--d2-indigo)", color: "#fff",
          fontSize: 12, fontWeight: 500,
          opacity: publishing ? 0.8 : 1,
        }}
      >
        {publishing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        {publishing ? "Publishing…" : "Publish"}
        {hasChanges && !publishing && (
          <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "#FBBF24" }} />
        )}
      </button>
    </div>
  );
}

function EditorPane() {
  const { site, update, setSection, savedSections, markSaved } = useSiteEditor();
  const [openSection, setOpenSection] = useState<string>("brand");
  const toggle = (s: string) => setOpenSection(prev => (prev === s ? "" : s));
  const saved = (k: any) => savedSections.has(k) ? <SavedPill /> : null;

  const handleField = <K extends Parameters<typeof update>[0]>(k: K, patch: any) => {
    update(k, patch);
    markSaved(k);
  };

  return (
    <aside
      className="overflow-y-auto"
      style={{
        width: 320, flexShrink: 0,
        background: "var(--d2-surface)",
        borderRight: "0.5px solid var(--d2-border)",
        padding: "0 16px",
      }}
    >
      {/* Brand */}
      <EditorSection
        title="Brand" status={saved("brand")}
        open={openSection === "brand"} onToggle={() => toggle("brand")}
      >
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Logo</FieldLabel>
            <ImageUploadTile
              value={site.brand.logo}
              onChange={(v) => handleField("brand", { logo: v })}
              showRemoveBg
              hint="Drag a logo here, or click to browse · PNG, SVG up to 2MB"
            />
          </div>
          <div>
            <FieldLabel>Photo</FieldLabel>
            <ImageUploadTile
              value={site.brand.photo}
              onChange={(v) => handleField("brand", { photo: v })}
              shape="circle"
              hint="Drag a headshot here · auto-cropped to circle"
            />
          </div>
          <div>
            <FieldLabel>Colors</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatch label="Primary" value={site.brand.primary} onChange={(v) => handleField("brand", { primary: v })} />
              <ColorSwatch label="Accent" value={site.brand.accent} onChange={(v) => handleField("brand", { accent: v })} />
            </div>
          </div>
          <div>
            <FieldLabel>Font</FieldLabel>
            <select
              value={site.brand.font}
              onChange={(e) => handleField("brand", { font: e.target.value })}
              style={{
                width: "100%", height: 30, padding: "0 10px",
                border: "0.5px solid var(--d2-border)", borderRadius: 8,
                background: "var(--d2-surface)", color: "var(--d2-text-1)",
                fontSize: 12, outline: "none",
              }}
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </EditorSection>

      {/* Hero */}
      <EditorSection title="Hero" status={saved("hero")} open={openSection === "hero"} onToggle={() => toggle("hero")}>
        <div className="flex flex-col gap-3">
          <div><FieldLabel>Headline</FieldLabel><TextField value={site.hero.headline} onChange={(e) => handleField("hero", { headline: e.target.value })} /></div>
          <div><FieldLabel>Sub-headline</FieldLabel><TextField value={site.hero.subheadline} onChange={(e) => handleField("hero", { subheadline: e.target.value })} /></div>
          <div><FieldLabel>CTA text</FieldLabel><TextField value={site.hero.cta} onChange={(e) => handleField("hero", { cta: e.target.value })} /></div>
          <div><FieldLabel>Background image</FieldLabel><ImageUploadTile value={site.hero.bgImage} onChange={(v) => handleField("hero", { bgImage: v })} /></div>
        </div>
      </EditorSection>

      {/* About */}
      <EditorSection title="About" status={saved("about")} open={openSection === "about"} onToggle={() => toggle("about")}>
        <div className="flex flex-col gap-3">
          <div><FieldLabel>Bio</FieldLabel><TextArea value={site.about.bio} onChange={(e) => handleField("about", { bio: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><FieldLabel>DVSA #</FieldLabel><TextField value={site.about.dvsa} onChange={(e) => handleField("about", { dvsa: e.target.value })} /></div>
            <div><FieldLabel>Years</FieldLabel><TextField type="number" value={site.about.yearsExperience} onChange={(e) => handleField("about", { yearsExperience: Number(e.target.value) })} /></div>
          </div>
        </div>
      </EditorSection>

      {/* Services */}
      <EditorSection
        title="Services & prices"
        status={openSection === "services" ? saved("services") : <CountPill n={site.services.length} />}
        open={openSection === "services"} onToggle={() => toggle("services")}
      >
        <div className="flex flex-col gap-2">
          {site.services.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ padding: 8, border: "0.5px solid var(--d2-border)", borderRadius: 8 }}>
              <GripVertical size={12} style={{ color: "var(--d2-text-3)" }} />
              <input
                value={s.name}
                onChange={(e) => {
                  const next = [...site.services]; next[i] = { ...next[i], name: e.target.value };
                  setSection("services", next); markSaved("services");
                }}
                style={{ flex: 1, fontSize: 11, border: "none", outline: "none", background: "transparent", color: "var(--d2-text-1)" }}
              />
              <div className="flex items-center" style={{ fontSize: 11, color: "var(--d2-text-2)" }}>
                <span>£</span>
                <input
                  type="number" value={s.price}
                  onChange={(e) => {
                    const next = [...site.services]; next[i] = { ...next[i], price: Number(e.target.value) };
                    setSection("services", next); markSaved("services");
                  }}
                  style={{ width: 44, fontSize: 11, border: "none", outline: "none", background: "transparent", color: "var(--d2-text-1)" }}
                />
              </div>
              <Switch
                checked={s.bookable}
                onCheckedChange={(v) => {
                  const next = [...site.services]; next[i] = { ...next[i], bookable: v };
                  setSection("services", next); markSaved("services");
                }}
                className="scale-75"
              />
              <button
                onClick={() => { setSection("services", site.services.filter((_, j) => j !== i)); markSaved("services"); }}
                style={{ color: "var(--d2-text-3)" }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => { setSection("services", [...site.services, { name: "New service", price: 40, unit: "hr", duration: 60, bookable: true }]); markSaved("services"); }}
            className="flex items-center justify-center gap-1.5"
            style={{
              padding: "6px", border: "1px dashed var(--d2-border)", borderRadius: 8,
              fontSize: 11, color: "var(--d2-text-2)",
            }}
          >
            <Plus size={12} /> Add service
          </button>
        </div>
      </EditorSection>

      {/* Reviews */}
      <EditorSection
        title="Reviews"
        status={openSection === "reviews" ? saved("reviews") : <CountPill n={site.reviews.length} />}
        open={openSection === "reviews"} onToggle={() => toggle("reviews")}
      >
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
          {site.reviews.map((r, i) => (
            <div key={i} style={{ padding: 8, border: "0.5px solid var(--d2-border)", borderRadius: 8 }}>
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => {
                    const next = [...site.reviews]; next[i] = { ...next[i], rating: n };
                    setSection("reviews", next); markSaved("reviews");
                  }}>
                    <Star size={11} fill={n <= r.rating ? "#F59E0B" : "none"} stroke="#F59E0B" />
                  </button>
                ))}
              </div>
              <input
                value={r.name}
                onChange={(e) => {
                  const next = [...site.reviews]; next[i] = { ...next[i], name: e.target.value };
                  setSection("reviews", next); markSaved("reviews");
                }}
                style={{ width: "100%", fontSize: 11, fontWeight: 500, border: "none", outline: "none", background: "transparent", color: "var(--d2-text-1)" }}
              />
              <textarea
                value={r.quote}
                onChange={(e) => {
                  const next = [...site.reviews]; next[i] = { ...next[i], quote: e.target.value };
                  setSection("reviews", next); markSaved("reviews");
                }}
                rows={2}
                style={{ width: "100%", fontSize: 11, color: "var(--d2-text-2)", border: "none", outline: "none", background: "transparent", resize: "none" }}
              />
            </div>
          ))}
        </div>
      </EditorSection>

      {/* Booking */}
      <EditorSection title="Booking" status={saved("booking")} open={openSection === "booking"} onToggle={() => toggle("booking")}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><FieldLabel>Lead time (h)</FieldLabel><TextField type="number" value={site.booking.leadTime} onChange={(e) => handleField("booking", { leadTime: Number(e.target.value) })} /></div>
            <div><FieldLabel>Deposit (£)</FieldLabel><TextField type="number" value={site.booking.deposit} onChange={(e) => handleField("booking", { deposit: Number(e.target.value) })} /></div>
          </div>
          <div>
            <FieldLabel>Payment methods</FieldLabel>
            <div className="flex flex-col gap-1.5">
              {["square","bank","cash"].map(m => (
                <label key={m} className="flex items-center gap-2" style={{ fontSize: 12 }}>
                  <input
                    type="checkbox" checked={site.booking.methods.includes(m)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...site.booking.methods, m]
                        : site.booking.methods.filter(x => x !== m);
                      handleField("booking", { methods: next });
                    }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{m === "square" ? "Square card" : m === "bank" ? "Bank transfer" : "Cash"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </EditorSection>

      {/* Contact */}
      <EditorSection title="Contact" status={saved("contact")} open={openSection === "contact"} onToggle={() => toggle("contact")}>
        <div className="flex flex-col gap-3">
          <div><FieldLabel>Phone</FieldLabel><TextField value={site.contact.phone} onChange={(e) => handleField("contact", { phone: e.target.value })} /></div>
          <div><FieldLabel>WhatsApp</FieldLabel><TextField value={site.contact.whatsapp} onChange={(e) => handleField("contact", { whatsapp: e.target.value })} /></div>
          <div><FieldLabel>Email</FieldLabel><TextField value={site.contact.email} onChange={(e) => handleField("contact", { email: e.target.value })} /></div>
          <div><FieldLabel>Service area</FieldLabel><TextField value={site.contact.area} onChange={(e) => handleField("contact", { area: e.target.value })} /></div>
          <div
            style={{
              height: 64, borderRadius: 8, background: "var(--d2-surface-soft)",
              border: "0.5px solid var(--d2-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "var(--d2-text-3)",
            }}
          >
            Service area map
          </div>
        </div>
      </EditorSection>

      {/* SEO */}
      <EditorSection title="SEO" status={saved("seo")} open={openSection === "seo"} onToggle={() => toggle("seo")}>
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Meta title <span style={{ color: "var(--d2-text-3)" }}>{site.seo.title.length}/60</span></FieldLabel>
            <TextField maxLength={60} value={site.seo.title} onChange={(e) => handleField("seo", { title: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Meta description <span style={{ color: "var(--d2-text-3)" }}>{site.seo.description.length}/160</span></FieldLabel>
            <TextArea maxLength={160} value={site.seo.description} onChange={(e) => handleField("seo", { description: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Search preview</FieldLabel>
            <div style={{ padding: 10, border: "0.5px solid var(--d2-border)", borderRadius: 8, background: "var(--d2-surface)" }}>
              <div style={{ fontSize: 13, color: "#1A0DAB", lineHeight: 1.2 }}>{site.seo.title}</div>
              <div style={{ fontSize: 10, color: "#006621", marginTop: 2 }}>ken-d.drive365.co.uk</div>
              <div style={{ fontSize: 11, color: "var(--d2-text-2)", marginTop: 3, lineHeight: 1.4 }}>{site.seo.description}</div>
            </div>
          </div>
          <div><FieldLabel>OG image</FieldLabel><ImageUploadTile value={site.seo.og} onChange={(v) => handleField("seo", { og: v })} /></div>
          <div><FieldLabel>Favicon</FieldLabel><ImageUploadTile value={site.seo.favicon} onChange={(v) => handleField("seo", { favicon: v })} /></div>
        </div>
      </EditorSection>
    </aside>
  );
}

function PreviewPane({ device, domain }: { device: Device; domain: string }) {
  const { site } = useSiteEditor();
  const width = DEVICE_WIDTH[device];

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col items-center"
      style={{ background: "#F1F5F9", padding: 24 }}
    >
      <motion.div
        animate={{ width }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        style={{
          background: "#fff", borderRadius: 8,
          border: "0.5px solid var(--d2-border)",
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-1.5"
          style={{ padding: 7, borderBottom: "0.5px solid var(--d2-border)", background: "#F8FAFC" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#CBD5E1" }} />
          <div
            className="flex-1 mx-2 text-center"
            style={{
              fontSize: 9, color: "var(--d2-text-3)",
              background: "#fff", borderRadius: 4, padding: "2px 6px",
              border: "0.5px solid var(--d2-border)",
            }}
          >
            {domain}
          </div>
        </div>
        <SitePreview site={site} />
      </motion.div>
      <div style={{ fontSize: 11, color: "var(--d2-text-3)", marginTop: 12 }}>
        Live preview · Updates as you edit
      </div>
    </div>
  );
}

function MySiteInner() {
  const navigate = useNavigate();
  const { instructor, signOut } = useInstructorAuth();
  const { total: notificationCount } = useCombinedNotificationCount(instructor?.id);
  const [device, setDevice] = useState<Device>("desktop");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasChanges, setHasChanges] = useState(true);

  const initials = useMemo(
    () => (instructor?.name || "").split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "ID",
    [instructor?.name]
  );

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setConfirmOpen(false);
      setHasChanges(false);
      toast.success("Site published", {
        action: { label: "View live →", onClick: () => window.open("https://ken-d.drive365.co.uk", "_blank") },
      });
    }, 1500);
  };

  const handleSignOut = async () => { await signOut(); navigate("/instructor-app/login"); };

  return (
    <DashboardShell
      userInitials={initials}
      userName={instructor?.name || "Instructor"}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      onAskED={() => window.dispatchEvent(new CustomEvent("dsm:open-ai"))}
      onBell={() => navigate("/instructor/notifications")}
    >
      <div style={{ margin: -24 }} className="flex flex-col h-[calc(100vh-56px)]">
        <EditorToolbar
          device={device} onDevice={setDevice}
          hasChanges={hasChanges} publishing={publishing}
          onPublish={() => setConfirmOpen(true)}
        />
        <div className="flex-1 flex min-h-0">
          <EditorPane />
          <PreviewPane device={device} />
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish changes?</DialogTitle>
            <DialogDescription>
              Your live site at <strong>ken-d.drive365.co.uk</strong> will update immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={publishing}
              style={{
                height: 32, padding: "0 14px", borderRadius: 8,
                border: "0.5px solid var(--d2-border)", background: "var(--d2-surface)",
                color: "var(--d2-text-1)", fontSize: 12, fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5"
              style={{
                height: 32, padding: "0 14px", borderRadius: 8,
                background: "var(--d2-indigo)", color: "#fff",
                fontSize: 12, fontWeight: 500, opacity: publishing ? 0.8 : 1,
              }}
            >
              {publishing && <Loader2 size={12} className="animate-spin" />}
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

export default function InstructorMySite() {
  return (
    <SiteEditorProvider>
      <MySiteInner />
    </SiteEditorProvider>
  );
}
