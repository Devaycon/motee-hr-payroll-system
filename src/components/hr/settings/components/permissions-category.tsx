"use client";

import { ShieldCheck, GitBranch } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { SettingsLinkCard } from "./settings-link-card";

export function PermissionsCategory() {
  return (
    <Tabs defaultValue="permissions">
      <PageTabsList
        tabs={[
          { value: "permissions", label: "Permissions" },
          { value: "approvals", label: "Approvals" },
        ]}
      />

      <TabsContent value="permissions" className="mt-6">
        <SettingsLinkCard
          icon={ShieldCheck}
          title="Roles & Permissions"
          description="Role-based access control with granular, per-module permissions (view, create, edit, delete, export, approve) is managed under Access Levels."
          stats={[
            { label: "Permission actions", value: 6 },
            { label: "Controlled modules", value: "All" },
          ]}
          actions={[
            { label: "Manage Access Levels", href: "/admin/access-levels" },
          ]}
        />
      </TabsContent>

      <TabsContent value="approvals" className="mt-6">
        <SettingsLinkCard
          icon={GitBranch}
          title="Approval Workflows"
          description="Approval chains, conditional routing, escalation and SLAs are configured in the HR Action Center. Use Submissions for the approvals engine and Workflows for automated task assignment."
          actions={[
            { label: "Open Submissions", href: "/hr-action-center/submissions" },
            { label: "Open Workflows", href: "/hr-action-center/workflows" },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
