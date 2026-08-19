import type { RecruitmentStageType } from "@/src/lib/types/recruitment";

/**
 * §7.20 — reusable candidate emails.
 *
 * Every message the module sent was a string literal hardcoded at the call
 * site, so the wording drifted between the stage table, the drawer and the
 * bulk actions, and nobody outside the codebase could change it. These are the
 * same messages, named, tokenised and in one place.
 */
export interface EmailTemplate {
  id: string;
  name: string;
  /** The stage this template is offered on first; null = offered everywhere. */
  stage: RecruitmentStageType | null;
  subject: string;
  body: string;
}

export interface TemplateVars {
  candidate?: string;
  role?: string;
  company?: string;
  date?: string;
  salary?: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-interview-invite",
    name: "Invite to interview",
    stage: "applicants",
    subject: "Interview invitation — {{role}}",
    body: "Hi {{candidate}},\n\nThank you for applying for the {{role}} role at {{company}}. We'd like to invite you to an interview.\n\nProposed time: {{date}}\n\nPlease reply to confirm your availability.\n\nBest regards,\n{{company}} Talent Team",
  },
  {
    id: "tpl-interview-confirm",
    name: "Confirm interview details",
    stage: "interview",
    subject: "Your interview is confirmed — {{role}}",
    body: "Hi {{candidate}},\n\nYour interview for the {{role}} role is confirmed for {{date}}. Joining details are below — please let us know if anything changes.\n\nWe look forward to speaking with you.\n\n{{company}} Talent Team",
  },
  {
    id: "tpl-offer",
    name: "Extend offer",
    stage: "offer",
    subject: "Offer — {{role}}",
    body: "Hi {{candidate}},\n\nWe're delighted to offer you the {{role}} role at {{company}}.\n\nSalary: {{salary}}\nStart date: {{date}}\n\nPlease reply to confirm whether you accept.\n\n{{company}} Talent Team",
  },
  {
    id: "tpl-offer-reminder",
    name: "Chase offer response",
    stage: "offer",
    subject: "Following up on your offer — {{role}}",
    body: "Hi {{candidate}},\n\nJust following up on the offer we sent for the {{role}} role. Do let us know if you have any questions — we're happy to talk it through.\n\n{{company}} Talent Team",
  },
  {
    id: "tpl-onboarding-invite",
    name: "Onboarding invite",
    stage: "hired",
    subject: "Welcome aboard — {{role}}",
    body: "Hi {{candidate}},\n\nCongratulations! We'd like to begin your onboarding for the {{role}} role, starting {{date}}. Please use the link in this email to get started.\n\nWelcome to {{company}}.",
  },
  {
    id: "tpl-keep-in-touch",
    name: "Keep in touch",
    stage: null,
    subject: "Keeping in touch — {{company}}",
    body: "Hi {{candidate}},\n\nThank you for interviewing for the {{role}} role. We aren't able to make you an offer this time, but we were impressed and would like to keep your details on file for future openings.\n\nWe'll be in touch when something suitable comes up.\n\n{{company}} Talent Team",
  },
  {
    id: "tpl-rejection",
    name: "Rejection",
    stage: null,
    subject: "Update on your application — {{role}}",
    body: "Hi {{candidate}},\n\nThank you for your interest in the {{role}} role at {{company}} and for the time you gave to the process. On this occasion we won't be taking your application further.\n\nWe wish you the very best with your search.\n\n{{company}} Talent Team",
  },
];

/** Fill `{{token}}` placeholders; unknown or missing tokens collapse to "—". */
export function renderTemplate(text: string, vars: TemplateVars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key as keyof TemplateVars];
    return value && value.trim() ? value : "—";
  });
}

/** Templates worth offering on a given stage, most relevant first. */
export function templatesForStage(stage: RecruitmentStageType): EmailTemplate[] {
  return [
    ...EMAIL_TEMPLATES.filter((t) => t.stage === stage),
    ...EMAIL_TEMPLATES.filter((t) => t.stage !== stage),
  ];
}
