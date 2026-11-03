import { Suspense } from "react";
import { RiskRegisterPage } from "@/src/components/hr/workforce-risk/register-page";

export const metadata = { title: "Workforce Risks & Actions" };

export default function WorkforceRiskRegisterRoute() {
  // useSearchParams (kind/branch deep links) needs a Suspense boundary.
  return (
    <Suspense>
      <RiskRegisterPage />
    </Suspense>
  );
}
