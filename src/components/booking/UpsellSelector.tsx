import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookingUpsell } from "@/hooks/useBookingUpsells";

interface UpsellSelectorProps {
  upsells: BookingUpsell[];
  selectedUpsells: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

export function UpsellSelector({
  upsells,
  selectedUpsells,
  onSelectionChange,
  className,
}: UpsellSelectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (upsellId: string) => {
    if (selectedUpsells.includes(upsellId)) {
      onSelectionChange(selectedUpsells.filter((id) => id !== upsellId));
    } else {
      onSelectionChange([...selectedUpsells, upsellId]);
    }
  };

  const getIcon = (iconName: string | null): React.ComponentType<{ className?: string }> => {
    if (!iconName) return LucideIcons.Zap;
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return Icon || LucideIcons.Zap;
  };

  const totalUpsellPrice = upsells
    .filter((u) => selectedUpsells.includes(u.id))
    .reduce((sum, u) => sum + Number(u.price), 0);

  if (upsells.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <LucideIcons.Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Boost Your Booking</h3>
          <p className="text-sm text-muted-foreground">
            Add extras to enhance your learning experience
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {upsells.map((upsell) => {
          const isSelected = selectedUpsells.includes(upsell.id);
          const Icon = getIcon(upsell.icon_name);
          const isExpanded = expandedId === upsell.id;

          return (
            <motion.div
              key={upsell.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all duration-300 cursor-pointer",
                  isSelected
                    ? "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-2 border-transparent hover:border-muted-foreground/20"
                )}
                onClick={() => handleToggle(upsell.id)}
              >
                {/* Featured gradient border */}
                {upsell.is_featured && !isSelected && (
                  <div
                    className="absolute inset-0 rounded-lg opacity-30"
                    style={{
                      background: `linear-gradient(135deg, ${upsell.highlight_color || "#10b981"}, transparent)`,
                    }}
                  />
                )}

                <CardContent className="p-4 relative">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(upsell.id)}
                        className={cn(
                          "h-5 w-5 rounded-full transition-all",
                          isSelected && "bg-emerald-500 border-emerald-500"
                        )}
                      />
                    </div>

                    {/* Icon */}
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                      style={
                        !isSelected && upsell.highlight_color
                          ? { backgroundColor: `${upsell.highlight_color}20`, color: upsell.highlight_color }
                          : undefined
                      }
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">
                              {upsell.name}
                            </h4>
                            {upsell.badge_text && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs"
                              >
                                {upsell.badge_text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {upsell.short_description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">
                            £{Number(upsell.price).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Refund guarantee */}
                      {upsell.refund_policy && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Money-back guarantee</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(isExpanded ? null : upsell.id);
                                  }}
                                  className="hover:bg-muted rounded-full p-0.5"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">{upsell.refund_policy}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && upsell.full_description && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                              {upsell.full_description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selection indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      {selectedUpsells.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800"
        >
          <span className="text-sm font-medium">
            {selectedUpsells.length} extra{selectedUpsells.length > 1 ? "s" : ""} selected
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            +£{totalUpsellPrice.toFixed(2)}
          </span>
        </motion.div>
      )}
    </div>
  );
}
