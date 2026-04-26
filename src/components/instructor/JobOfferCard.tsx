import { MouseEvent, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, X, Check } from "lucide-react";
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
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { MetaItem, MetaBullet } from "@/components/instructor/MetaItem";
import {
  formatUkPostcode,
  formatTiming,
  formatDistanceMiles,
  toSentenceCase,
} from "@/lib/formatJobOffer";

export interface JobOfferCardOffer {
  id: string;
  name: string;
  postcode: string;
  course_type: string;
  preferred_timing: string;
  requested_hours: number | null;
}

interface Props {
  offer: JobOfferCardOffer;
  distanceMi: number | null | undefined;
  onExpand: () => void;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  processing?: boolean;
}

export function JobOfferCard({
  offer,
  distanceMi,
  onExpand,
  onAccept,
  onDecline,
  processing,
}: Props) {
  const [confirm, setConfirm] = useState<null | "accept" | "decline">(null);

  const hours = offer.requested_hours ?? 10;
  const lessonType = toSentenceCase(offer.course_type) || "Lesson course";
  const postcode = formatUkPostcode(offer.postcode);
  const distanceLabel = formatDistanceMiles(distanceMi ?? null);
  const timing = formatTiming(offer.preferred_timing);

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const openDecline = (e: MouseEvent) => {
    stop(e);
    setConfirm("decline");
  };

  const openAccept = (e: MouseEvent) => {
    stop(e);
    setConfirm("accept");
  };

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        style={{
          background: "#FFFFFF",
          border: "0.5px solid #E5E5EA",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Tappable body */}
        <button
          type="button"
          onClick={onExpand}
          className="w-full text-left"
          style={{
            padding: "14px 14px 12px",
            background: "transparent",
            border: 0,
            display: "block",
          }}
        >
          {/* Top row */}
          <div
            className="flex items-start"
            style={{ gap: 10, marginBottom: 10, justifyContent: "space-between" }}
          >
            <div className="flex items-center" style={{ gap: 10, flex: 1, minWidth: 0 }}>
              <UserAvatar name={offer.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#000000",
                    letterSpacing: "-0.2px",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {offer.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6E6E73",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lessonType}
                </div>
              </div>
            </div>

            <span
              style={{
                background: "#F1ECFA",
                color: "#8A5BC9",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                flexShrink: 0,
                lineHeight: 1.2,
              }}
            >
              {hours}h
            </span>
          </div>

          {/* Meta row */}
          <div
            className="flex items-center"
            style={{
              padding: "10px 0 0",
              borderTop: "0.5px solid #E5E5EA",
              gap: 12,
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {postcode && <MetaItem icon={MapPin} label={postcode} />}
            {distanceLabel && (
              <>
                <MetaBullet />
                <MetaItem icon={Navigation} label={distanceLabel} />
              </>
            )}
            {timing.label && (
              <>
                {(postcode || distanceLabel) && <MetaBullet />}
                <MetaItem icon={Clock} label={timing.label} urgent={timing.urgent} />
              </>
            )}
          </div>
        </button>

        {/* Action row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.5px 1fr",
            borderTop: "0.5px solid #E5E5EA",
          }}
        >
          <button
            type="button"
            onClick={openDecline}
            disabled={processing}
            className="flex items-center justify-center"
            style={{
              padding: 12,
              gap: 6,
              background: "transparent",
              border: 0,
              color: "#6E6E73",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <X size={14} strokeWidth={1.8} />
            Decline
          </button>
          <div style={{ background: "#E5E5EA", width: "0.5px" }} aria-hidden />
          <button
            type="button"
            onClick={openAccept}
            disabled={processing}
            className="flex items-center justify-center"
            style={{
              padding: 12,
              gap: 6,
              background: "transparent",
              border: 0,
              color: "#2B7BC8",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Check size={14} strokeWidth={2} />
            Accept
          </button>
        </div>
      </motion.article>

      {/* Decline confirmation */}
      <AlertDialog
        open={confirm === "decline"}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see {offer.name}'s enquiry in your jobs list anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                stop(e);
                setConfirm(null);
                await onDecline();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept confirmation */}
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
                  <span className="text-foreground font-medium">{offer.name}</span>
                  {" · "}
                  {hours}h · {lessonType}
                </div>
                <div className="text-muted-foreground">
                  {[postcode, timing.label].filter(Boolean).join(" · ")}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                stop(e);
                setConfirm(null);
                await onAccept();
              }}
            >
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
