import {
  Package2,
  Laptop2,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
} from "lucide-react";
import type { ElementType } from "react";

export const ASSET_TYPE_ICONS: Record<string, ElementType> = {
  laptop: Laptop2,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  other: Package2,
};

export const MY_EMPLOYEE = "Adaeze Okonkwo";
