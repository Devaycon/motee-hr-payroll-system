import type { CountryKey } from "@/src/lib/types/locale";

/**
 * The demo's UK ⇄ Nigeria context, persisted in this browser.
 *
 * The country is chosen once per page load: switching writes it here and
 * reloads the whole site (see {@link switchCountry}), so every slice, listener
 * and persistence layer boots against exactly one country and nothing has to
 * be reset in place. That's why the helpers below read localStorage directly
 * instead of the Redux store — they're used at module scope by the
 * `*-persistence.ts` files, before the store has been told the country.
 */
export const COUNTRY_KEY = "motee:country";

const COUNTRIES: readonly CountryKey[] = ["ng", "uk"];
export const DEFAULT_COUNTRY: CountryKey = "ng";

export function isCountryKey(value: unknown): value is CountryKey {
  return typeof value === "string" && (COUNTRIES as readonly string[]).includes(value);
}

export function readStoredCountry(): CountryKey {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;
  try {
    const raw = window.localStorage.getItem(COUNTRY_KEY);
    return isCountryKey(raw) ? raw : DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

export function writeStoredCountry(country: CountryKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COUNTRY_KEY, country);
  } catch {
    // private mode / quota — the reload still happens, it just won't stick
  }
}

/**
 * The localStorage key for one slice's data in the active country.
 *
 * Each country has its own namespace (`motee:uk:*`, `motee:ng:*`). The old
 * un-prefixed keys predate the switch and mix both countries' data, so they
 * are deliberately left behind rather than read.
 */
export function scopedStorageKey(base: string): string {
  return `motee:${readStoredCountry()}:${base}`;
}

/** Tags a runtime API URL with the active country so the server picks its file. */
export function withCountry(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}country=${readStoredCountry()}`;
}

/**
 * Portal detail routes whose `[id]` belongs to one country's bundle. After a
 * switch the id doesn't exist in the other country, so the page would render
 * empty; send the user to the list instead.
 */
function listRouteFor(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  // An id segment looks like GB-EMP-0016 / NG-REQ-003 / a uuid / anything with digits.
  const idIndex = parts.findIndex(
    (p, i) => i > 0 && /\d/.test(p) && /[-_]/.test(p),
  );
  if (idIndex === -1) return null;
  return `/${parts.slice(0, idIndex).join("/")}`;
}

/**
 * Switches the whole demo to `country`: persists it, then reloads so every
 * module is rebuilt from that country's own data — the signed-in persona is
 * re-resolved from the same role id in the new bundle (HR Admin is William
 * Jones in the UK and Chinedu Lawal in Nigeria).
 */
export function switchCountry(country: CountryKey): void {
  if (typeof window === "undefined") return;
  if (readStoredCountry() === country) return;
  writeStoredCountry(country);
  const target = listRouteFor(window.location.pathname);
  if (target) window.location.assign(target);
  else window.location.reload();
}
