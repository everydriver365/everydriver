import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Centralised hook to invalidate all payment-related React Query caches.
 * Call `invalidatePaymentQueries()` after any payment is recorded
 * so every tile/card reflecting balance or payment status refreshes.
 */
export function usePaymentInvalidation() {
  const queryClient = useQueryClient();

  const invalidatePaymentQueries = useCallback(
    (opts?: { pupilId?: string; instructorId?: string }) => {
      // Broad invalidation – matches any query whose key starts with these prefixes
      const prefixes = [
        "pupil-payment-status",
        "pupil-balances",
        "instructor-pupils-payment-summary",
        "next-lesson-details",
        "today-schedule",
        "payment-history",
        "pupil-credit-breakdown",
      ];

      prefixes.forEach((prefix) => {
        queryClient.invalidateQueries({ queryKey: [prefix] });
      });

      // Targeted invalidation when IDs are known
      if (opts?.pupilId) {
        queryClient.invalidateQueries({
          queryKey: ["pupil-payment-status", opts.pupilId],
        });
      }
      if (opts?.instructorId) {
        queryClient.invalidateQueries({
          queryKey: ["instructor-pupils-payment-summary", opts.instructorId],
        });
        queryClient.invalidateQueries({
          queryKey: ["pupil-balances", opts.instructorId],
        });
      }
    },
    [queryClient],
  );

  return { invalidatePaymentQueries };
}
