import { afterEach, describe, expect, it } from "vitest";
import { PEOPLE_INDEX } from "@/src/data/locale/people-index";
import { localiseDemoInPlace } from "./localise-demo";
import { scopedStorageKey, withCountry } from "./country-storage";

function asCountry(country: "uk" | "ng") {
  const store: Record<string, string> = { "motee:country": country };
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const fixture = () => ({
  PEOPLE: [
    { id: "1", name: "Adaeze Okonkwo", initials: "AO", department: "Engineering" },
    { id: "2", name: "Oliver Hughes", initials: "OH", department: "Operations" },
  ],
  NOTES: [{ title: "Ngozi Obi submitted a claim in Lagos for ₦65,000", reviewer: "Ngozi Obi" }],
  CLAIMS: [{ amount: 40000, currency: "NGN" }],
  PROJECTS: [{ name: "Website Redesign", owner: "Adaeze Okonkwo" }],
});

describe("localiseDemoInPlace", () => {
  it("replaces fixture people with the UK tenant's employees, consistently", () => {
    asCountry("uk");
    const data = fixture();
    localiseDemoInPlace("test", data);
    const uk = new Set(PEOPLE_INDEX.uk.people.map((p) => p.fullName));
    expect(uk.has(data.PEOPLE[0].name)).toBe(true);
    expect(uk.has(data.PEOPLE[1].name)).toBe(true);
    expect(data.PEOPLE[0].name).not.toBe(data.PEOPLE[1].name);
    // Same fixture person → same employee wherever they appear.
    expect(data.PROJECTS[0].owner).toBe(data.PEOPLE[0].name);
    expect(data.NOTES[0].title).toContain(data.NOTES[0].reviewer);
    // Initials follow the new name.
    const parts = data.PEOPLE[0].name.split(" ");
    expect(data.PEOPLE[0].initials).toBe(`${parts[0][0]}${parts[parts.length - 1][0]}`);
    // A project called "Website Redesign" is not a person.
    expect(data.PROJECTS[0].name).toBe("Website Redesign");
  });

  it("swaps Nigerian places and money for UK ones in the UK", () => {
    asCountry("uk");
    const data = fixture();
    localiseDemoInPlace("test", data);
    expect(data.NOTES[0].title).toContain("London");
    expect(data.NOTES[0].title).not.toMatch(/Lagos|₦/);
    expect(data.NOTES[0].title).toContain("£163");
    expect(data.CLAIMS[0]).toEqual({ amount: 100, currency: "GBP" });
  });

  it("keeps Nigeria in naira and names Nigerian employees", () => {
    asCountry("ng");
    const data = fixture();
    localiseDemoInPlace("test", data);
    const ng = new Set(PEOPLE_INDEX.ng.people.map((p) => p.fullName));
    expect(ng.has(data.PEOPLE[1].name)).toBe(true);
    expect(data.NOTES[0].title).toContain("Lagos");
    expect(data.NOTES[0].title).toContain("₦65,000");
    expect(data.CLAIMS[0]).toEqual({ amount: 40000, currency: "NGN" });
  });

  it("is a no-op on the server", () => {
    const data = fixture();
    localiseDemoInPlace("test", data);
    expect(data).toEqual(fixture());
  });
});

describe("country storage", () => {
  it("namespaces keys and API calls per country", () => {
    asCountry("ng");
    expect(scopedStorageKey("approvals")).toBe("motee:ng:approvals");
    expect(withCountry("/api/approvals")).toBe("/api/approvals?country=ng");
    asCountry("uk");
    expect(scopedStorageKey("approvals")).toBe("motee:uk:approvals");
  });
});
