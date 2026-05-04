import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Suggestions",
};

const SuggestionsPage = dynamic(() =>
  import("@/src/components/hr/suggestions").then((m) => ({
    default: m.SuggestionsPage,
  })),
);

export default function Page() {
  return <SuggestionsPage />;
}
