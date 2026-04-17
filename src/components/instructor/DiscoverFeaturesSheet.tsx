import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IOSSearchBar } from "@/components/ui/IOSSearchBar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DISCOVER_FEATURES, FEATURE_CATEGORIES, type DiscoverFeature } from "./discoverFeaturesData";

interface DiscoverFeaturesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscoverFeaturesSheet({ open, onOpenChange }: DiscoverFeaturesSheetProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filtered = search.trim()
    ? DISCOVER_FEATURES.filter(
        (f) =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.summary.toLowerCase().includes(search.toLowerCase()) ||
          f.category.toLowerCase().includes(search.toLowerCase())
      )
    : DISCOVER_FEATURES;

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleGoTo = (route: string) => {
    onOpenChange(false);
    setTimeout(() => navigate(route), 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-2xl p-0 flex flex-col">
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-[5px] rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-[17px] font-semibold">Discover Features</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-3">
          <IOSSearchBar value={search} onChange={setSearch} placeholder="Search features..." />
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 pb-10 space-y-5">
            {FEATURE_CATEGORIES.map((category) => {
              const features = filtered.filter((f) => f.category === category);
              if (features.length === 0) return null;
              const isCollapsed = collapsedCategories.has(category);

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-1.5 mb-2 w-full text-left"
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.div>
                    <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 ml-1">
                      {features.length}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-card rounded-2xl shadow-lift border border-border divide-y divide-border overflow-hidden">
                          {features.map((feature) => (
                            <FeatureRow
                              key={feature.title}
                              feature={feature}
                              isExpanded={expandedFeature === feature.title}
                              onToggle={() =>
                                setExpandedFeature(
                                  expandedFeature === feature.title ? null : feature.title
                                )
                              }
                              onGoTo={() => handleGoTo(feature.route)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No features match "{search}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function FeatureRow({
  feature,
  isExpanded,
  onToggle,
  onGoTo,
}: {
  feature: DiscoverFeature;
  isExpanded: boolean;
  onToggle: () => void;
  onGoTo: () => void;
}) {
  const Icon = feature.icon;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/50 transition-colors"
      >
        <div
          className="h-[29px] w-[29px] rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: feature.accent + "20" }}
        >
          <Icon className="h-4 w-4" style={{ color: feature.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[15px] font-medium text-foreground">{feature.title}</span>
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">{feature.summary}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 ml-[41px]">
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                {feature.detailedDescription}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoTo();
                }}
                className="h-8 text-[13px] gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Go to {feature.title}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
