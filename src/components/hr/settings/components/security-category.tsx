"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { TwoFactorPanel } from "./two-factor-panel";
import { SecurityPanel } from "./security-panel";
import type { SecuritySettings } from "../types";
import { TWO_FACTOR_CONFIG, SECURITY_SETTINGS } from "../data";

export function SecurityCategory() {
  const [security, setSecurity] = useState<SecuritySettings>(SECURITY_SETTINGS);

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
