"use client";

import { CalendarOff } from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { ApiSetupPanel } from "./api-setup-panel";
import { API_KEYS, API_USAGE_LOGS } from "../data";

const ACTIVE_TRIGGER =
  "text-sm px-3 data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

export function IntegrationsCategory() {
  return (
    <Tabs defaultValue="api">
      <TabsList className="h-9">
        <TabsTrigger value="api" className={ACTIVE_TRIGGER}>
          API Setup
        </TabsTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Span wrapper keeps the tooltip working on a disabled trigger. */}
              <span className="inline-flex">
                <TabsTrigger
                  value="calendar"
                  disabled
                  className={`${ACTIVE_TRIGGER} cursor-not-allowed opacity-50`}
                >
                  Calendar Subscription
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              This feature is not available in this version.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TabsList>

      <TabsContent value="api" className="mt-6">
        <ApiSetupPanel apiKeys={API_KEYS} usageLogs={API_USAGE_LOGS} />
      </TabsContent>

      <TabsContent value="calendar" className="mt-6">
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4.5 w-4.5 text-muted-foreground" />
              <CardTitle className="text-base">Calendar Subscription</CardTitle>
            </div>
            <CardDescription>
              This feature is not available in this version.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
