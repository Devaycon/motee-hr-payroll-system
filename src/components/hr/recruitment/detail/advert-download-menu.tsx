"use client";

import { ClipboardCopy, Code2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useCompanyProfile } from "@/src/components/hr/company-profile/hooks";
import {
  advertStrapline,
  advertWarnings,
  buildAdvertDoc,
  toDocSections,
  toJobPostingJsonLd,
  toPlainText,
} from "@/src/lib/recruitment/job-advert";
import { printDocument } from "@/src/lib/reports/print-document";
import type { JobRequisition } from "@/src/lib/types/recruitment";

/**
 * §7.19 — get the advert out of the system and onto a job board.
 *
 * Three formats because boards want three different things: a PDF to read and
 * circulate, plain text for LinkedIn's and Indeed's description boxes (both
 * strip rich formatting), and schema.org JSON-LD for a careers page so Google
 * for Jobs will index it.
 *
 * All three are built from `buildAdvertDoc`, which whitelists the publishable
 * fields — the pipeline metrics, hiring manager, priority and stage gates shown
 * elsewhere on this card are structurally unable to reach any of them.
 */
export function AdvertDownloadMenu({
  requisition,
}: {
  requisition: JobRequisition;
}) {
  const { data: company } = useCompanyProfile();

  function docFor(includeQuestions: boolean) {
    return buildAdvertDoc(requisition, company ?? null, { includeQuestions });
  }

  /**
   * Boards reject postings missing required fields, so say so — but still
   * produce the file, since HR may be filling the gap on the board itself.
   */
  function warnIfIncomplete() {
    const warnings = advertWarnings(requisition);
    const blocking = warnings.filter((w) => w.severity === "blocking");
    if (blocking.length === 0) return;
    toast.warning(
      `${blocking.length} field${blocking.length === 1 ? "" : "s"} missing for job boards`,
      {
        description: `${blocking.map((w) => w.field).join(", ")} — edit the requisition's Job advert step to add them.`,
      },
    );
  }

  function handlePdf() {
    const doc = docFor(true);
    const opened = printDocument({
      title: doc.title,
      subtitle: doc.company.name || undefined,
      strapline: advertStrapline(doc) || undefined,
      sections: toDocSections(doc),
      reference: doc.reference ?? undefined,
    });
    if (!opened) {
      toast.error("Couldn't open the print window", {
        description: "Allow pop-ups for this site, then try again.",
      });
      return;
    }
    toast.success("Job advert ready to save as PDF", {
      description: "Choose “Save as PDF” as the destination in the print dialog.",
    });
    warnIfIncomplete();
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied to clipboard`);
      warnIfIncomplete();
    } catch {
      toast.error(`Couldn't copy the ${what.toLowerCase()}`, {
        description: "Your browser blocked clipboard access.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Job-board ready — internal pipeline data is excluded
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={handlePdf}>
          <FileText className="h-3.5 w-3.5" />
          Download job advert (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => copy(toPlainText(docFor(true)), "Advert text")}
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
          Copy advert text
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() =>
            copy(
              JSON.stringify(toJobPostingJsonLd(docFor(false)), null, 2),
              "Google Jobs JSON-LD",
            )
          }
        >
          <Code2 className="h-3.5 w-3.5" />
          Copy Google Jobs JSON-LD
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
