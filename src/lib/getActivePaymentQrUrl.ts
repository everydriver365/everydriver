/**
 * Resolves the correct payment QR URL based on the instructor's commission_payer setting.
 * Falls back to the legacy payment_qr_url if the new fields are empty.
 */
export function getActivePaymentQrUrl(instructor: {
  commission_payer?: string | null;
  payment_qr_url_pupil_pays?: string | null;
  payment_qr_url_instructor_pays?: string | null;
  payment_qr_url?: string | null;
} | null | undefined): string | null {
  if (!instructor) return null;

  if (instructor.commission_payer === 'instructor') {
    return instructor.payment_qr_url_instructor_pays || instructor.payment_qr_url || null;
  }

  // Default: pupil pays
  return instructor.payment_qr_url_pupil_pays || instructor.payment_qr_url || null;
}
