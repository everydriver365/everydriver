interface MatchedSlotsListProps {
  instructorId?: string;
}

/**
 * Available slots list — swap-system only.
 *
 * The legacy `test_slot_reservations` / `scraped_match` source has been
 * removed (no external scraping). Until a swap-system "available slots"
 * feed exists, this renders an empty state under the banner.
 */
export function MatchedSlotsList({ instructorId: _instructorId }: MatchedSlotsListProps) {
  return (
    <div
      style={{
        padding: "20px 12px",
        textAlign: "center",
        color: "#6E6E73",
        fontSize: 13,
      }}
    >
      No matching slots from the swap system yet. You'll be notified when an instructor or pupil posts a test that matches your requests.
    </div>
  );
}
