"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Printer } from "lucide-react";
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from "../data";
import type { Contract } from "../types";

interface ContractLetterModalProps {
  open: boolean;
  contract: Contract | null;
  hrSignature?: string;
  onClose: () => void;
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatSalary(amount?: number, currency?: string) {
  if (!amount) return "—";
  if (currency === "NGN") return `₦${amount.toLocaleString("en-NG")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export function ContractLetterModal({
  open,
  contract,
  hrSignature,
  onClose,
}: ContractLetterModalProps) {
  if (!contract) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function handlePrint() {
    const rows = [
      ["Contract ID", contract!.id],
      ["Contract Type", CONTRACT_TYPE_LABELS[contract!.contractType]],
      ["Status", CONTRACT_STATUS_LABELS[contract!.status]],
      ["Start Date", formatDate(contract!.startDate)],
      [
        "End Date",
        contract!.endDate ? formatDate(contract!.endDate) : "Open-Ended",
      ],
      [
        "Salary / Rate",
        formatSalary(contract!.salary, contract!.contractCurrency),
      ],
      ["Notice Period", `${contract!.noticePeriodDays} days`],
      ["Auto-Renew", contract!.autoRenew ? "Yes" : "No"],
    ];

    const detailRows = rows
      .map(
        ([label, value]) =>
          `<tr><td style="background:#f9f9f9;font-weight:bold;padding:7px 14px;border:1px solid #ddd;width:40%;">${label}</td><td style="padding:7px 14px;border:1px solid #ddd;">${value}</td></tr>`,
      )
      .join("");

    const descriptionBlock = contract!.description
      ? `<div style="margin-bottom:24px;">
          <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;color:#333;">Terms &amp; Description</p>
          <p style="font-size:12.5px;line-height:1.8;white-space:pre-wrap;color:#333;">${contract!.description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>`
      : "";

    const hrSigBlock = hrSignature
      ? hrSignature.startsWith("data:image")
        ? `<img src="${hrSignature}" style="height:48px;object-fit:contain;object-position:left;display:block;margin-bottom:8px;" alt="HR Signature" />`
        : `<p style="font-style:italic;font-family:Georgia,serif;font-size:22px;color:#222;border-bottom:1px solid #333;padding-bottom:4px;margin-bottom:8px;">${hrSignature}</p>`
      : `<div style="border-bottom:1px solid #333;min-height:36px;margin-bottom:8px;"></div>`;

    const hrNameLabel =
      hrSignature && !hrSignature.startsWith("data:image")
        ? hrSignature
        : "_________________________";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${contract!.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #111; background: #fff; padding: 60px 80px; font-size: 13px; line-height: 1.7; }
    @media print { body { padding: 40px 60px; } }
  </style>
</head>
<body>
  <div style="text-align:center;border-bottom:2px solid #111;padding-bottom:20px;margin-bottom:28px;">
    <p style="font-size:18px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">Motee Payroll Inc.</p>
    <p style="font-size:11px;color:#555;margin-top:4px;">HR &amp; Payroll Management Platform &middot; Lagos, Nigeria</p>
  </div>
  <div style="text-align:center;margin-bottom:24px;">
    <p style="font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;">Contract Agreement</p>
  </div>
  <p style="font-size:12px;color:#555;margin-bottom:24px;">Date: ${formatDate(contract!.startDate)}</p>
  <div style="margin-bottom:24px;">
    <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;color:#333;">Parties</p>
    <div style="font-size:12.5px;line-height:2;">
      <div style="display:flex;gap:12px;"><span style="font-weight:bold;min-width:130px;">Employer:</span><span>Motee Payroll Inc.</span></div>
      <div style="display:flex;gap:12px;"><span style="font-weight:bold;min-width:130px;">Party / Employee:</span><span>${contract!.employeeName}</span></div>
      <div style="display:flex;gap:12px;"><span style="font-weight:bold;min-width:130px;">Department:</span><span>${contract!.department}</span></div>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:10px;color:#333;">Contract Details</p>
    <table style="width:100%;border-collapse:collapse;font-size:12.5px;">${detailRows}</table>
  </div>
  ${descriptionBlock}
  <div style="margin-top:36px;">
    <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:20px;color:#333;">Signatures</p>
    <div style="display:flex;gap:48px;">
      <div style="flex:1;">
        <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">HR Manager</p>
        ${hrSigBlock}
        <p style="font-size:10px;color:#555;margin-bottom:4px;">Name: ${hrNameLabel}</p>
        <p style="font-size:10px;color:#555;">Date: _________________________</p>
      </div>
      <div style="flex:1;">
        <p style="font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Employee / Party</p>
        <div style="border-bottom:1px solid #333;min-height:36px;margin-bottom:8px;"></div>
        <p style="font-size:10px;color:#555;margin-bottom:4px;">Name: ${contract!.employeeName}</p>
        <p style="font-size:10px;color:#555;">Date: _________________________</p>
      </div>
    </div>
  </div>
  <div style="border-top:1px solid #ddd;margin-top:48px;padding-top:12px;text-align:center;">
    <p style="font-size:9px;color:#aaa;">This document was generated by Motee HR &amp; Payroll System &middot; ${today}</p>
  </div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 400);
  }

  const detailRows: [string, string][] = [
    ["Contract ID", contract.id],
    ["Contract Type", CONTRACT_TYPE_LABELS[contract.contractType]],
    ["Status", CONTRACT_STATUS_LABELS[contract.status]],
    ["Start Date", formatDate(contract.startDate)],
    [
      "End Date",
      contract.endDate ? formatDate(contract.endDate) : "Open-Ended",
    ],
    ["Salary / Rate", formatSalary(contract.salary, contract.contractCurrency)],
    ["Notice Period", `${contract.noticePeriodDays} days`],
    ["Auto-Renew", contract.autoRenew ? "Yes" : "No"],
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Contract Letter Preview</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="mx-auto max-w-2xl space-y-6 bg-white px-10 py-8 text-[#111] shadow-sm ring-1 ring-black/10 dark:text-[#111]">
            <div className="border-b-2 border-[#111] pb-5 text-center">
              <p className="text-lg font-bold uppercase tracking-widest">
                Motee Payroll Inc.
              </p>
              <p className="mt-1 text-[11px] text-[#555]">
                HR & Payroll Management Platform · Lagos, Nigeria
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.25em]">
                Contract Agreement
              </p>
            </div>

            <p className="text-xs text-[#555]">
              Date: {formatDate(contract.startDate)}
            </p>

            <div>
              <p className="mb-2.5 border-b border-[#ddd] pb-1 text-[10px] font-bold uppercase tracking-widest text-[#333]">
                Parties
              </p>
              <div className="space-y-1 text-xs leading-loose">
                <div className="flex gap-3">
                  <span className="min-w-32 font-bold">Employer:</span>
                  <span>Motee Payroll Inc.</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-32 font-bold">Party / Employee:</span>
                  <span>{contract.employeeName}</span>
                </div>
                <div className="flex gap-3">
                  <span className="min-w-32 font-bold">Department:</span>
                  <span>{contract.department}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2.5 border-b border-[#ddd] pb-1 text-[10px] font-bold uppercase tracking-widest text-[#333]">
                Contract Details
              </p>
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {detailRows.map(([label, value]) => (
                    <tr key={label} className="border border-[#ddd]">
                      <td className="w-[40%] bg-[#f9f9f9] px-3 py-1.5 font-bold">
                        {label}
                      </td>
                      <td className="px-3 py-1.5">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {contract.description && (
              <div>
                <p className="mb-2.5 border-b border-[#ddd] pb-1 text-[10px] font-bold uppercase tracking-widest text-[#333]">
                  Terms & Description
                </p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#333]">
                  {contract.description}
                </p>
              </div>
            )}

            <div>
              <p className="mb-4 border-b border-[#ddd] pb-1 text-[10px] font-bold uppercase tracking-widest text-[#333]">
                Signatures
              </p>
              <div className="flex gap-10">
                <div className="flex-1">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#333]">
                    HR Manager
                  </p>
                  <div className="min-h-9 border-b border-[#333] pb-1">
                    {hrSignature &&
                      (hrSignature.startsWith("data:image") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={hrSignature}
                          alt="HR Signature"
                          className="h-9 object-contain object-left"
                        />
                      ) : (
                        <p className="font-serif text-xl italic text-[#222]">
                          {hrSignature}
                        </p>
                      ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#555]">
                    Name:{" "}
                    {hrSignature && !hrSignature.startsWith("data:image")
                      ? hrSignature
                      : "_________________________"}
                  </p>
                  <p className="mt-1 text-[10px] text-[#555]">
                    Date: _________________________
                  </p>
                </div>

                <div className="flex-1">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#333]">
                    Employee / Party
                  </p>
                  <div className="min-h-9 border-b border-[#333]" />
                  <p className="mt-1.5 text-[10px] text-[#555]">
                    Name: {contract.employeeName}
                  </p>
                  <p className="mt-1 text-[10px] text-[#555]">
                    Date: _________________________
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#ddd] pt-3 text-center">
              <p className="text-[9px] text-[#aaa]">
                This document was generated by Motee HR & Payroll System ·{" "}
                {today}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 size-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
