import type { ComponentType, SVGProps } from 'react';
import {
  Award,
  Users,
  Car,
  ShieldCheck,
  GraduationCap,
  Route,
  CalendarDays,
  Star,
  ClipboardList,
  BadgeCheck,
  IdCard,
  Target,
  Eye,
  Handshake,
  Phone,
  Mail,
  MapPin,
  Clock,
  ThumbsUp,
  Headphones,
  FileText,
  CircleCheck,
  MessageCircleHeart,
  Sparkles,
  Wrench,
  Fuel,
  Gauge,
  UserCheck,
  Trophy,
  HeartHandshake,
  Shield,
  CarFront,
  TrafficCone,
  Building2,
  LayoutGrid,
  MessageCircle,
  Camera,
  Copy,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Check,
  Search,
  Quote,
  CircleHelp,
} from 'lucide-react';
import { SteeringWheelIcon, RoadIcon, OdishaEmblemIcon, ReviewBubbleIcon } from '@/components/icons/custom-icons';

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
>;

/**
 * Explicit whitelist of icon names usable from content/admin.
 * Names are lucide kebab-case ids, plus the custom `steering-wheel`, `road`, `odisha-emblem`.
 */
export const ICONS: Record<string, IconComponent> = {
  award: Award,
  users: Users,
  car: Car,
  'shield-check': ShieldCheck,
  'graduation-cap': GraduationCap,
  route: Route,
  'calendar-days': CalendarDays,
  star: Star,
  'clipboard-list': ClipboardList,
  'badge-check': BadgeCheck,
  'id-card': IdCard,
  target: Target,
  eye: Eye,
  handshake: Handshake,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
  'thumbs-up': ThumbsUp,
  headphones: Headphones,
  'file-text': FileText,
  'check-circle-2': CircleCheck,
  'message-circle-heart': MessageCircleHeart,
  sparkles: Sparkles,
  wrench: Wrench,
  fuel: Fuel,
  gauge: Gauge,
  'user-check': UserCheck,
  trophy: Trophy,
  'heart-handshake': HeartHandshake,
  shield: Shield,
  'car-front': CarFront,
  'traffic-cone': TrafficCone,
  'building-2': Building2,
  'layout-grid': LayoutGrid,
  'message-circle': MessageCircle,
  camera: Camera,
  copy: Copy,
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  menu: Menu,
  x: X,
  check: Check,
  search: Search,
  quote: Quote,
  // custom
  'steering-wheel': SteeringWheelIcon,
  road: RoadIcon,
  'odisha-emblem': OdishaEmblemIcon,
  'review-bubble': ReviewBubbleIcon,
};

/** Sorted list for admin pickers. */
export const ICON_NAMES = Object.keys(ICONS).sort();

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  name: string;
  size?: number;
  strokeWidth?: number;
}

/** Renders a whitelisted icon by name; unknown names fall back to a help icon. */
export function Icon({ name, size = 24, strokeWidth = 1.75, ...rest }: IconProps) {
  const Component = ICONS[name];
  if (!Component) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Icon] Unknown icon "${name}". Add it to the whitelist in components/ui/icon.tsx.`);
    }
    return <CircleHelp size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
  }
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}
