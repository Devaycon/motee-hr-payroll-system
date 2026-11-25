import { describe, expect, it } from "vitest";
import {
  orgChartFromApi,
  profileFromApi,
  profileToRequest,
  stageFromApi,
  verificationFromApi,
} from "./api-mapping";
import type { CompanyProfileDto, VerificationDto } from "@/src/types/company";

const profile: CompanyProfileDto = {
  name: "Acme",
  legalName: "Acme Holdings Ltd",
  industry: "Retail",
  countryCode: { value: "NG" },
  countryName: "Nigeria",
  address: "1 Marina, Lagos",
  contactEmail: "hr@acme.test",
  contactPhone: "0800",
  website: "acme.test",
  sizeBand: "51–200",
  headcount: 80,
};

const verification = (kind: "registration" | "tax", stage: VerificationDto["stage"]): VerificationDto => ({
  kind,
  label: kind === "tax" ? "Tax ID" : "CAC",
  numberLabel: "No.",
  authority: "Gov",
  description: "",
  number: "RC1",
  documentFileId: "f1",
  stage,
  editable: true,
  canSubmit: true,
  outstanding: [],
  history: [{ event: "submitted", by: "Ada", at: "2026-11-01T10:00:00Z" }],
});

describe("company api-mapping", () => {
  it("maps the profile and back", () => {
    const ui = profileFromApi(profile);
    expect(ui).toMatchObject({ name: "Acme Holdings Ltd", country: "Nigeria", size: "51–200" });
    expect(profileToRequest(ui, profile)).toEqual({
      name: "Acme",
      legalName: "Acme Holdings Ltd",
      industry: "Retail",
      contactEmail: "hr@acme.test",
      contactPhone: "0800",
      website: "acme.test",
    });
  });

  it("maps verification stages and history", () => {
    expect(stageFromApi("underReview")).toBe("Under Review");
    expect(stageFromApi("unknown")).toBe("Draft");
    const data = verificationFromApi(
      [verification("registration", "verified"), verification("tax", "submitted")],
      { f1: "cac.pdf" },
    );
    expect(data?.registration.status).toBe("Verified");
    expect(data?.tax.status).toBe("Submitted");
    expect(data?.registration.documentName).toBe("cac.pdf");
    expect(data?.tax.history[0]).toEqual({ stage: "Submitted", date: "2026-11-01T10:00:00Z", reviewer: "Ada" });
    expect(verificationFromApi([verification("tax", "draft")])).toBeNull();
  });

  it("keeps the top tiers of the org chart", () => {
    const nodes = orgChartFromApi({
      nodes: [
        { id: "a", name: "Ada Obi", level: 1, directReports: 1, detached: false },
        { id: "b", name: "Bo", reportsTo: "a", level: 4, directReports: 0, detached: false },
      ],
      roots: ["a"],
      unplaced: [],
    });
    expect(nodes).toEqual([{ id: "a", name: "Ada Obi", initials: "AO", role: "", dept: "", reportsTo: null }]);
  });
});
