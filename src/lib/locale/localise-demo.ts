import { PEOPLE_INDEX, type IndexedPerson } from "@/src/data/locale/people-index";
import { readStoredCountry } from "./country-storage";
import type { CountryKey } from "@/src/lib/types/locale";

/**
 * Makes the static `src/data/*-demo.ts` fixtures follow the UK ⇄ Nigeria switch.
 *
 * Those fixtures were written once, mostly with Nigerian names, cities and
 * naira amounts, and ~190 screens import them directly. Rather than thread the
 * country through every one of those screens, each fixture module calls
 * {@link localiseDemoInPlace} on its own exports as it loads. The country is
 * fixed for the life of a page (switching reloads the site), so a one-off,
 * in-place rewrite at import time is enough:
 *
 *  - every person named in the fixture becomes one of the active country's
 *    own employees (with matching initials, everywhere the name appears);
 *  - in the UK, Nigerian cities, ₦ amounts and NGN records become their UK
 *    equivalents; in Nigeria, the reverse.
 *
 * Only runs in the browser. The server render and unit tests see the fixtures
 * untouched, and `ReduxProvider` renders nothing until mounted, so the server
 * HTML never disagrees with the localised client.
 */

/** Keys whose value is always a person's name. */
const PERSON_KEYS = new Set([
  "fullName", "employeeName", "userName", "requester", "requesterName", "requestedBy",
  "submittedBy", "submitterName", "reviewer", "reviewerName", "approver", "approverName",
  "approvedBy", "assignee", "assigneeName", "assignedTo", "assignedToName", "owner",
  "ownerName", "manager", "managerName", "lineManager", "lineManagerName", "author",
  "authorName", "createdBy", "updatedBy", "actorName", "candidateName", "employee",
  "raisedBy", "reportedBy", "sender", "senderName", "recipient", "recipientName",
  "person", "personName", "member", "memberName", "interviewer", "mentor", "coach", "buddy",
  "buddyName", "hiringManager", "recruiter", "nominee", "nominatedBy", "giver", "receiver",
  "fromName", "toName", "sentBy", "handledBy", "investigator", "decidedBy", "signedBy",
  "holder", "custodian", "lead", "leadName", "giverName", "receiverName", "nomineeName",
  "accusedName", "complainantName", "respondentName", "caseOwner", "approvedByName",
  "requestedByName", "createdByName", "reportedByName", "assignedBy", "issuedTo",
]);
/** A generic `name` is a person only when the object also looks like a person. */
const PERSON_HINT_KEYS = ["initials", "avatar", "email", "employeeId", "department", "departmentName", "jobTitle", "role", "position"];

/** "Adaeze Okonkwo", "Mary-Jane O'Neil", "Chukwuemeka Eze Obi". */
const NAME_PATTERN = /^[A-Z][a-z]+(?:-[A-Z][a-z]+)?(?: [A-Z][a-z']+(?:-[A-Z][a-z]+)?){1,2}$/;

/** Branch cities line up by index across the two bundles (Lagos ↔ London …). */
const CITY_PAIRS: Array<[string, string]> = (() => {
  const ng = PEOPLE_INDEX.ng.cities;
  const uk = PEOPLE_INDEX.uk.cities;
  const pairs: Array<[string, string]> = ng
    .slice(0, Math.min(ng.length, uk.length))
    .map((c, i) => [c, uk[i]]);
  return [
    ...pairs,
    ["Victoria Island", "Canary Wharf"],
    ["Ikeja", "Croydon"],
    ["Lekki", "Shoreditch"],
    ["Yaba", "Islington"],
    ["Nigerians", "Britons"],
    ["Nigerian", "British"],
    ["Nigeria", "United Kingdom"],
  ];
})();

const NGN_PER_GBP = 400;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatMoney(symbol: string, value: number): string {
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
  return `${symbol}${rounded.toLocaleString("en-GB")}`;
}

interface Localiser {
  country: CountryKey;
  people: IndexedPerson[];
  localNames: Set<string>;
  /** fixture name → local person, assigned in order of first appearance. */
  map: Map<string, IndexedPerson>;
  offset: number;
  textRules: Array<[RegExp, string | ((m: string, ...g: string[]) => string)]>;
}

function personFor(L: Localiser, name: string): IndexedPerson | null {
  if (L.localNames.has(name) || L.people.length === 0) return null;
  let p = L.map.get(name);
  if (!p) {
    p = L.people[(L.offset + L.map.size) % L.people.length];
    L.map.set(name, p);
  }
  return p;
}

/** Pass 1: find every person-shaped name and assign it a local employee. */
function collectNames(L: Localiser, value: unknown, seen: Set<unknown>): void {
  if (Array.isArray(value)) {
    if (seen.has(value)) return;
    seen.add(value);
    for (const v of value) collectNames(L, v, seen);
    return;
  }
  if (!isPlainObject(value) || seen.has(value)) return;
  seen.add(value);
  const looksLikePerson = PERSON_HINT_KEYS.some((k) => k in value);
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "string") {
      const personKey = PERSON_KEYS.has(key) || (key === "name" && looksLikePerson);
      if (personKey && NAME_PATTERN.test(v)) personFor(L, v);
    } else {
      collectNames(L, v, seen);
    }
  }
}

