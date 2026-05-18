import {
  User, Lock, MessageSquare, ShieldCheck, Clock, MapPin, Calendar,
  Users, XCircle, List, CreditCard, ArrowUpDown, FileText,
  ArrowLeftRight, Info, Shield, Search, LogOut, TriangleAlert,
  GripVertical,
  type LucideProps,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  user: User,
  lock: Lock,
  "message-square": MessageSquare,
  "shield-check": ShieldCheck,
  clock: Clock,
  "map-pin": MapPin,
  calendar: Calendar,
  users: Users,
  "x-circle": XCircle,
  list: List,
  "credit-card": CreditCard,
  "arrow-up-down": ArrowUpDown,
  "file-text": FileText,
  "arrow-left-right": ArrowLeftRight,
  info: Info,
  shield: Shield,
  search: Search,
  "log-out": LogOut,
  "triangle-alert": TriangleAlert,
  "grip-vertical": GripVertical,
};

export function DynamicIcon({
  name, size = 14, color,
}: { name: string; size?: number; color?: string }) {
  const Cmp = MAP[name] ?? Info;
  return <Cmp size={size} color={color} strokeWidth={2} />;
}
