import { Suspense } from "react";
import type { Metadata } from "next";
import { DocuSignPageContent } from "@/src/components/hr/documents/components/docu-sign-page";

export const metadata: Metadata = { title: "Sign Document" };

export default function SignPage() {
  return (
    <Suspense>
      <DocuSignPageContent />
    </Suspense>
  );
}
