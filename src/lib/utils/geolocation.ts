export interface GeoCaptureResult {
  /** "lat,lng" string, rounded to ~1m precision — what `MapsLink` expects. */
  coords: string | null;
  error?: string;
}

/**
 * Captures the device's current position at the moment it's called (a clock
 * punch, not a subscription), so a clock-in and its later clock-out can each
 * carry their own reading rather than one stale position for the whole day.
 *
 * Resolves — never rejects — with `coords: null` when permission is denied,
 * the device has no geolocation, or it times out, so a punch is never blocked
 * on location; the caller decides whether to surface `error`.
 */
export function getCurrentCoords(timeoutMs = 8000): Promise<GeoCaptureResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ coords: null, error: "Location isn't available on this device." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ coords: `${latitude.toFixed(5)},${longitude.toFixed(5)}` });
      },
      (err) => {
        resolve({
          coords: null,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied."
              : "Couldn't get your location.",
        });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}
