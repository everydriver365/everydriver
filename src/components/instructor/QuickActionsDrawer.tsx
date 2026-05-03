import { Drawer as DrawerPrimitive } from "vaul";
import {
  ChevronRight,
  X,
  CalendarPlus,
  UserPlus,
  CreditCard,
  MapPin,
  MessageSquare,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  route?: string;
  onClick?: () => void;
  color: string;
}

interface QuickActionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
}

type TileMeta = {
  label: string;
  subtitle: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const TILE_META: Record<string, TileMeta> = {
  "add-pupil":    { label: "Add pupil",    subtitle: "New learner",   Icon: UserPlus,   iconBg: "#E8F8ED", iconColor: "#1A7A3C" },
  "take-payment": { label: "Take payment", subtitle: "Record payment",Icon: CreditCard, iconBg: "#FFF6E6", iconColor: "#B45309" },
  "track-live":   { label: "Track live",   subtitle: "Start GPS",     Icon: MapPin,     iconBg: "#FFF0F0", iconColor: "#B23A3F" },
  "messages":     { label: "Messages",     subtitle: "Send a message",Icon: MessageSquare, iconBg: "#EEF3FF", iconColor: "#1F3A8A" },
  "nearby-adis":  { label: "Nearby ADIs",  subtitle: "Find instructors", Icon: MapPin,  iconBg: "#EEF3FF", iconColor: "#1F3A8A" },
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export function QuickActionsDrawer({
  open,
  onOpenChange,
  actions,
  onActionClick,
}: QuickActionsDrawerProps) {
  const { instructor } = useInstructorAuth();
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructor?.id);

  const byId = (id: string) => actions.find((a) => a.id === id);
  const addLesson = byId("add-lesson");
  const gridIds = ["add-pupil", "take-payment", "track-live", "messages"];
  const gridActions = gridIds.map(byId).filter(Boolean) as QuickAction[];
  // 6th action: prefer an "availability"-style action, otherwise fall back to remaining
  const usedIds = new Set(["add-lesson", ...gridIds]);
  const trailing = actions.find((a) => !usedIds.has(a.id));

  const trigger = (a: QuickAction | undefined) => {
    if (a) onActionClick(a);
  };

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[71] flex flex-col outline-none"
          style={{
            backgroundColor: "#F2F4F8",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
            fontFamily: FONT,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">Quick add</DrawerPrimitive.Title>

          {/* Header */}
          <div
            style={{
              backgroundColor: "#FFF",
              padding: "14px 16px 12px",
              borderBottom: "0.5px solid #F0F3F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[
                  { l: "D", bg: "#B23A3F", r: { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 } },
                  { l: "S", bg: "#1F3A8A", r: {} },
                  { l: "M", bg: "#2B2B2B", r: { borderTopRightRadius: 3, borderBottomRightRadius: 3 } },
                ].map((b) => (
                  <div
                    key={b.l}
                    style={{
                      width: 16,
                      height: 18,
                      backgroundColor: b.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...b.r,
                    }}
                  >
                    <span style={{ fontSize: 8, fontWeight: 900, color: "#FFF" }}>{b.l}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.2 }}>
                  Quick add
                </div>
                <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 1 }}>
                  What would you like to do?
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#F2F4F8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={9} color="#5B6B8A" strokeWidth={2} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 13, paddingBottom: 0 }}>
            {/* Primary: Add lesson */}
            {addLesson && (
              <button
                onClick={() => trigger(addLesson)}
                style={{
                  width: "100%",
                  backgroundColor: "#1F3A8A",
                  borderRadius: 14,
                  padding: "13px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CalendarPlus size={17} color="#FFF" strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>Add lesson</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                    Schedule a new lesson
                  </div>
                </div>
                <ChevronRight size={12} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
              </button>
            )}

            {/* 2x2 grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {gridActions.map((action) => {
                const meta = TILE_META[action.id];
                if (!meta) return null;
                const isMessages = action.id === "messages";
                const badge = isMessages ? unreadCount : 0;
                const subtitle =
                  isMessages && unreadCount > 0 ? `${unreadCount} unread` : meta.subtitle;
                const Icon = meta.Icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => trigger(action)}
                    style={{
                      backgroundColor: "#FFF",
                      borderRadius: 13,
                      padding: 12,
                      border: "0.5px solid rgba(26,82,160,0.08)",
                      position: "relative",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {badge > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: "#B23A3F",
                          borderRadius: 8,
                          minWidth: 14,
                          height: 14,
                          padding: "0 3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <span style={{ fontSize: 7, fontWeight: 700, color: "#FFF" }}>{badge}</span>
                      </div>
                    )}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        backgroundColor: meta.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Icon size={15} color={meta.iconColor} strokeWidth={1.6} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", lineHeight: "17px" }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 2 }}>{subtitle}</div>
                  </button>
                );
              })}
            </div>

            {/* Trailing full-width row (Availability / Nearby ADIs) */}
            {trailing && (() => {
              const meta = TILE_META[trailing.id];
              const isAvailability = /avail/i.test(trailing.id) || /avail/i.test(trailing.label);
              const label = isAvailability ? "Availability" : meta?.label ?? trailing.label;
              const subtitle = isAvailability
                ? "Manage working hours"
                : meta?.subtitle ?? "";
              const Icon = (isAvailability ? Clock : meta?.Icon ?? trailing.icon) as LucideIcon;
              const iconBg = meta?.iconBg ?? "#EEF3FF";
              const iconColor = meta?.iconColor ?? "#1F3A8A";
              return (
                <button
                  onClick={() => trigger(trailing)}
                  style={{
                    width: "100%",
                    backgroundColor: "#FFF",
                    borderRadius: 13,
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    border: "0.5px solid rgba(26,82,160,0.08)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      backgroundColor: iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color={iconColor} strokeWidth={1.6} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{label}</div>
                    <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 1 }}>{subtitle}</div>
                  </div>
                  <ChevronRight size={10} color="#C7C7CC" strokeWidth={1.8} />
                </button>
              );
            })()}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
