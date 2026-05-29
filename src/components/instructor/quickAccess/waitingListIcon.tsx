import { List, type LucideIcon, type LucideProps } from "lucide-react";
import { forwardRef } from "react";

/** Lucide-shaped wrapper with displayName "waiting-list" so resolveIcon3D
 *  maps the Waiting list tile to its dedicated 3D icon. */
export const WaitingListIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <List ref={ref} {...props} />,
) as unknown as LucideIcon;
(WaitingListIcon as { displayName?: string }).displayName = "waiting-list";
