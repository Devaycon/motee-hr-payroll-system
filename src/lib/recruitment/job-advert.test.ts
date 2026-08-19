import { describe, expect, it } from "vitest";
import {
  advertWarnings,
  buildAdvertDoc,
  toDocSections,
  toJobPostingJsonLd,
  toPlainText,
} from "./job-advert";
import type { ProfileData } from "@/src/lib/types/company-profile";
import type { JobRequisition } from "@/src/lib/types/recruitment";

/**
 * Distinctive sentinel strings, so a leak is unambiguous: if any of these turn
 * up in an export, an internal field reached a public job advert.
 */
const SECRET = {
  hiringManager: "ZZINTERNALMANAGERZZ",
  quizAnswer: "ZZQUIZANSWERZZ",
  filterName: "ZZFILTERNAMEZZ",
  approvalId: "ZZAPPROVALZZ",
  workforceId: "ZZWORKFORCEZZ",
  sourceReqId: "ZZSOURCEREQZZ",
  internalId: "ZZINTERNALIDZZ",
  gateFieldId: "ZZGATEFIELDZZ",
  allowedValue: "ZZALLOWEDVALUEZZ",
};

const company: ProfileData = {
  name: "Sahel Fintech Solutions Limited",
  industry: "Financial Technology",
  size: "201+",
  country: "Nigeria",
  address: "12B Adeola Odeku Street, Victoria Island, Lagos, Nigeria",
  contactEmail: "support@sahelfintech.ng",
  contactPhone: "+234 1 270 1100",
  website: "https://sahelfintech.ng",
};

/** A requisition carrying every internal field we must never publish. */
function fullRequisition(): JobRequisition {
  return {
    id: SECRET.internalId,
    positionTitle: "Senior Backend Engineer",
    department: "Engineering",
    departmentId: "DEPT-ENG",
    hiringManager: SECRET.hiringManager,
    hiringManagerId: "NG-EMP-0018",
    employmentType: "full_time",
    status: "open",
    hiringPriority: "urgent",
    location: "Enugu",
    openings: 2,
    salaryMin: 8_200_000,
    salaryMax: 15_600_000,
    jobDescription: "We are looking for a talented Senior Backend Engineer.",
    requiredSkills: ["Go", "PostgreSQL"],
    targetStartDate: "2026-01-15",
    createdAt: "2025-10-28",
    requisitionNumber: "REQ-0001",
    approvalRequestId: SECRET.approvalId,
    workforceRequestId: SECRET.workforceId,
    sourceRequisitionId: SECRET.sourceReqId,
    qualifications: "A degree in a numerate subject, or equivalent experience.",
    expiryDate: "2026-02-28",
    autoCloseOnExpiry: true,
    applicationForm: [
      { id: "f1", type: "short_text", label: "Full name", required: true },
      {
        id: "f2",
        type: "dropdown",
        label: "Years of Go experience",
        required: true,
        options: ["0–2", "3–5", "6+"],
        constraints: { allowedValues: [SECRET.allowedValue] },
      },
    ],
    filterConstraints: [
      {
        id: "fc1",
        name: SECRET.filterName,
        match: "all",
        conditions: [{ fieldId: SECRET.gateFieldId, operator: "eq", value: "6+" }],
      },
    ],
    flow: {
      stages: [
        {
          type: "applicants",
          enabled: true,
          gate: {
            manual: false,
            quiz: {
              questions: [
                {
                  id: "q1",
                  field: { id: "f2", type: "dropdown", label: "Q", required: true },
                  correctAnswers: [SECRET.quizAnswer],
                  points: 1,
                },
              ],
              passThreshold: 1,
              onFail: "reject",
            },
          },
        },
      ],
    },
    advert: {
      workMode: "hybrid",
      locations: [
        { city: "Enugu", region: "Enugu State", postalCode: "400001", country: "Nigeria" },
      ],
      salaryCurrency: "NGN",
      payPeriod: "year",
      publishSalary: true,
      apply: { mode: "external_url", url: "https://sahelfintech.ng/careers/be-eng" },
      responsibilities: "Design and run our payments services.",
      benefits: "Pension, private health cover, 25 days' leave.",
      experienceLevel: "mid_senior",
      minYearsExperience: 5,
      educationLevel: "bachelor",
      jobFunction: "Engineering",
      industry: "Financial Technology",
      visaSponsorship: false,
      workingHours: "40 hours/week, Mon–Fri",
      eeoStatement: "We are an equal-opportunity employer.",
    },
  };
}

