import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Flag, CheckCircle, User, WifiOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Pupil {
  id: string;
  name: string;
}

type SessionType = "practice" | "test";

interface SessionStartPanelProps {
  pupils: Pupil[];
  selectedPupilId: string;
  onPupilChange: (pupilId: string) => void;
  onStartSession: (type: SessionType) => void;
  onOpenDrivingTestDialog: () => void;
  isStarting: boolean;
  isConnected: boolean;
}

export function SessionStartPanel({
  pupils,
  selectedPupilId,
  onPupilChange,
  onStartSession,
  onOpenDrivingTestDialog,
  isStarting,
  isConnected,
}: SessionStartPanelProps) {
  const [sessionType, setSessionType] = useState<SessionType>(
    selectedPupilId ? "practice" : "test"
  );

  // Auto-switch to test route when no pupil selected
  const effectiveSessionType = selectedPupilId ? sessionType : "test";

  const handleStartClick = () => {
    onStartSession(effectiveSessionType);
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-border">
      <div className="p-4 space-y-4">
        {/* Pupil Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Select Pupil
          </label>
          <Select 
            value={selectedPupilId || "__none__"} 
            onValueChange={(val) => onPupilChange(val === "__none__" ? "" : val)}
          >
            <SelectTrigger className="h-12 bg-muted/50 border-border/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <User className="h-4 w-4 text-foreground" />
                </div>
                <SelectValue placeholder="No pupil (Test Route)" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="__none__">
                <span className="text-muted-foreground">No pupil (Test Route)</span>
              </SelectItem>
              {pupils
                .filter((pupil) => pupil.id && pupil.id.trim() !== "")
                .map((pupil) => (
                  <SelectItem key={pupil.id} value={pupil.id}>
                    {pupil.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Session Type Selector - Only show when pupil is selected */}
        {selectedPupilId && (
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Session Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSessionType("practice")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  sessionType === "practice"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Play className="h-4 w-4" />
                <span className="font-medium">Practice</span>
              </button>
              <button
                onClick={() => setSessionType("test")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  sessionType === "test"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Flag className="h-4 w-4" />
                <span className="font-medium">Test Route</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Offline Warning */}
        {!isConnected && (
          <motion.div 
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              GPS offline. Session will record when connection resumes.
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {/* Main Start Button */}
          <Button 
            size="lg"
            className={`flex-1 h-14 text-base font-semibold rounded-xl shadow-lg transition-all ${
              effectiveSessionType === "test" 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
            onClick={handleStartClick}
            disabled={isStarting}
          >
            {isStarting ? (
              <motion.div
                className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : effectiveSessionType === "test" ? (
              <>
                <Flag className="h-5 w-5 mr-2" />
                Start Test Route
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Session
              </>
            )}
          </Button>

          {/* Driving Test Button */}
          <Button 
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-xl border-2 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-600"
            onClick={onOpenDrivingTestDialog}
            disabled={isStarting}
            title="Record Driving Test"
          >
            <CheckCircle className="h-6 w-6" />
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-[11px] text-center text-muted-foreground">
          {selectedPupilId 
            ? effectiveSessionType === "test" 
              ? "Test route will be saved for reference"
              : "Session will be linked to pupil's record"
            : "Recording test route without pupil assignment"
          }
        </p>
      </div>
    </div>
  );
}
