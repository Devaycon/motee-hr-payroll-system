"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ModuleSettingsPanel } from "./module-settings-panel";
import { PickListPanel } from "./picklist-panel";
import { NotificationsPanel } from "./notifications-panel";
import { AccountPanel } from "./account-panel";
import type { NotificationPrefs } from "../types";
import {
  MODULE_SETTINGS,
  PICK_LISTS,
  NOTIFICATION_PREFS,
  ACCOUNT_SETTINGS,
  BILLING_RECORDS,
} from "../data";

export function AccountCategory() {
  const [notifPrefs, setNotifPrefs] =
    useState<NotificationPrefs>(NOTIFICATION_PREFS);

  return (
    <Tabs defaultValue="modules">
      <PageTabsList
        tabs={[
          { value: "modules", label: "Module Settings" },
          { value: "picklist", label: "Pick List" },
          { value: "notifications", label: "Notifications" },
          { value: "subscription", label: "Subscription" },
        ]}
      />

      <TabsContent value="modules" className="mt-6">
        <ModuleSettingsPanel modules={MODULE_SETTINGS} />
      </TabsContent>

      <TabsContent value="picklist" className="mt-6">
        <PickListPanel lists={PICK_LISTS} />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsPanel prefs={notifPrefs} onChange={setNotifPrefs} />
      </TabsContent>

      <TabsContent value="subscription" className="mt-6">
        <AccountPanel account={ACCOUNT_SETTINGS} billing={BILLING_RECORDS} />
      </TabsContent>
    </Tabs>
  );
}
