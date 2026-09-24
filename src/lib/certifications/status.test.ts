import { describe, expect, it } from "vitest";
import { certStatus, daysToExpiry, summariseCertifications } from "./status";

const TODAY = new Date(2026, 8, 24); // 24 Sep 2026, local
const inDays = (n: number) =>
  new Date(Date.UTC(2026, 8, 24) + n * 86_400_000).toISOString().slice(0, 10);

describe("certStatus", () => {
  it("bands by days to expiry: >60 active, ≤60 amber, ≤30 orange, past red", () => {
    expect(certStatus(inDays(61), TODAY)).toBe("active");
    expect(certStatus(inDays(60), TODAY)).toBe("expiring_60");
    expect(certStatus(inDays(31), TODAY)).toBe("expiring_60");
    expect(certStatus(inDays(30), TODAY)).toBe("expiring_30");
    expect(certStatus(inDays(0), TODAY)).toBe("expiring_30");
    expect(certStatus(inDays(-1), TODAY)).toBe("expired");
  });

  it("treats a missing expiry as never expiring", () => {
    expect(certStatus(null, TODAY)).toBe("no_expiry");
    expect(daysToExpiry(undefined, TODAY)).toBeNull();
  });
});

describe("summariseCertifications", () => {
  it("counts active as not-yet-expired and nests the 30-day window inside the 90-day one", () => {
    const s = summariseCertifications(
      [
        { expiresAt: inDays(-5) },
        { expiresAt: inDays(10) },
        { expiresAt: inDays(75) },
        { expiresAt: inDays(400) },
        { expiresAt: null },
      ],
      TODAY,
    );
    expect(s).toEqual({
      total: 5,
      active: 4,
      expiringIn30: 1,
      expiringIn90: 2,
      expired: 1,
      complianceRate: 80,
    });
  });

  it("reports full compliance for an empty register", () => {
    expect(summariseCertifications([], TODAY).complianceRate).toBe(100);
  });
});
