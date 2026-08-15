/**
 * §9.15 — mileage calculation for travel claims.
 *
 * Rates are per-distance-unit and vary by tenant/jurisdiction, so the caller
 * supplies the rate; the defaults below are the UK HMRC approved rates, which
 * is the case the client described.
 */

export type DistanceUnit = "miles" | "km";

/** UK HMRC approved mileage rates (car/van), as at the 2025/26 tax year. */
export const DEFAULT_MILEAGE_RATES = {
  /** First 10,000 business miles in the tax year. */
  standardPerMile: 0.45,
  /** Above 10,000 miles. */
  reducedPerMile: 0.25,
  /** Threshold at which the reduced rate starts. */
  thresholdMiles: 10_000,
} as const;

const KM_PER_MILE = 1.609_34;

export interface MileageInput {
  distance: number;
  unit: DistanceUnit;
  /** Rate per mile. Defaults to the standard HMRC rate. */
  ratePerMile?: number;
  /** Business miles already claimed this tax year, for the tapered rate. */
  milesAlreadyClaimed?: number;
  /** Apply the reduced rate above the threshold. Off unless asked for. */
  applyTaper?: boolean;
}

export interface MileageResult {
  /** Distance normalised to miles. */
  miles: number;
  amount: number;
  /** Human-readable working, written into the claim's notes. */
  workings: string;
}

/**
 * Work out what a journey is worth.
 *
 * The taper matters for anyone who drives a lot: the first 10,000 miles are
 * worth 45p and everything after is 25p, so a flat rate over-claims. It is off
 * by default because it needs a year-to-date figure the form doesn't always
 * have.
 */
export function calculateMileage({
  distance,
  unit,
  ratePerMile = DEFAULT_MILEAGE_RATES.standardPerMile,
  milesAlreadyClaimed = 0,
  applyTaper = false,
}: MileageInput): MileageResult {
  const miles = unit === "km" ? distance / KM_PER_MILE : distance;
  const safeMiles = Number.isFinite(miles) && miles > 0 ? miles : 0;

  if (!applyTaper) {
    const amount = safeMiles * ratePerMile;
    return {
      miles: round(safeMiles),
      amount: round(amount),
      workings: `${round(safeMiles)} miles × ${ratePerMile.toFixed(2)}/mile = ${round(amount).toFixed(2)}`,
    };
  }

  const { thresholdMiles, reducedPerMile } = DEFAULT_MILEAGE_RATES;
  const remainingAtFullRate = Math.max(0, thresholdMiles - milesAlreadyClaimed);
  const atFullRate = Math.min(safeMiles, remainingAtFullRate);
  const atReducedRate = safeMiles - atFullRate;

  const amount = atFullRate * ratePerMile + atReducedRate * reducedPerMile;
  const parts = [`${round(atFullRate)} mi × ${ratePerMile.toFixed(2)}`];
  if (atReducedRate > 0) {
    parts.push(`${round(atReducedRate)} mi × ${reducedPerMile.toFixed(2)}`);
  }

  return {
    miles: round(safeMiles),
    amount: round(amount),
    workings: `${parts.join(" + ")} = ${round(amount).toFixed(2)}`,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
