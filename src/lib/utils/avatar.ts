/**
 * Deterministic, gender-accurate profile-photo URLs for people across the app.
 *
 * Uses randomuser.me's gendered portrait set
 * (`/api/portraits/{men|women}/{0-99}.jpg`) — a reliable, free, no-key CDN that
 * loads in the browser. The image is keyed off the person's full name so the
 * same person shows the same photo everywhere.
 *
 * Gender is resolved to be accurate even on screens that don't carry a gender
 * field: explicit `gender` → the per-person {@link PEOPLE_GENDERS} map → a
 * first-name fallback → a stable hash. The initials `AvatarFallback` still
 * covers any load/error.
 */

import {
  PEOPLE_GENDERS,
  FIRST_NAME_GENDERS,
  type SimpleGender,
} from "@/src/data/people-genders";

const PORTRAIT_COUNT = 100;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Normalize a free-form gender string to "male"/"female", else undefined. */
function normalizeGender(gender?: string | null): SimpleGender | undefined {
  const g = gender?.trim().toLowerCase();
  if (!g) return undefined;
  if (g.startsWith("f")) return "female";
  if (g.startsWith("m")) return "male";
  return undefined; // non_binary / prefer_not_to_say / unknown → resolve below
}

/** Resolve a person's gender as accurately and consistently as possible. */
function resolveGender(name: string, gender?: string | null): SimpleGender {
  const key = name.trim().toLowerCase();
  const firstName = key.split(/\s+/)[0];
  return (
    normalizeGender(gender) ??
    PEOPLE_GENDERS[key] ??
    FIRST_NAME_GENDERS[firstName] ??
    (hashString(key || "anonymous") % 2 === 0 ? "male" : "female")
  );
}

/**
 * Stable, gender-accurate avatar URL for a person.
 * @param seed   The person's full name (used as the deterministic key).
 * @param gender "male"/"female" when the call site has it; otherwise resolved.
 */
export function personPhotoUrl(seed: string, gender?: string | null): string {
  const name = (seed ?? "").trim();
  const bucket = resolveGender(name, gender) === "female" ? "women" : "men";
  const index = hashString(name.toLowerCase() || "anonymous") % PORTRAIT_COUNT;
  return `https://randomuser.me/api/portraits/${bucket}/${index}.jpg`;
}
