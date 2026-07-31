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
  if (g.startsWith("m") && !g.startsWith("mx")) return "male";
  return undefined; // non_binary / prefer_not_to_say / unknown → resolve below
}

/**
 * Genders that are a deliberate statement rather than a gap in the data. The
 * portrait set only has "men" and "women" buckets, so picking either one would
 * put a gendered face on someone who has said they don't have one — these fall
 * back to the initials avatar instead.
 */
function isDeclinedGender(gender?: string | null): boolean {
  const g = gender?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (
    g === "non_binary" ||
    g === "nonbinary" ||
    g === "nb" ||
    g === "prefer_not_to_say" ||
    g === "prefer_not_to_state"
  );
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
 *
 * Returns `undefined` when the person has declined to state a gender, so the
 * caller shows initials rather than an arbitrary man or woman.
 *
 * @param seed   The person's full name (used as the deterministic key).
 * @param gender "male"/"female" when the call site has it; otherwise resolved.
 */
export function personPhotoUrl(
  seed: string,
  gender?: string | null,
): string | undefined {
  if (isDeclinedGender(gender)) return undefined;
  const name = (seed ?? "").trim();
  const bucket = resolveGender(name, gender) === "female" ? "women" : "men";
  const index = hashString(name.toLowerCase() || "anonymous") % PORTRAIT_COUNT;
  return `https://randomuser.me/api/portraits/${bucket}/${index}.jpg`;
}
