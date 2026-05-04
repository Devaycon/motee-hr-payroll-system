"use client";

import { useState } from "react";
import { HeroCard } from "./components/hero-card";
import { AlertsSection } from "./components/alerts-section";
import { AnnouncementsCard } from "./components/announcements-card";
import { WhatsNewCard } from "./components/whats-new-card";
import { HelpResourcesCard } from "./components/help-resources-card";
import { TipsCard } from "./components/tips-card";
import { FeedbackCard } from "./components/feedback-card";
import { VersionCard } from "./components/version-card";

export function WelcomePage() {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [tipIndex, setTipIndex] = useState(0);

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* <HeroCard dateStr={dateStr} /> */}

      <AlertsSection
        dismissedAlerts={dismissedAlerts}
        onDismiss={(id) => setDismissedAlerts((p) => [...p, id])}
      />

      {/* <div className="grid grid-cols-2 gap-4">
        <GettingStartedCard
          completedSteps={completedSteps}
          setupPercent={setupPercent}
          nextStep={nextStep}
        />
        <NextActionsCard />
      </div> */}

      <div>
        <div className="grid grid-cols-2 gap-4">
          <AnnouncementsCard />
          <WhatsNewCard />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <HelpResourcesCard />
        <TipsCard tipIndex={tipIndex} setTipIndex={setTipIndex} />
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              To Motee
            </p>
            <FeedbackCard />
          </div>
          <VersionCard />
        </div>
      </div>
    </div>
  );
}
