"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { TwoFactorPanel } from "./two-factor-panel";
import { SecurityPanel } from "./security-panel";
import type { SecuritySettings } from "../types";
import { TWO_FACTOR_CONFIG, SECURITY_SETTINGS } from "../data";
import { useLiveSecurity } from "../live";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

export function SecurityCategory() {
  const [security, setSecurity] = useState<SecuritySettings>(SECURITY_SETTINGS);
  const live = useLiveSecurity(SECURITY_SETTINGS);

  return (
    <Tabs defaultValue="2fa">
      <PageTabsList
        tabs={[
          { value: "2fa", label: "Two Factor Authentication" },
          { value: "access", label: "Password & Access" },
        ]}
      />

      <TabsContent value="2fa" className="mt-6">
        {live.live ? (
          // Two-factor authentication has no endpoint yet.
          <NotIntegrated label="Two-factor authentication">
            <TwoFactorPanel config={TWO_FACTOR_CONFIG} />
          </NotIntegrated>
        ) : (
          <TwoFactorPanel config={TWO_FACTOR_CONFIG} />
        )}
      </TabsContent>

      <TabsContent value="access" className="mt-6">
        <SecurityPanel
          key={`security-${live.version}`}
          security={live.security ?? security}
          onChange={setSecurity}
          onSavePolicy={live.live ? live.savePolicy : undefined}
          onRevokeDevice={live.live ? live.revokeDevice : undefined}
        />
      </TabsContent>
    </Tabs>
  );
}
