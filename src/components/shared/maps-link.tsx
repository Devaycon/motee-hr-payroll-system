"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** A Google Maps search URL for a free-text address/place string. */
export function googleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

interface MapsLinkProps {
  /** The Maps search query — a "lat,lng" pair or a free-text place/address. */
  address: string;
  className?: string;
  /** Show a label next to the pin. Defaults to true. */
  showLabel?: boolean;
  /**
   * Text to display instead of `address` — for when the link should read as
   * a place name ("Bristol") while still querying a more precise coordinate.
   * Defaults to `address` itself.
   */
  label?: string;
}

/** An address (or place name) that opens Google Maps in a new tab. */
export function MapsLink({
  address,
  className,
  showLabel = true,
  label,
}: MapsLinkProps) {
  return (
    <a
      href={googleMapsSearchUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2",
        className,
      )}
      title={`Open "${label ?? address}" in Google Maps`}
    >
      <MapPin className="w-3 h-3 shrink-0" />
      {showLabel && <span className="truncate">{label ?? address}</span>}
    </a>
  );
}
