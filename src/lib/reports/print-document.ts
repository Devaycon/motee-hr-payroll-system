/**
 * Document-shaped print-to-PDF, the sibling of `printPdf` in ./export.
 *
 * `printPdf` renders a report: stat chips above a table. That shape is wrong
 * for prose — a job advert is headings, paragraphs, definition pairs and
 * bullet lists — so this renders a document instead. The mechanism is
 * deliberately identical (open a window, write a self-contained HTML doc with
 * an inline stylesheet, print after a beat) so there is one way print output
 * works in this codebase and no new dependency to carry.
 */

import { esc } from "./export";

export type DocSection =
  /** A titled block of prose; blank lines become paragraphs. */
  | { kind: "prose"; heading?: string; body: string }
  /** Label/value pairs laid out in a two-column grid. */
  | { kind: "facts"; heading?: string; items: Array<{ label: string; value: string }> }
  /** A bulleted list. */
  | { kind: "list"; heading?: string; items: string[] }
  /** Inline pills, for things like skills. */
  | { kind: "tags"; heading?: string; items: string[] }
  /** Small print, set apart at the foot of the document. */
  | { kind: "note"; body: string };

export interface PrintDocumentOptions {
  title: string;
  /** Sits directly under the title, e.g. the employer name. */
  subtitle?: string;
  /** One-line summary of the key facts, e.g. "Leeds · Hybrid · Full-time". */
  strapline?: string;
  sections: DocSection[];
  /** Printed in the footer alongside the generation date. */
  reference?: string;
}

function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function heading(text: string | undefined): string {
  return text ? `<h2>${esc(text)}</h2>` : "";
}

function renderSection(s: DocSection): string {
  switch (s.kind) {
    case "prose":
      return `<section>${heading(s.heading)}${paragraphs(s.body)}</section>`;
    case "facts":
      if (s.items.length === 0) return "";
      return `<section>${heading(s.heading)}<dl>${s.items
        .map(
          (i) =>
            `<div class="fact"><dt>${esc(i.label)}</dt><dd>${esc(i.value)}</dd></div>`,
        )
        .join("")}</dl></section>`;
    case "list":
      if (s.items.length === 0) return "";
      return `<section>${heading(s.heading)}<ul>${s.items
        .map((i) => `<li>${esc(i)}</li>`)
        .join("")}</ul></section>`;
    case "tags":
      if (s.items.length === 0) return "";
      return `<section>${heading(s.heading)}<div class="tags">${s.items
        .map((i) => `<span class="tag">${esc(i)}</span>`)
        .join("")}</div></section>`;
    case "note":
      return `<section class="note">${paragraphs(s.body)}</section>`;
  }
}

/** Open a styled print window for a prose document and trigger print-to-PDF. */
export function printDocument(opts: PrintDocumentOptions): boolean {
  if (typeof window === "undefined") return false;
  const w = window.open("", "_blank", "width=1024,height=768");
  // Pop-up blockers are the usual cause; the caller surfaces this to the user.
  if (!w) return false;

  const body = opts.sections.map(renderSection).join("");
  const footer = [
    opts.reference ? `Reference ${esc(opts.reference)}` : null,
    `Generated ${new Date().toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>${esc(opts.title)}</title>
<style>
  *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}
  body{margin:40px auto;max-width:760px;color:#0f172a;line-height:1.55;}
  h1{font-size:26px;margin:0 0 4px;line-height:1.2;}
  .subtitle{font-size:15px;color:#334155;margin:0 0 2px;}
  .strapline{font-size:13px;color:#64748b;margin:0;}
  hr{border:0;border-top:1px solid #e2e8f0;margin:20px 0;}
  section{margin-bottom:22px;}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#475569;
     margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;}
  p{margin:0 0 10px;font-size:14px;}
  ul{margin:0;padding-left:20px;font-size:14px;}
  li{margin-bottom:4px;}
  dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 24px;margin:0;}
  .fact dt{font-size:11px;color:#64748b;margin-bottom:1px;}
  .fact dd{margin:0;font-size:14px;}
  .tags{display:flex;flex-wrap:wrap;gap:6px;}
  .tag{border:1px solid #cbd5e1;border-radius:999px;padding:2px 10px;font-size:12px;}
  .note{font-size:12px;color:#64748b;border-left:3px solid #e2e8f0;padding-left:12px;}
  .note p{font-size:12px;}
  footer{margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0;
         font-size:11px;color:#94a3b8;}
  /* Keep a heading with the block it introduces when the page breaks. */
  section{break-inside:avoid-page;}
  h2{break-after:avoid-page;}
  @page{margin:18mm;}
</style></head><body>
  <h1>${esc(opts.title)}</h1>
  ${opts.subtitle ? `<p class="subtitle">${esc(opts.subtitle)}</p>` : ""}
  ${opts.strapline ? `<p class="strapline">${esc(opts.strapline)}</p>` : ""}
  <hr />
  ${body}
  <footer>${footer}</footer>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
</body></html>`);
  w.document.close();
  return true;
}