function rewriteString(L: Localiser, s: string): string {
  let out = s;
  for (const [re, to] of L.textRules) {
    out = typeof to === "string" ? out.replace(re, to) : out.replace(re, to as never);
  }
  return out;
}

const MONEY_KEYS = new Set(["amount", "salary", "value", "cost", "budget", "total", "price", "balance"]);

/** Pass 2: rewrite names, initials, places and money in place. */
function rewrite(L: Localiser, value: unknown, seen: Set<unknown>): void {
  if (Array.isArray(value)) {
    if (seen.has(value)) return;
    seen.add(value);
    for (let i = 0; i < value.length; i++) {
      const v = value[i];
      if (typeof v === "string") value[i] = rewriteString(L, v);
      else rewrite(L, v, seen);
    }
    return;
  }
  if (!isPlainObject(value) || seen.has(value)) return;
  seen.add(value);
  const obj = value;

  // Records stamped with the other country's currency.
  const foreignCurrency = L.country === "uk" ? "NGN" : "GBP";
  const localCurrency = L.country === "uk" ? "GBP" : "NGN";
  const currencyKey = ["currency", "contractCurrency", "currencyCode"].find((k) => obj[k] === foreignCurrency);
  if (currencyKey) {
    obj[currencyKey] = localCurrency;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (MONEY_KEYS.has(k) && typeof v === "number") {
        obj[k] = L.country === "uk" ? Math.round((v / NGN_PER_GBP) * 100) / 100 : Math.round(v * NGN_PER_GBP);
      }
    }
  }

  let renamed: IndexedPerson | null = null;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string") {
      const mapped = L.map.get(v);
      if (mapped) {
        obj[key] = mapped.fullName;
        renamed ??= mapped;
        // Keep a sibling `<prefix>Initials` in step with `<prefix>Name`.
        const prefix = key.replace(/(Name|By)$/, "");
        const initialsKey = prefix && prefix !== key ? `${prefix}Initials` : null;
        if (initialsKey && typeof obj[initialsKey] === "string") obj[initialsKey] = initialsOf(mapped.fullName);
      } else {
        obj[key] = rewriteString(L, v);
      }
    } else {
      rewrite(L, v, seen);
    }
  }
  if (renamed) {
    for (const k of ["initials", "avatar", "avatarInitials"]) {
      if (typeof obj[k] === "string" && /^[A-Z]{1,3}$/.test(obj[k] as string)) {
        obj[k] = initialsOf(renamed.fullName);
      }
    }
  }
}

function buildTextRules(L: Localiser): Localiser["textRules"] {
  const rules: Localiser["textRules"] = [];
  // Names mentioned in free text ("Ngozi Obi submitted…"), longest first.
  const names = [...L.map.keys()].sort((a, b) => b.length - a.length);
  if (names.length) {
    const re = new RegExp(`\\b(${names.map(escapeRe).join("|")})\\b`, "g");
    rules.push([re, (m: string) => L.map.get(m)?.fullName ?? m]);
  }
  const pairs = L.country === "uk" ? CITY_PAIRS : CITY_PAIRS.map(([a, b]) => [b, a] as [string, string]);
  for (const [from, to] of pairs) {
    if (from === to) continue;
    rules.push([new RegExp(`\\b${escapeRe(from)}\\b`, "g"), to]);
  }
  if (L.country === "uk") {
    // ₦40k / ₦65,000 / ₦1.2M → sterling.
    rules.push([
      /₦\s?([\d,]+(?:\.\d+)?)\s?([kKmM])?/g,
      (_m: string, num: string, unit?: string) => {
        const n = Number(num.replace(/,/g, "")) * (unit ? (/[mM]/.test(unit) ? 1e6 : 1e3) : 1);
        const gbp = n / NGN_PER_GBP;
        if (unit && gbp >= 1e6) return `£${(gbp / 1e6).toFixed(1)}M`;
        if (unit && gbp >= 1e3) return `£${Math.round(gbp / 1e3)}k`;
        return formatMoney("£", gbp);
      },
    ]);
    rules.push([/\bNGN\b/g, "GBP"]);
    rules.push([/\bnaira\b/gi, "pounds"]);
  } else {
    rules.push([
      /£\s?([\d,]+(?:\.\d+)?)\s?([kKmM])?/g,
      (_m: string, num: string, unit?: string) => {
        const n = Number(num.replace(/,/g, "")) * (unit ? (/[mM]/.test(unit) ? 1e6 : 1e3) : 1);
        return formatMoney("₦", n * NGN_PER_GBP);
      },
    ]);
    rules.push([/\bGBP\b/g, "NGN"]);
  }
  return rules;
}

/**
 * Rewrites a fixture module's exports for the active country, in place.
 * `fixtureId` keeps the person assignment stable for that module across page
 * loads (the same fixture name always becomes the same employee).
 */
export function localiseDemoInPlace(fixtureId: string, exports: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const country = readStoredCountry();
  const people = PEOPLE_INDEX[country]?.people ?? [];
  const L: Localiser = {
    country,
    people,
    localNames: new Set(people.map((p) => p.fullName)),
    map: new Map(),
    offset: hash(fixtureId) % Math.max(1, people.length),
    textRules: [],
  };
  const values = Object.values(exports);
  const seen = new Set<unknown>();
  for (const v of values) collectNames(L, v, seen);
  L.textRules = buildTextRules(L);
  const seen2 = new Set<unknown>();
  for (const v of values) rewrite(L, v, seen2);
}
