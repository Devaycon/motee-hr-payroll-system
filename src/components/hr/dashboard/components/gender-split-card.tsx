"use client";

import { VenusAndMars } from "lucide-react";
import { HeroRingCard } from "@/src/components/shared/charts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useGenderSplit } from "../hooks";

/**
 * Boy/girl illustrations for the two binary genders; a neutral icon for
 * anything else. Every icon is tinted to match its own ring segment — the
 * illustrations are recolored via a CSS mask (the PNG's alpha channel used
 * as a stencil for `color`) rather than drawn as-is, since a plain `<img>`
 * can't pick up an arbitrary hex color per segment.
 */
function genderIcon(key: string, color: string) {
  if (key === "male" || key === "female") {
    const src = key === "male" ? "/boy-icon.png" : "/girl-icon.png";
    return (
      <span
        className="block h-full w-full"
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      />
    );
  }
  return <VenusAndMars className="h-full w-full" style={{ color }} />;
}

/** The People tab's hero card: workforce gender mix, with the same rings/summary/ranked-breakdown pattern used across the dashboard. */
export function PeopleHeroRing() {
  const { data, loading } = useGenderSplit();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  if (data.series.length === 0) return null;

  const segments = data.series.map((s) => ({ ...s, icon: genderIcon(s.key, s.color) }));

  return (
    <HeroRingCard
      title="Workforce Status"
      description="Headcount by gender, across the whole workforce"
      segments={segments}
      totalNoun="employees"
      viewMoreHref="/operations/analytics/gender"
    />
  );
}
