import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CreditCard, Calendar, UserPlus, ArrowUpDown, SortAsc } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type FilterType = "all" | "overdue" | "test-soon" | "no-booking" | "new";
export type SortType = "name" | "next-lesson" | "balance" | "test-date" | "last-lesson";

interface FilterChip {
  id: FilterType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const FILTERS: FilterChip[] = [
  { id: "overdue", label: "Overdue", icon: CreditCard, color: "text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-800" },
  { id: "test-soon", label: "Test Soon", icon: Calendar, color: "text-rose-600 bg-rose-500/10 border-rose-200 dark:border-rose-800" },
  { id: "no-booking", label: "No Booking", icon: AlertCircle, color: "text-orange-600 bg-orange-500/10 border-orange-200 dark:border-orange-800" },
  { id: "new", label: "New", icon: UserPlus, color: "text-sky-600 bg-sky-500/10 border-sky-200 dark:border-sky-800" },
];

const SORTS: { id: SortType; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "next-lesson", label: "Next Lesson" },
  { id: "balance", label: "Balance (owed)" },
  { id: "test-date", label: "Test Date" },
  { id: "last-lesson", label: "Last Lesson" },
];

interface PupilSmartFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeSort: SortType;
  onSortChange: (sort: SortType) => void;
  counts?: Partial<Record<FilterType, number>>;
}

export function PupilSmartFilters({
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange,
  counts,
}: PupilSmartFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* Sort dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-full text-xs shrink-0 gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SORTS.map((sort) => (
            <DropdownMenuItem
              key={sort.id}
              onClick={() => onSortChange(sort.id)}
              className={cn(activeSort === sort.id && "bg-primary/10 text-primary")}
            >
              {sort.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter chips */}
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = counts?.[filter.id];

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(isActive ? "all" : filter.id)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 shrink-0 transition-all",
              isActive
                ? filter.color
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <filter.icon className="h-3 w-3" />
            {filter.label}
            {count !== undefined && count > 0 && (
              <span className={cn(
                "ml-0.5 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center",
                isActive ? "bg-white/20" : "bg-muted"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
