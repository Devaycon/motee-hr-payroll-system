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
  useLiveModuleSettings,
  useLiveNotificationPrefs,
  useLivePickLists,
  useLiveSubscription,
} from "../live";
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
  // Signed in, each tab reads the API; until it answers the demo copy shows.
  const modules = useLiveModuleSettings();
  const pickLists = useLivePickLists();
  const notifications = useLiveNotificationPrefs();
  const subscription = useLiveSubscription();

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
        <ModuleSettingsPanel
          key={`modules-${modules.version}`}
          modules={modules.modules ?? MODULE_SETTINGS}
          onSave={modules.live ? modules.save : undefined}
        />
      </TabsContent>

      <TabsContent value="picklist" className="mt-6">
        <PickListPanel
          lists={pickLists.lists ?? PICK_LISTS}
          api={pickLists.live ? pickLists.api : undefined}
        />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationsPanel
          key={`notifications-${notifications.version}`}
          prefs={notifications.prefs ?? notifPrefs}
          onChange={setNotifPrefs}
          onSave={notifications.live ? notifications.save : undefined}
        />
      </TabsContent>

      <TabsContent value="subscription" className="mt-6">
        <AccountPanel
          account={subscription.account ?? ACCOUNT_SETTINGS}
          billing={BILLING_RECORDS}
          live={subscription.live}
        />
      </TabsContent>
    </Tabs>
  );
}
