/**
 * What each document is *for* — the explanation the detail view shows so an
 * employee looking at "Right to Work Share Code" knows why HR holds it and what
 * happens if it lapses.
 *
 * This is reference knowledge about document types, not per-record data, so it
 * lives in code rather than the fixtures: every tenant's "P60" means the same
 * thing.
 */

export interface DocumentPurpose {
  /** One line on what the document is. */
  what: string;
  /** Why the organisation holds it / what it unlocks. */
  why: string;
  /** What happens if it's missing, rejected or expired. */
  consequence?: string;
}

/** Per-category fallback — always defined, so lookups can't come back empty. */
export const DOCUMENT_CATEGORY_PURPOSE: Record<string, DocumentPurpose> = {
  identity: {
    what: "Government-issued proof of who you are.",
    why: "Confirms your identity for payroll, background checks and access to systems.",
    consequence: "Without a valid ID on file, onboarding and payroll set-up can't be completed.",
  },
  right_to_work: {
    what: "Evidence that you are legally permitted to work in this country.",
    why: "Employers are legally required to check and retain this before employment starts.",
    consequence:
      "An expired or rejected right-to-work document must be replaced immediately — employment cannot lawfully continue without one.",
  },
  proof_of_address: {
    what: "A recent document showing your current residential address.",
    why: "Used to verify your address for payroll, correspondence and compliance checks.",
    consequence: "Usually must be dated within the last three months to be accepted.",
  },
  tax: {
    what: "Tax paperwork issued by you or the tax authority.",
    why: "Determines the tax code applied to your pay, so you're not over- or under-taxed.",
    consequence: "Missing tax paperwork can put you on an emergency tax code.",
  },
  banking: {
    what: "Confirmation of the bank account your salary is paid into.",
    why: "Payroll uses it to verify account details before releasing payment.",
    consequence: "Payment may be delayed until the account is confirmed.",
  },
  pension: {
    what: "Pension scheme enrolment and nomination paperwork.",
    why: "Records your scheme membership, contribution level and beneficiaries.",
  },
  education: {
    what: "Certificates evidencing a qualification or professional membership.",
    why: "Supports the requirements of your role and any regulated duties.",
    consequence: "Some roles cannot be performed until the qualification is verified.",
  },
  employment: {
    what: "Contractual paperwork between you and the organisation.",
    why: "Sets out your terms, obligations and anything you've formally agreed to.",
  },
  medical: {
    what: "Health-related evidence such as a fit note or occupational health report.",
    why: "Supports absence records and any workplace adjustments you're entitled to.",
    consequence: "Absence over the self-certification limit needs supporting evidence.",
  },
  reference: {
    what: "A statement from a previous employer or referee.",
    why: "Corroborates your employment history before or shortly after you start.",
  },
  photo: {
    what: "A photograph used for your profile and any physical pass.",
    why: "Identifies you across the directory, access control and internal systems.",
  },
  dbs: {
    what: "A criminal-records or background screening certificate.",
    why: "Confirms suitability for roles involving trust, finance or vulnerable people.",
    consequence:
      "Regulated duties may be suspended until a current certificate is on file.",
  },
};

const GENERIC: DocumentPurpose = {
  what: "A document held on your employee record.",
  why: "Retained by HR as part of your employment file.",
};

/**
 * More specific overrides, matched against the document name. First hit wins,
 * so order from most to least specific.
 */
const NAME_OVERRIDES: Array<[RegExp, DocumentPurpose]> = [
  [
    /share\s*code/i,
    {
      what: "A Home Office share code proving your right to work.",
      why: "Lets the employer check your status online rather than holding a copy of your visa.",
      consequence: "Share codes expire — a new one is needed at each scheduled recheck.",
    },
  ],
  [
    /biometric residence|brp/i,
    {
      what: "A Biometric Residence Permit showing your immigration status.",
      why: "Evidences your permission to stay and work, and any conditions attached to it.",
      consequence: "Work authorisation ends when the permit expires unless it's renewed.",
    },
  ],
  [
    /\bp45\b/i,
    {
      what: "The statement of pay and tax from your previous employer.",
      why: "Carries your tax code across so your first payslip here is taxed correctly.",
      consequence: "Without it you may start on an emergency tax code and overpay initially.",
    },
  ],
  [
    /\bp60\b/i,
    {
      what: "A year-end summary of your pay and the tax deducted.",
      why: "Your official record of earnings for a tax year — needed for tax returns, mortgages and loan applications.",
    },
  ],
  [
    /starter checklist|p46/i,
    {
      what: "The new-starter declaration used when there's no P45.",
      why: "Tells payroll which tax code to apply from your first payment.",
    },
  ],
  [
    /national insurance/i,
    {
      what: "Proof of your National Insurance number.",
      why: "Links your earnings and contributions to your NI record and state entitlements.",
    },
  ],
  [
    /passport/i,
    {
      what: "Your international passport.",
      why: "The strongest single proof of identity and, for some nationalities, right to work.",
      consequence: "An expired passport can no longer be relied on as evidence.",
    },
  ],
  [
    /driv(er|ing) licence|driver's licen[cs]e/i,
    {
      what: "Your photocard driving licence.",
      why: "Proves identity, and entitlement to drive where the role requires it.",
      consequence: "Roles involving driving need a current, valid licence.",
    },
  ],
  [
    /utility bill|bank statement/i,
    {
      what: "A recent bill or statement showing your name and address.",
      why: "Independent confirmation of where you live.",
      consequence: "Must normally be dated within the last three months.",
    },
  ],
  [
    /dbs certificate/i,
    {
      what: "Your Disclosure and Barring Service certificate.",
      why: "Discloses relevant criminal record information for roles requiring clearance.",
      consequence: "Certificates are point-in-time — most employers recheck periodically.",
    },
  ],
  [
    /contract/i,
    {
      what: "Your signed contract of employment.",
      why: "The binding statement of your role, pay, hours and notice period.",
    },
  ],
  [
    /offer letter/i,
    {
      what: "The written offer you accepted.",
      why: "Records the terms agreed at the point of hire.",
    },
  ],
  [
    /non-disclosure|nda/i,
    {
      what: "A confidentiality agreement.",
      why: "Sets out what company and client information you must not share.",
    },
  ],
  [
    /degree certificate/i,
    {
      what: "Evidence of your awarded degree.",
      why: "Verifies the academic qualification your role was offered against.",
    },
  ],
  [
    /bank details/i,
    {
      what: "Written confirmation of your salary account.",
      why: "Checked against payroll before any payment is released, to prevent misdirected pay.",
      consequence: "Changes are re-verified — this is the most common target for payroll fraud.",
    },
  ],
];

/** The purpose text for a document, by name first, then category. */
export function documentPurpose(
  name?: string | null,
  category?: string | null,
): DocumentPurpose {
  if (name) {
    for (const [pattern, purpose] of NAME_OVERRIDES) {
      if (pattern.test(name)) return purpose;
    }
  }
  return (category && DOCUMENT_CATEGORY_PURPOSE[category]) || GENERIC;
}

/**
 * What a document status means for the employee — the "so what" the client
 * asked for next to a bare "Rejected" pill.
 */
export const DOCUMENT_STATUS_MEANING: Record<string, string> = {
  verified:
    "Checked by HR and accepted. No further action is needed unless it expires.",
  pending:
    "Uploaded and waiting for HR to review it. You don't need to do anything yet.",
  rejected:
    "HR reviewed this and could not accept it. A replacement needs to be uploaded.",
  expired:
    "This document has passed its expiry date and is no longer valid evidence. Upload a current version.",
};
