/** Build a `mailto:` URL with optional recipients, subject and body. */
export function buildMailto(opts: {
  to?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}): string {
  const to = (opts.to ?? []).filter(Boolean).join(",");
  const params = new URLSearchParams();
  if (opts.bcc?.length) params.set("bcc", opts.bcc.filter(Boolean).join(","));
  if (opts.subject) params.set("subject", opts.subject);
  if (opts.body) params.set("body", opts.body);
  const qs = params.toString();
  // URLSearchParams encodes spaces as "+"; mail clients expect %20 in the body.
  return `mailto:${to}${qs ? `?${qs.replace(/\+/g, "%20")}` : ""}`;
}

/** Open the user's mail client for the given recipients. */
export function openMailto(opts: {
  to?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}): void {
  if (typeof window !== "undefined") {
    window.location.href = buildMailto(opts);
  }
}
