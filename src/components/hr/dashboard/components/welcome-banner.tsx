"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAppSelector } from "@/src/lib/stores/hooks";

/** Clock-hour boundaries, the way people read them rather than by sunrise. */
function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** How often the greeting re-checks the clock. */
const TICK_MS = 60_000;

/**
 * The time-of-day greeting, resolved after mount.
 *
 * Deliberately not computed during render: the server and the viewer's browser
 * can sit in different timezones — or either side of a boundary — so reading
 * the clock while rendering would hydrate a greeting that disagrees with the
 * server's. It also re-checks each minute, so a dashboard left open overnight
 * doesn't still say "Good morning" in the afternoon.
 */
function useTimeGreeting(): string | null {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setGreeting(greetingFor(new Date().getHours()));
    update();
    const id = setInterval(update, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return greeting;
}

/**
 * The dashboard's page header, on the MOTEE banner artwork.
 *
 * Layered the way every hero photo in this app is (see the auth screens): an
 * inline `backgroundImage` with an absolute scrim over it and the content on
 * `relative z-10`. Not `next/image` with `fill` — `next.config.ts` carries no
 * `images` config and `fill` is used nowhere in the repo.
 *
 * `BASE_TINT` sits behind the photo, so the card still reads as a banner if the
 * artwork is missing or slow to load rather than collapsing to an empty box.
 */
const BANNER_SRC = "/hr-banner-v2.jpg";
const BASE_TINT = "#0b2545";

export function WelcomeBanner() {
  const user = useAppSelector((s) => s.auth.user);
  const greeting = useTimeGreeting();

  return (
    // Full-bleed: `-mx-6 -mt-6` cancels the `p-6` on HrLayout's <main>, so the
    // banner runs edge to edge and sits directly under the navbar. Square
    // corners, since there is no gap left around it for a radius to show in.
    // If that layout padding ever changes, change these to match.
    <div
      className="relative -mx-6 -mt-6 flex min-h-45 items-center overflow-hidden"
      style={{
        backgroundColor: BASE_TINT,
        backgroundImage: `url('${BANNER_SRC}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Darkest where the text sits, so the right of the photo stays visible.
          Tailwind v4 spelling — this project uses bg-linear-to-*. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r via-black/60 from-black/50 to-blue-400/40"
      />

      {/* The card is the same photo in BOTH themes, so the type is pinned
          light rather than following the theme tokens. */}
      <div className="relative z-10 min-w-0 px-6 py-6">
        {/* Both have to be ready: the name arrives with the auth state and
            the greeting only after mount, so the skeleton covers each. */}
        {user?.name && greeting ? (
          <h1 className="text-3xl font-bold text-white ">
            {greeting}, {user.name}!
          </h1>
        ) : (
          <Skeleton className="h-8 w-72 bg-white/20" />
        )}
        <p className="mt-1 text-sm font-medium text-white/75">
          Here&apos;s an overview of today&apos;s workforce activity and key HR
          metrics.
        </p>
      </div>
    </div>
  );
}