/** Everything a given export format would put in front of the public. */
function everyExportedString(requisition: JobRequisition): string {
  const withQuestions = buildAdvertDoc(requisition, company, {
    includeQuestions: true,
  });
  const withoutQuestions = buildAdvertDoc(requisition, company);
  return [
    JSON.stringify(withQuestions),
    JSON.stringify(withoutQuestions),
    JSON.stringify(toJobPostingJsonLd(withQuestions)),
    JSON.stringify(toDocSections(withQuestions)),
    toPlainText(withQuestions),
  ].join("\n");
}

describe("the internal/external boundary", () => {
  it("never leaks an internal field into any export format", () => {
    const exported = everyExportedString(fullRequisition());
    for (const [field, sentinel] of Object.entries(SECRET)) {
      expect(exported, `${field} leaked into an export`).not.toContain(sentinel);
    }
  });

  it("does not expose the pipeline configuration", () => {
    const doc = buildAdvertDoc(fullRequisition(), company, { includeQuestions: true });
    expect(doc).not.toHaveProperty("flow");
    expect(doc).not.toHaveProperty("filterConstraints");
    expect(doc).not.toHaveProperty("hiringManager");
    expect(doc).not.toHaveProperty("hiringPriority");
    expect(doc).not.toHaveProperty("status");
  });

  it("publishes question labels but never their answer keys or gate values", () => {
    const doc = buildAdvertDoc(fullRequisition(), company, { includeQuestions: true });
    expect(doc.questions.map((q) => q.label)).toEqual([
      "Full name",
      "Years of Go experience",
    ]);
    // Options are fine — an applicant sees them. `constraints.allowedValues` is
    // what the gate filters on, so publishing it would hand over the answer.
    expect(doc.questions[1].options).toEqual(["0–2", "3–5", "6+"]);
    expect(JSON.stringify(doc.questions)).not.toContain(SECRET.allowedValue);
  });

  it("omits questions entirely unless asked for them", () => {
    expect(buildAdvertDoc(fullRequisition(), company).questions).toEqual([]);
  });
});

describe("salary visibility", () => {
  it("publishes the band when publishSalary is set", () => {
    const doc = buildAdvertDoc(fullRequisition(), company);
    expect(doc.salary).toEqual({
      min: 8_200_000,
      max: 15_600_000,
      currency: "NGN",
      period: "year",
    });
    expect(toJobPostingJsonLd(doc)).toHaveProperty("baseSalary");
  });

  it("hides the band everywhere when publishSalary is false", () => {
    const req = fullRequisition();
    req.advert!.publishSalary = false;
    const doc = buildAdvertDoc(req, company);

    expect(doc.salary).toBeNull();
    expect(toJobPostingJsonLd(doc)).not.toHaveProperty("baseSalary");
    const text = [toPlainText(doc), JSON.stringify(toDocSections(doc))].join("\n");
    expect(text).not.toContain("8,200,000");
    expect(text).not.toContain("8200000");
  });

  it("treats a missing advert as salary-hidden rather than salary-shown", () => {
    // The dangerous default. A requisition predating §7.19 has no `advert`, so
    // `publishSalary` is undefined — which must not read as consent to publish.
    const req = fullRequisition();
    delete req.advert;
    expect(buildAdvertDoc(req, company).salary).toBeNull();
  });
});

