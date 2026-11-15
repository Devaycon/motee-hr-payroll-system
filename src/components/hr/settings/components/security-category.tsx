"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { TwoFactorPanel } from "./two-factor-panel";
import { SecurityPanel } from "./security-panel";
import type { SecuritySettings } from "../types";
import { TWO_FACTOR_CONFIG, securitySettingsFor } from "../data";
import { useAppSelector } from "@/src/lib/stores/hooks";

export function SecurityCategory() {
  const country = useAppSelector((s) => s.locale.country);
  const [security, setSecurity] = useState<SecuritySettings>(() => securitySettingsFor(country));

  return (
    <Tabs defaultValue="2fa">
      <PageTabsList
        tabs={[
          { value: "2fa", label: "Two Factor Authentication" },
          { value: "access", label: "Password & Access" },
        ]}
      />

      <TabsContent value="2fa" className="mt-6">
        <TwoFactorPanel config={TWO_FACTOR_CONFIG} />
      </TabsContent>

      <TabsContent value="access" className="mt-6">
        <SecurityPanel security={security} onChange={setSecurity} />
      </TabsContent>
    </Tabs>
  );
}
