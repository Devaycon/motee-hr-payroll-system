"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface SidebarBrandProps {
  href: string;
  /** Accessible name for the link, and alt text for the mark. */
  label: string;
  /** Wordmark shown while the rail is open. */
  wordmark: string;
  collapsed: boolean;
  /** Square mark shown while the rail is collapsed. */
  tile?: string;
}

/**
 * The sidebar logo in both rail states.
 *
 * Both marks stay mounted, each at its own fixed size, and only visibility
 * changes. Swapping a single `<Image>`'s `src` and `width` on toggle resized the
 * box immediately while the browser was still decoding the new file, so the
 * previous mark was stretched into the new box for a frame — the tile briefly
 * ballooning to wordmark width on every collapse.
 *
 * The link also clips its own overflow: the rail animates its width over 200ms
 * while the wordmark appears at full size on the first frame, so without this
 * it hangs outside the sidebar until the animation catches up. Clipped, it
 * wipes into view as the rail widens.
 */
export function SidebarBrand({
  href,
  label,
  wordmark,
  collapsed,
  tile = "/logo-tile.svg",
}: SidebarBrandProps) {
  return (
    <Link href={href} aria-label={label} className="min-w-0 overflow-hidden">
      <Image
        src={tile}
        alt={label}
        width={36}
        height={36}
        priority
        className={cn("object-contain", collapsed ? "block" : "hidden")}
      />
      {/* `max-w-none` opts out of Tailwind's `img { max-width: 100% }`, so the
          mark keeps its size and gets clipped mid-animation instead of being
          scaled down and growing back. */}
      <Image
        src={wordmark}
        alt={label}
        width={200}
        height={36}
        priority
        className={cn(
          "max-w-none object-contain",
          collapsed ? "hidden" : "block",
        )}
      />
    </Link>
  );
}
