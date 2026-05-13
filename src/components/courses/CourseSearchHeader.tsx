import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostcodeAutocomplete } from "@/components/PostcodeAutocomplete";
import { useState } from "react";

interface CourseSearchHeaderProps {
  title: string;
  postcode: string;
  setPostcode: (value: string) => void;
  radius: string;
  setRadius: (value: string) => void;
  transmission: string;
  setTransmission: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
}

export function CourseSearchHeader({
  title,
  postcode,
  setPostcode,
  radius,
  setRadius,
  transmission,
  setTransmission,
  isSearching,
  onSearch,
}: CourseSearchHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section className="border-b bg-secondary/30 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-4xl"
        >
          <h1 className="mb-6 text-2xl font-bold md:text-3xl">{title}</h1>

          <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-md sm:flex-row sm:items-center">
            <PostcodeAutocomplete
              value={postcode}
              onChange={setPostcode}
              onSelect={(pc) => {
                setPostcode(pc);
                setTimeout(() => onSearch(), 100);
              }}
              placeholder="Enter postcode..."
              className="flex-1"
              inputClassName="h-11 border-0 bg-secondary"
            />
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="h-11 rounded-lg border-0 bg-secondary pl-6 pr-4 text-foreground"
            >
              <option value="5">5 miles</option>
              <option value="10">10 miles</option>
              <option value="15">15 miles</option>
              <option value="25">25 miles</option>
            </select>
            <Button variant="accent" size="lg" className="h-11" onClick={onSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">Transmission</label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-2"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Price Range</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2">
                  <option>Any price</option>
                  <option>Under £500</option>
                  <option>£500-£1000</option>
                  <option>Over £1000</option>
                </select>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