describe("schema.org JobPosting", () => {
  it("emits the keys Google for Jobs requires", () => {
    const json = toJobPostingJsonLd(buildAdvertDoc(fullRequisition(), company));

    expect(json["@context"]).toBe("https://schema.org/");
    expect(json["@type"]).toBe("JobPosting");
    expect(json.title).toBe("Senior Backend Engineer");
    expect(json.datePosted).toBe("2025-10-28");
    expect(json.validThrough).toBe("2026-02-28");
    expect(json.employmentType).toBe("FULL_TIME");
    expect(json.description).toContain("Senior Backend Engineer");
    expect(json.hiringOrganization).toMatchObject({
      "@type": "Organization",
      name: company.name,
      sameAs: company.website,
    });
    expect(json.jobLocation).toMatchObject({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Enugu",
        addressRegion: "Enugu State",
        addressCountry: "Nigeria",
      },
    });
  });

  it("marks a remote role as TELECOMMUTE with a location requirement", () => {
    const req = fullRequisition();
    req.advert!.workMode = "remote";
    const json = toJobPostingJsonLd(buildAdvertDoc(req, company));

    expect(json.jobLocationType).toBe("TELECOMMUTE");
    expect(json.applicantLocationRequirements).toEqual({
      "@type": "Country",
      name: "Nigeria",
    });
  });

  it("leaves hybrid roles without a TELECOMMUTE flag", () => {
    const json = toJobPostingJsonLd(buildAdvertDoc(fullRequisition(), company));
    expect(json).not.toHaveProperty("jobLocationType");
  });

  it("only claims directApply when the application stays on our own site", () => {
    const external = toJobPostingJsonLd(buildAdvertDoc(fullRequisition(), company));
    expect(external.directApply).toBe(false);

    const req = fullRequisition();
    req.advert!.apply = { mode: "internal" };
    expect(toJobPostingJsonLd(buildAdvertDoc(req, company)).directApply).toBe(true);
  });

  it("converts years of experience to the months schema.org expects", () => {
    const json = toJobPostingJsonLd(buildAdvertDoc(fullRequisition(), company));
    expect(json.experienceRequirements).toMatchObject({ monthsOfExperience: 60 });
  });

  it("escapes HTML in the description rather than passing it through", () => {
    const req = fullRequisition();
    req.jobDescription = "Work on <script>alert(1)</script> systems & more";
    const json = toJobPostingJsonLd(buildAdvertDoc(req, company));
    expect(json.description).not.toContain("<script>");
    expect(json.description).toContain("&lt;script&gt;");
    expect(json.description).toContain("&amp;");
  });
});

describe("degrading without an advert", () => {
  it("still produces a usable document from the base requisition", () => {
    const req = fullRequisition();
    delete req.advert;
    const doc = buildAdvertDoc(req, company);

    expect(doc.title).toBe("Senior Backend Engineer");
    expect(doc.description).toContain("Senior Backend Engineer");
    // The free-text location is parsed into something structured rather than
    // dropped, so the export is not location-less.
    expect(doc.locations).toEqual([
      { city: "Enugu", country: "Nigeria", region: undefined },
    ]);
    expect(() => toPlainText(doc)).not.toThrow();
    expect(() => toJobPostingJsonLd(doc)).not.toThrow();
  });

  it("reads employmentType 'remote' as a work mode when none is set", () => {
    const req = fullRequisition();
    delete req.advert;
    req.employmentType = "remote";
    expect(buildAdvertDoc(req, company).workMode).toBe("remote");
  });
});

describe("board-readiness warnings", () => {
  it("passes a fully-populated advert", () => {
    const blocking = advertWarnings(fullRequisition()).filter(
      (w) => w.severity === "blocking",
    );
    expect(blocking).toEqual([]);
  });

  it("flags the fields boards reject a posting for", () => {
    const req = fullRequisition();
    delete req.advert;
    const fields = advertWarnings(req)
      .filter((w) => w.severity === "blocking")
      .map((w) => w.field);

    expect(fields).toContain("Work mode");
    expect(fields).toContain("Location");
    expect(fields).toContain("How to apply");
  });

  it("does not block a remote role on a missing physical address", () => {
    const req = fullRequisition();
    req.advert!.workMode = "remote";
    req.advert!.locations = [];
    const location = advertWarnings(req).find((w) => w.field === "Location");
    expect(location?.severity).toBe("advisory");
  });

  it("catches an apply method selected but left blank", () => {
    const req = fullRequisition();
    req.advert!.apply = { mode: "external_url", url: "" };
    const fields = advertWarnings(req).map((w) => w.field);
    expect(fields).toContain("Apply link");
  });
});
