import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Complete your onboarding — Motee",
  description: "",
};

const EmployeeOnboardingWizard = dynamic(() =>
  import("@/src/components/onboarding/employee-wizard").then(
    (m) => m.EmployeeOnboardingWizard,
  ),
);

export default async function JoinOnboardingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { recordId } = await params;
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  return (
    <EmployeeOnboardingWizard
      recordId={recordId}
      prefill={{
        name: str(sp.name),
        email: str(sp.email),
        jobTitle: str(sp.jobTitle),
        department: str(sp.department),
        startDate: str(sp.startDate),
      }}
    />
  );
}
