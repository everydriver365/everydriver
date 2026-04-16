import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWebsitePage } from "@/hooks/useInstructorWebsitePages";
import { MiniWebsiteLayout } from "@/components/mini-website/MiniWebsiteLayout";
import { TestEnquiryDialog } from "@/components/mini-website/TestEnquiryDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, MapPin, Calendar, Clock, AlertCircle, Search, MessageCircle , Car } from "lucide-react";
import { motion } from "framer-motion";
import { fetchTestCentres, fetchSlotsForCentre, type TestSlot } from "@/lib/api/firecrawl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MiniWebsiteTestsProps {
  subdomainSlug?: string | null;
}

export default function MiniWebsiteTests({ subdomainSlug }: MiniWebsiteTestsProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const { page, instructor, loading, notFound } = useWebsitePage(slug, "about");

  const [centres, setCentres] = useState<string[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string | null>(null);
  const [centreSlots, setCentreSlots] = useState<Record<string, TestSlot[]>>({});
  const [loadingCentreSlots, setLoadingCentreSlots] = useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enquirySlot, setEnquirySlot] = useState<{ centre: string; date: string; time: string } | null>(null);

  const loadCentres = async () => {
    setIsLoadingCentres(true);
    setError(null);
    try {
      const response = await fetchTestCentres();
      if (response.success) {
        setCentres(response.centres || []);
        if (response.slots && response.slots.length > 0) {
          const firstCentre = response.slots[0].centre;
          setCentreSlots(prev => ({ ...prev, [firstCentre]: response.slots! }));
        }
      } else {
        setError(response.error || "Failed to load test centres");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsLoadingCentres(false);
    }
  };

  const loadSlotsForCentre = async (centre: string) => {
    setLoadingCentreSlots(centre);
    try {
      const response = await fetchSlotsForCentre(centre);
      if (response.success) {
        setCentreSlots(prev => ({ ...prev, [centre]: response.slots || [] }));
      }
    } finally {
      setLoadingCentreSlots(null);
    }
  };

  const handleSelectCentre = (centre: string) => {
    setSelectedCentre(centre);
    if (!centreSlots[centre]) {
      loadSlotsForCentre(centre);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e9f4f9' }}>
        <Card className="max-w-md w-full text-center p-8">
          <div className="mb-4"><Car className="h-16 w-16 text-muted-foreground mx-auto" /></div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <Button onClick={() => window.location.href = "/"}>Go Home</Button>
        </Card>
      </div>
    );
  }

  const STYLE_OVERRIDES: Record<string, { primaryColor?: string }> = {
    "ken-d": { primaryColor: "#142040" },
  };
  const primaryColor = STYLE_OVERRIDES[slug!]?.primaryColor || instructor.brand_colour || "#1e3a5f";

  return (
    <MiniWebsiteLayout instructor={instructor} pageTitle="Tests" pageDescription={`Find driving test availability and book your test with support from ${instructor.business_name || instructor.name}.`} metaTitle={page?.meta_title} metaDescription={page?.meta_description}>
      {/* Hero */}
      <section className="py-6 sm:py-8" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">These tests are currently available</h1>
            <p className="text-lg text-white/90">Only available for WDS and Drive365 clients only</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Card style={{ backgroundColor: "#e9f4f9" }}>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {isLoadingCentres ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading test centres...
                </div>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium">Failed to load test centres</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={loadCentres} className="gap-1">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Select value={selectedCentre || ""} onValueChange={handleSelectCentre}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a test centre..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {centres.map(centre => (
                        <SelectItem key={centre} value={centre}>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                            {centre}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadCentres} className="gap-1 shrink-0">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                </div>

                {selectedCentre && (
                  <div className="space-y-3">
                    {loadingCentreSlots === selectedCentre ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Search className="h-4 w-4 animate-pulse" />
                        Searching slots for {selectedCentre}...
                      </div>
                    ) : centreSlots[selectedCentre] && centreSlots[selectedCentre].length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {centreSlots[selectedCentre].length} slot{centreSlots[selectedCentre].length !== 1 ? "s" : ""} available
                        </p>
                        {centreSlots[selectedCentre].map((slot, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card>
                              <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {slot.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {slot.time}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white gap-1 shrink-0"
                                  onClick={() => setEnquirySlot({ centre: selectedCentre, date: slot.date, time: slot.time })}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span className="hidden sm:inline">Enquire</span>
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </>
                    ) : centreSlots[selectedCentre] && centreSlots[selectedCentre].length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No available slots at {selectedCentre}</p>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => loadSlotsForCentre(selectedCentre)} className="gap-1">
                        <Search className="h-4 w-4" /> Load Slots
                      </Button>
                    )}
                  </div>
                )}

                {centres.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No test centres found</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {enquirySlot && (
        <TestEnquiryDialog
          open={!!enquirySlot}
          onOpenChange={(open) => !open && setEnquirySlot(null)}
          centre={enquirySlot.centre}
          date={enquirySlot.date}
          time={enquirySlot.time}
          primaryColor={primaryColor}
        />
      )}
    </MiniWebsiteLayout>
  );
}
