"use client";

import { useState } from "react";
import { HeroCard } from "./components/hero-card";
import { WhatsNewCard } from "./components/whats-new-card";
import { HelpResourcesCard } from "./components/help-resources-card";
import { TipsCard } from "./components/tips-card";
import { FeedbackCard } from "./components/feedback-card";
import { VersionCard } from "./components/version-card";
import { MyWorkspace } from "./components/my-workspace";

export function WelcomePage() {
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

      <MyWorkspace />

      {/* <div className="grid grid-cols-2 gap-4">
        <GettingStartedCard
          completedSteps={completedSteps}
          setupPercent={setupPercent}
          nextStep={nextStep}
        />
        <NextActionsCard />
      </div> */}

      <div>
        <WhatsNewCard />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <HelpResourcesCard />
        <TipsCard tipIndex={tipIndex} setTipIndex={setTipIndex} />
        <div className="flex flex-col gap-4">
          <div>
            <FeedbackCard />
          </div>
          <VersionCard />
        </div>
      </div>
    </div>
  );
}
