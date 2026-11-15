"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ModuleSettingsPanel } from "./module-settings-panel";
import { PickListPanel } from "./picklist-panel";
import { NotificationsPanel } from "./notifications-panel";
import { AccountPanel } from "./account-panel";
import type { NotificationPrefs } from "../types";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  MODULE_SETTINGS,
  ACCOUNT_SETTINGS,
  billingRecordsFor,
  notificationPrefsFor,
  pickListsFor,
} from "../data";

export function AccountCategory() {
  // Billing currency, office locations and timezone follow the active country.
  const country = useAppSelector((s) => s.locale.country);
  const branches = useAppSelector((s) => s.locale.data?.branches);
  const legalName = useAppSelector(
    (s) => (s.locale.data?.companyProfile as { legalName?: string } | undefined)?.legalName,
  );
  const [notifPrefs, setNotifPrefs] =
    useState<NotificationPrefs>(() => notificationPrefsFor(country));
  const pickLists = pickListsFor(country, (branches ?? []).map((b) => b.name));
  const account = legalName ? { ...ACCOUNT_SETTINGS, companyName: legalName } : ACCOUNT_SETTINGS;

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
        <PickListPanel lists={pickLists} />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsPanel prefs={notifPrefs} onChange={setNotifPrefs} />
      </TabsContent>

      <TabsContent value="subscription" className="mt-6">
        <AccountPanel account={account} billing={billingRecordsFor(country)} />
      </TabsContent>
    </Tabs>
  );
}
