import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

export function CloseAccountPage() {
  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 8 }}>
          <div className="sv2-section-title" style={{ color: "var(--color-text-danger)" }}>Close account</div>
          <div className="sv2-section-sub">This is permanent. Please read carefully.</div>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
          When you request closure, we begin a 7-day grace period. Within those 7 days you can sign back
          in and cancel the request. After 7 days, the closure is processed and cannot be reversed.
        </p>
      </section>

      <section className="sv2-card">
        <div className="sv2-section-title" style={{ marginBottom: 8 }}>What gets deleted</div>
        <ul style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, paddingLeft: 18, listStyle: "disc" }}>
          <li>Your profile, photos and public listing</li>
          <li>Pupil records, lesson notes and messages</li>
          <li>Saved routes, telematics data and preferences</li>
          <li>Pending bookings and unsent invoices</li>
        </ul>
      </section>

      <section className="sv2-card">
        <div className="sv2-section-title" style={{ marginBottom: 8 }}>What we keep, and why</div>
        <ul style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, paddingLeft: 18, listStyle: "disc" }}>
          <li>Paid invoices and receipts — kept for 6 years to meet HMRC rules.</li>
          <li>Anonymised aggregate analytics — no longer linked to you.</li>
          <li>Audit logs of administrative actions — required for security and dispute resolution.</li>
        </ul>
      </section>

      <section className="sv2-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div className="sv2-section-title">Ready to close?</div>
            <div className="sv2-section-sub">You can also email support if you'd prefer a person to walk you through it.</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="sv2-btn" href="mailto:support@drive365.co.uk?subject=Close%20my%20account">Email support</a>
            <RequestClosureDialog />
          </div>
        </div>
      </section>
    </>
  );
}

function RequestClosureDialog() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const valid = confirm.trim().toLowerCase() === "close my account";
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="sv2-btn danger" type="button">Request closure</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm account closure</AlertDialogTitle>
          <AlertDialogDescription>
            Type <strong>close my account</strong> below to start the 7-day grace period.
            We'll send you an email with details and a link to cancel if you change your mind.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <label className="sv2-label">Confirmation phrase</label>
          <input className="sv2-input" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!valid}
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              setConfirm("");
              toast({
                title: "Closure request received",
                description: "We've emailed support with your request. They'll confirm within one working day.",
              });
              window.location.href = "mailto:support@drive365.co.uk?subject=Close%20my%20account";
            }}
          >
            Start closure
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
