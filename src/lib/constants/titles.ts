/**
 * Personal titles, and how they relate to gender.
 *
 * The title list was duplicated across four screens and offered every option to
 * everyone, which is how a male employee ended up recorded as "Mrs". Titles are
 * now derived from — and validated against — the person's gender, with the
 * honorifics kept available to all genders because they're earned, not gendered.
 */

/**
 * "non_binary" and "undisclosed" are kept apart deliberately: non-binary is a
 * stated identity, so Mr/Mrs contradicts it and only Mx is offered. Undisclosed
 * means we simply don't know — that person may well be a Mr, so blocking it
 * would be worse than the mismatch we're guarding against.
 */
export type SimpleGender = "male" | "female" | "non_binary" | "undisclosed";

/** Earned or gender-neutral titles — offered to everyone. */
export const HONORIFIC_TITLES = ["Dr", "Prof", "Rev"] as const;

export const MALE_TITLES = ["Mr"] as const;
/** Ms first: it's the choice that doesn't ask about marital status. */
export const FEMALE_TITLES = ["Ms", "Mrs", "Miss"] as const;
/** For non-binary, undisclosed or unknown gender. */
export const NEUTRAL_TITLES = ["Mx"] as const;

/** Every title the system recognises. */
export const TITLE_OPTIONS = [
  ...MALE_TITLES,
  ...FEMALE_TITLES,
  ...NEUTRAL_TITLES,
  ...HONORIFIC_TITLES,
] as const;

export type PersonTitle = (typeof TITLE_OPTIONS)[number];

/** Normalise a free-form gender value onto the four cases we act on. */
export function normalizeGender(gender?: string | null): SimpleGender {
  const g = gender?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!g) return "undisclosed";
  if (g.startsWith("f") || g === "woman") return "female";
  if (g === "non_binary" || g === "nonbinary" || g === "nb" || g === "mx") {
    return "non_binary";
  }
  if (g.startsWith("m")) return "male";
  // "other", "prefer_not_to_say", anything unrecognised.
  return "undisclosed";
}

/** True for titles that carry no gender, so any employee may hold one. */
export function isHonorific(title?: string | null): boolean {
  if (!title) return false;
  const t = title.replace(/\.$/, "").trim().toLowerCase();
  return HONORIFIC_TITLES.some((h) => h.toLowerCase() === t);
}

/**
 * Female titles also encode marital status, so the two have to agree:
 * "Miss" is an unmarried woman and "Mrs" a married one — a married Miss is a
 * contradiction, not a preference. "Ms" asserts nothing and is always allowed.
 *
 * Divorced is deliberately permissive: all three are in common use afterwards,
 * and it isn't the system's place to decide.
 */
function femaleTitlesFor(maritalStatus?: string | null): readonly string[] {
  switch (maritalStatus?.trim().toLowerCase()) {
    case "married":
    case "separated":
      return ["Mrs", "Ms"];
    case "widowed":
      return ["Mrs", "Ms"];
    case "single":
      return ["Miss", "Ms"];
    case "divorced":
      return ["Ms", "Mrs", "Miss"];
    default:
      return FEMALE_TITLES;
  }
}

/**
 * The titles to offer for a person: the honorifics, plus the ones their gender
 * — and, for women, their marital status — actually permit. Used to build the
 * Title dropdown so an impossible combination can't be picked in the first
 * place.
 */
export function titlesForGender(
  gender?: string | null,
  maritalStatus?: string | null,
): string[] {
  const g = normalizeGender(gender);
  const gendered =
    g === "male"
      ? MALE_TITLES
      : g === "female"
        ? femaleTitlesFor(maritalStatus)
        : NEUTRAL_TITLES;
  // Undisclosed gender also gets both gendered sets — that person may well be a
  // Mr, and blocking it would be worse than the mismatch we're guarding against.
  // Non-binary does not: Mr/Mrs would contradict a stated identity.
  const extra =
    g === "undisclosed"
      ? [...MALE_TITLES, ...femaleTitlesFor(maritalStatus)]
      : ([] as readonly string[]);
  return [...gendered, ...extra, ...HONORIFIC_TITLES];
}

/**
 * The title to use when none is recorded. Marital status refines the female
 * case; without it, "Ms" is the correct neutral choice rather than assuming.
 */
export function defaultTitleForGender(
  gender?: string | null,
  maritalStatus?: string | null,
): PersonTitle {
  const g = normalizeGender(gender);
  if (g === "male") return "Mr";
  if (g === "female") {
    const m = maritalStatus?.trim().toLowerCase();
    if (m === "married" || m === "separated" || m === "widowed") return "Mrs";
    if (m === "single") return "Miss";
    // divorced / unknown — "Ms" asserts nothing.
    return "Ms";
  }
  return "Mx";
}

/**
 * Whether a recorded title can belong to this person. Checks gender *and*
 * marital status, so "Miss" fails for a married woman.
 */
export function isTitleValidForGender(
  title?: string | null,
  gender?: string | null,
  maritalStatus?: string | null,
): boolean {
  if (!title) return true;
  if (isHonorific(title)) return true;
  const t = title.replace(/\.$/, "").trim().toLowerCase();
  return titlesForGender(gender, maritalStatus).some((o) => o.toLowerCase() === t);
}

/**
 * The title a person should hold: keeps an existing honorific (a doctor stays a
 * doctor whatever their gender), keeps any title that already agrees with both
 * their gender and marital status, and otherwise replaces a contradictory one.
 */
export function reconcileTitle(
  title?: string | null,
  gender?: string | null,
  maritalStatus?: string | null,
): PersonTitle | string {
  if (isHonorific(title)) return title!;
  if (title && isTitleValidForGender(title, gender, maritalStatus)) return title;
  return defaultTitleForGender(gender, maritalStatus);
}

/** "Dr Arjun Taylor" — the title prefixed to a name, when one is known. */
export function withTitle(name: string, title?: string | null): string {
  return title ? `${title} ${name}` : name;
}
