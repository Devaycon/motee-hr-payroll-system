import type { AttendanceRecord } from "./types";

/** The two fields a record needs to be pointed at on a map. */
export type LocatableRecord = Pick<
  AttendanceRecord,
  "locationCoords" | "locationAddress"
>;

/**
 * Builds a Google Maps search URL for a punch's location, preferring the
 * captured "lat,lng" over the free-text address when both are present.
 * `null` when the record has neither — callers use this to disable the
 * "Open Location" action rather than opening a search for nothing.
 */
export function attendanceMapsUrl(record: LocatableRecord): string | null {
  const query = record.locationCoords || record.locationAddress;
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Opens the record's location in a new tab, or no-ops when there isn't one. */
export function openAttendanceLocation(record: LocatableRecord): void {
  const url = attendanceMapsUrl(record);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
