"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Modules the user has pinned to the top of their sidebar (client feedback —
 * "I'd allow users to favourite modules. This saves clicks.").
 *
 * A hook over localStorage rather than a Redux slice: this is a per-device UI
 * preference that only the sidebar reads, so putting it in the store would add
 * a reducer, a persistence subscriber and a provider wire-up for no gain.
 *
 * Keyed per portal, because the HR sidebar and the employee sidebar are
 * different route sets — a favourite in one is meaningless in the other.
 */
export type NavFavouritesRole = "hr" | "employee" | "motee";

function storageKey(role: NavFavouritesRole) {
  return `motee:nav-favourites:${role}`;
}

function read(role: NavFavouritesRole): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(role));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function useNavFavourites(role: NavFavouritesRole) {
  // Starts empty on both server and first client render so the markup matches;
  // the stored list arrives in the effect below.
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    setFavourites(read(role));
  }, [role]);

  const toggle = useCallback(
    (href: string) => {
      setFavourites((prev) => {
        const next = prev.includes(href)
          ? prev.filter((h) => h !== href)
          : [...prev, href];
        try {
          window.localStorage.setItem(storageKey(role), JSON.stringify(next));
        } catch {
          // A full or blocked quota shouldn't break navigation.
        }
        return next;
      });
    },
    [role],
  );

  const isFavourite = useCallback(
    (href: string) => favourites.includes(href),
    [favourites],
  );

  return { favourites, toggle, isFavourite };
}
