"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { AccountPanel } from "./components/account-panel";
import { SecurityPanel } from "./components/security-panel";
import { NotificationsPanel } from "./components/notifications-panel";
import type { SecuritySettings, NotificationPrefs } from "./types";
import {
  ACCOUNT_SETTINGS,
  BILLING_RECORDS,
  SECURITY_SETTINGS,
  NOTIFICATION_PREFS,
} from "./data";

export function SettingsPage() {
  const [security, setSecurity] = useState<SecuritySettings>(SECURITY_SETTINGS);
  const [notifPrefs, setNotifPrefs] =
    useState<NotificationPrefs>(NOTIFICATION_PREFS);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">
            Settings &amp; Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, security policies and notification preferences.
          </p>
        </div>
      </div>

      <Tabs defaultValue="account">
        <PageTabsList
          tabs={[
            { value: "account", label: "Account" },
            { value: "security", label: "Security" },
            { value: "notifications", label: "Notifications" },
          ]}
        />

        <TabsContent value="account" className="mt-6">
          <AccountPanel account={ACCOUNT_SETTINGS} billing={BILLING_RECORDS} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityPanel security={security} onChange={setSecurity} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsPanel prefs={notifPrefs} onChange={setNotifPrefs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
