import { useState } from "react";
import {
  Clock,
  PoundSterling,
  Navigation,
  Calendar,
  FileText,
  X,
  Check,
  Loader2,
  Mail,
  Phone,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PostcodeMapPreview } from "@/components/instructor/PostcodeMapPreview";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { CloseButton } from "@/components/instructor/CloseButton";
import { StatCard } from "@/components/instructor/StatCard";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import { CourseTypeLabel } from "@/components/instructor/CourseTypeLabel";
import {
  formatUkPostcode,
  toSentenceCase,
  toTitleCase,
  formatGbp,
  formatTimingHeadline,
  formatLongDate,
  formatDistanceMiles,
} from "@/lib/formatJobOffer";

export interface JobOfferDetailJob {
  id: string;
  name: string;
  postcode: string;
  address: string;
  course_type: string;
  preferred_timing: string;
  requested_hours: number | null;
  additional_notes: string | null;
  created_at: string;
  status: string;
  email?: string | null;
  phone?: string | null;
  transmission_type?: string | null;
  total_cost?: number | null;
}

interface Props {
  job: JobOfferDetailJob | null;
  distanceMi: number | null | undefined;
  hourlyRate: number;
  processing: boolean;
  onClose: () => void;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
}

export function JobOfferDetailSheet({
  job,
  distanceMi,
  hourlyRate,
  processing,
  onClose,
  onAccept,
  onDecline,
}: Props) {
  const [confirm, setConfirm] = useState<null | "accept" | "decline">(null);
  const [pending, setPending] = useState<null | "accept" | "decline">(null);

  if (!job) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0" />
      </Sheet>
    );
  }

  const hours = job.requested_hours ?? 10;
  const earnings = job.total_cost != null ? Number(job.total_cost) : hours * hourlyRate;
  const effectiveRate = hours > 0 ? earnings / hours : hourlyRate;
  const lessonType = toSentenceCase(job.course_type) || "Lesson course";
  const transmissionLabel = job.transmission_type
    ? toSentenceCase(job.transmission_type)
    : null;
  const postcode = formatUkPostcode(job.postcode);
  const distanceLabel = formatDistanceMiles(distanceMi ?? null);
  const distanceNumber = distanceLabel ? distanceLabel.replace(" mi", "") : "—";
  const timingHeadline = formatTimingHeadline(job.preferred_timing);
  const timingDate = formatLongDate(job.preferred_timing);
  const isUnread = job.status === "pending";

  const handleConfirm = async () => {
    if (!confirm) return;
    const which = confirm;
    setPending(which);
    try {
      if (which === "accept") await onAccept();
      else await onDecline();
    } finally {
      setPending(null);
      setConfirm(null);
    }
  };

  return (
    <>
      <Sheet open={!!job} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl p-0 border-0"
          style={{ background: "#F2F2F4" }}
        >
          <div className="flex flex-col h-full">
            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Header card */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Top row */}
                <div
                  className="flex items-center"
                  style={{
                    padding: "12px 16px",
                    borderBottom: "0.5px solid #E5E5EA",
                    gap: 12,
                  }}
                >
                  <h2
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#000000",
                      letterSpacing: "-0.2px",
                      margin: 0,
                    }}
                  >
                    Job offer
                  </h2>
                  <CloseButton onClick={onClose} />
                </div>

                {/* Pupil identity row */}
                <div
                  className="flex items-center"
                  style={{ padding: 16, gap: 12 }}
                >
                  <UserAvatar name={job.name} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Eyebrow: course type · duration */}
                    <div
                      className="flex items-center"
                      style={{ gap: 6, marginBottom: 3 }}
                    >
                      <CourseTypeLabel courseType={job.course_type} />
                      <span
                        aria-hidden="true"
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: "50%",
                          background: "#C7C7CC",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: "0.3px",
                          textTransform: "uppercase",
                          color: "#6E6E73",
                        }}
                      >
                        {hours}h
                      </span>
                    </div>
                    {/* Pupil name title */}
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        color: "#000000",
                        letterSpacing: "-0.3px",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.name}
                    </p>
                  </div>
                  {isUnread && (
                    <span
                      style={{
                        background: "#F1ECFA",
                        color: "#8A5BC9",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      New
                    </span>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                <StatCard
                  icon={Clock}
                  iconColor="#2B7BC8"
                  iconBackground="#E6F1FB"
                  value={`${hours}h`}
                  label="Hours"
                />
                <StatCard
                  icon={PoundSterling}
                  iconColor="#3B8B3B"
                  iconBackground="#E8F3E8"
                  value={formatGbp(earnings)}
                  label={hours > 0 ? `${formatGbp(effectiveRate)}/hr` : "Earnings"}
                />
                <StatCard
                  icon={Navigation}
                  iconColor="#C8434F"
                  iconBackground="#FBEAEC"
                  value={distanceNumber}
                  label={distanceLabel ? "Miles away" : "Location set"}
                />
              </div>

              {/* Location card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <EyebrowLabel>Location</EyebrowLabel>
                <div
                  style={{
                    height: 120,
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                    marginBottom: 12,
                  }}
                >
                  <PostcodeMapPreview
                    postcode={job.postcode}
                    className="h-full w-full"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          job.address + ", " + job.postcode
                        )}`,
                        "_blank"
                      );
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#000000",
                    letterSpacing: "-0.1px",
                    margin: "0 0 3px",
                  }}
                >
                  {toTitleCase(job.address)}
                </p>
                <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                  {postcode}
                </p>
              </div>

              {/* Preferred timing card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <EyebrowLabel>Preferred timing</EyebrowLabel>
                <div
                  className="flex items-center"
                  style={{ gap: 10 }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "#E6F1FB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={16} strokeWidth={2} color="#2B7BC8" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#000000",
                        margin: 0,
                      }}
                    >
                      {timingHeadline}
                    </p>
                    {timingDate && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6E6E73",
                          margin: "1px 0 0",
                        }}
                      >
                        From {timingDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lesson details card */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <EyebrowLabel>Lesson details</EyebrowLabel>
                <DetailRow
                  icon={Car}
                  iconColor="#8A5BC9"
                  iconBackground="#F1ECFA"
                  label="Course"
                  value={lessonType}
                />
                {transmissionLabel && (
                  <DetailRow
                    icon={Car}
                    iconColor="#2B7BC8"
                    iconBackground="#E6F1FB"
                    label="Transmission"
                    value={transmissionLabel}
                  />
                )}
                <DetailRow
                  icon={Clock}
                  iconColor="#2B7BC8"
                  iconBackground="#E6F1FB"
                  label="Requested hours"
                  value={`${hours} hour${hours === 1 ? "" : "s"}`}
                />
                {job.total_cost != null && (
                  <DetailRow
                    icon={PoundSterling}
                    iconColor="#3B8B3B"
                    iconBackground="#E8F3E8"
                    label="Quoted total"
                    value={formatGbp(Number(job.total_cost))}
                  />
                )}
              </div>

              {/* Contact card */}
              {(job.email || job.phone) && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "0.5px solid #E5E5EA",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <EyebrowLabel>Contact (revealed on accept)</EyebrowLabel>
                  {job.phone && (
                    <DetailRow
                      icon={Phone}
                      iconColor="#3B8B3B"
                      iconBackground="#E8F3E8"
                      label="Phone"
                      value={job.phone}
                    />
                  )}
                  {job.email && (
                    <DetailRow
                      icon={Mail}
                      iconColor="#2B7BC8"
                      iconBackground="#E6F1FB"
                      label="Email"
                      value={job.email}
                    />
                  )}
                </div>
              )}

              {/* Notes (preserved) */}
              {job.additional_notes && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "0.5px solid #E5E5EA",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <EyebrowLabel>Notes</EyebrowLabel>
                  <div className="flex items-start" style={{ gap: 10 }}>
                    <FileText size={16} strokeWidth={2} color="#6E6E73" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p
                      style={{
                        fontSize: 13,
                        color: "#000000",
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      {job.additional_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Request date footer */}
              <p
                style={{
                  fontSize: 11,
                  color: "#6E6E73",
                  textAlign: "center",
                  margin: "4px 0 8px",
                }}
              >
                Requested on{" "}
                {format(new Date(job.created_at), "d MMMM yyyy 'at' HH:mm")}
              </p>
            </div>

            {/* Sticky action row */}
            <div
              style={{
                background: "#F2F2F4",
                padding: 16,
                paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
                borderTop: "0.5px solid #E5E5EA",
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setConfirm("decline")}
                disabled={processing || pending !== null}
                className="flex items-center justify-center"
                style={{
                  background: "#FFFFFF",
                  border: "0.5px solid #E5E5EA",
                  borderRadius: 10,
                  padding: 14,
                  gap: 6,
                  color: "#6E6E73",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: pending ? "wait" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending === "decline" ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                ) : (
                  <X size={14} strokeWidth={1.8} />
                )}
                Decline
              </button>
              <button
                type="button"
                onClick={() => setConfirm("accept")}
                disabled={processing || pending !== null}
                className="flex items-center justify-center"
                style={{
                  background: "#2B7BC8",
                  border: 0,
                  borderRadius: 10,
                  padding: 14,
                  gap: 6,
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: pending ? "wait" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending === "accept" ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin" color="#FFFFFF" />
                ) : (
                  <Check size={14} strokeWidth={2} color="#FFFFFF" />
                )}
                Accept job
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation dialogs */}
      <AlertDialog
        open={confirm === "decline"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see {job.name}'s enquiry in your jobs list anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "accept"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-foreground font-medium">{job.name}</span>
                  {" · "}
                  {hours}h · {lessonType}
                </div>
                <div className="text-muted-foreground">
                  {[postcode, timingHeadline].filter(Boolean).join(" · ")}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Accept</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DetailRowProps {
  icon: import("lucide-react").LucideIcon;
  iconColor: string;
  iconBackground: string;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, iconColor, iconBackground, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={2} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 1px", letterSpacing: "0.2px" }}>
          {label}
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#000000",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
