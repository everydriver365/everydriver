import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, MapPin, CalendarCheck, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { getWhitelabelConfig } from "@/lib/whitelabel";
import { findAreaBySlug, getAreasForHost, areaToSlug } from "@/lib/whitelabelAreas";

/**
 * Dedicated location landing page for a single town within a whitelabel
 * brand's coverage area (e.g. /areas/eastleigh). Rendered only on a
 * whitelabel host; non-WL visitors and unknown slugs are redirected.
 *
 * Each page is fully indexable, has unique title/description/JSON-LD via
 * SEOHead's whitelabel branch, and links to the brand's bookable courses
 * filtered by area for stronger local SEO.
 */
export default function WhitelabelAreaPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const config = getWhitelabelConfig();

  const area = useMemo(
    () => (config ? findAreaBySlug(config.host, slug) : null),
    [config, slug],
  );

  // Inject Place + Service JSON-LD for the area page.
  useEffect(() => {
    if (!config || !area) return;
    const id = "wl-area-jsonld";
    const ld = {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Driving lessons and intensive driving courses",
      provider: {
        "@type": "DrivingSchool",
        name: config.brandName,
        url: `https://${config.host}/`,
        telephone: config.phone || undefined,
      },
      areaServed: { "@type": "City", name: area, addressCountry: "GB" },
      url: `https://${config.host}/areas/${areaToSlug(area)}`,
    };
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(JSON.parse(JSON.stringify(ld)));
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [config, area]);

  // Non-whitelabel host or unknown area slug → bounce home.
  if (!config) return <Navigate to="/" replace />;
  if (!area) {
    // Surface unknown slugs in the console so typos in links are debuggable
    // rather than silently bouncing visitors away.
    if (typeof console !== "undefined") {
      console.warn(
        `[WhitelabelAreaPage] Unknown area slug "${slug}" for host "${config.host}" — redirecting to /.`,
      );
    }
    return <Navigate to="/" replace />;
  }

  const otherAreas = getAreasForHost(config.host).filter((a) => a !== area).slice(0, 24);

  return (
    <MainLayout>
      <SEOHead
        title={`Driving Lessons in ${area}`}
        description={`Book driving lessons and intensive courses in ${area} with ${config.brandName}. DVSA-qualified instructor, flexible payments, fast test-ready courses.`}
      />

      {/* Hero */}
      <section className="bg-background py-16 lg:py-20 border-b border-border">
        <div className="container max-w-4xl">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span>Areas we cover</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{area}</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {area}, UK
          </div>

          <h1 className="mt-4 text-4xl lg:text-6xl font-black tracking-tight leading-[1.05] text-foreground">
            Driving Lessons in <span className="text-primary">{area}</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {config.brandName} provides intensive courses, semi-intensive courses
            and weekly driving lessons across {area} and the surrounding area.
            DVSA-qualified instructor, flexible payments and a free re-test guarantee.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to={`/courses?area=${encodeURIComponent(area)}`}>
                See available courses in {area} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/contact">Ask a question</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground">
            What's included for learners in {area}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: CalendarCheck, title: "Flexible scheduling", body: `Lessons across ${area} that fit around school, college or work.` },
              { icon: ShieldCheck, title: "Free re-test guarantee", body: "If you don't pass first time, we'll cover the cost of a re-test." },
              { icon: MapPin, title: "Local pick-up & drop-off", body: `Door-to-door pick-up from your address in ${area}.` },
              { icon: CalendarCheck, title: "Test-ready in days", body: "Intensive courses from 5 days, including practical test booking." },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 rounded-xl border border-border bg-background p-4">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">{title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Other areas */}
      {otherAreas.length > 0 && (
        <section className="py-12">
          <div className="container max-w-4xl">
            <h2 className="text-xl font-bold text-foreground">Other areas we cover</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otherAreas.map((a) => (
                <li key={a}>
                  <Link
                    to={`/areas/${areaToSlug(a)}`}
                    className="inline-block rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {a}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
