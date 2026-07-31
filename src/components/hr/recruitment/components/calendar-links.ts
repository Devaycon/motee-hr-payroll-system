import type { Interview } from "@/src/lib/types/recruitment";

function toIcsStamp(iso: string): string {
  // 2026-06-01T10:00 -> 20260601T100000
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function endIso(startIso: string, durationMins: number): string {
  const d = new Date(startIso);
  d.setMinutes(d.getMinutes() + durationMins);
  return d.toISOString();
}

export function interviewTitle(iv: Interview): string {
  return `${iv.round} — ${iv.candidateName}`;
}

/** Build an .ics file as a data URL for download. */
export function icsDataUrl(iv: Interview): string {
  const start = toIcsStamp(iv.scheduledAt);
  const end = toIcsStamp(endIso(iv.scheduledAt, iv.durationMins));
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Motee HR//Recruitment//EN",
    "BEGIN:VEVENT",
    `UID:${iv.id}@motee`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${interviewTitle(iv)}`,
    `LOCATION:${iv.location ?? iv.mode}`,
    `DESCRIPTION:Interview (${iv.mode}) with panel of ${iv.panel.length}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf8,${encodeURIComponent(body)}`;
}

/** Google Calendar "add event" deep link. */
export function googleCalUrl(iv: Interview): string {
  const dates = `${toIcsStamp(iv.scheduledAt)}/${toIcsStamp(endIso(iv.scheduledAt, iv.durationMins))}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: interviewTitle(iv),
    dates,
    details: `Interview (${iv.mode})`,
    location: iv.location ?? iv.mode,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook web "compose event" deep link. */
export function outlookCalUrl(iv: Interview): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: interviewTitle(iv),
    startdt: iv.scheduledAt,
    enddt: endIso(iv.scheduledAt, iv.durationMins),
    location: iv.location ?? iv.mode,
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Teams meeting scheduling deep link (compose). */
export function teamsUrl(iv: Interview): string {
  const params = new URLSearchParams({
    subject: interviewTitle(iv),
  });
  return `https://teams.microsoft.com/l/meeting/new?${params.toString()}`;
}

export { downloadFile } from "@/src/lib/download";
