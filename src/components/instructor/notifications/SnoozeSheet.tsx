import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Clock, Sunset, Sunrise, CalendarDays } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (until: Date) => void;
}

const opts = [
  {
    key: "1h",
    label: "1 hour",
    sub: "Resurface in 60 minutes",
    icon: Clock,
    build: () => new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    key: "tonight",
    label: "Until tonight",
    sub: "Resurface at 18:00",
    icon: Sunset,
    build: () => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    key: "morning",
    label: "Tomorrow morning",
    sub: "Resurface at 08:00",
    icon: Sunrise,
    build: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    },
  },
  {
    key: "week",
    label: "Next week",
    sub: "Resurface in 7 days",
    icon: CalendarDays,
    build: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

export default function SnoozeSheet({ open, onOpenChange, onPick }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-base font-medium">Snooze notification</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 flex flex-col gap-1">
          {opts.map(o => {
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                className="w-full flex items-center gap-3 rounded-[10px] px-3 py-3 active:bg-[#F2F2F4] hover:bg-[#F2F2F4] text-left"
                onClick={() => {
                  onPick(o.build());
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-[9px]" style={{ background: "#E6F1FB" }}>
                  <Icon className="w-5 h-5" style={{ color: "#2B7BC8" }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-[14px] font-medium" style={{ color: "#000", letterSpacing: "-0.1px" }}>{o.label}</p>
                  <p className="m-0 text-[12px]" style={{ color: "#6E6E73" }}>{o.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
