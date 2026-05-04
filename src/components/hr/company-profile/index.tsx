"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import type {
  ProfileData,
  VerificationStage,
  VerificationHistoryEntry,
} from "./types";
import { ProfileTab } from "./components/profile-tab";
import { VerificationTab } from "./components/verification-tab";
import { AnnouncementTab } from "./components/announcement-tab";
import { OrganogramTab } from "./components/organogram-tab";

export function CompanyProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "Motee Solutions Ltd",
    industry: "Technology",
    size: "51–200",
    country: "Nigeria",
    address: "14 Innovation Drive, Victoria Island, Lagos",
    contactEmail: "hr@moteesolutions.com",
    contactPhone: "+234 801 234 5678",
    website: "https://moteesolutions.com",
  });
  const [profileDraft, setProfileDraft] = useState<ProfileData>(profile);

  const [cacStatus, setCacStatus] = useState<VerificationStage>("Under Review");
  const [cacFile, setCacFile] = useState<string | null>(
    "CAC_Certificate_Motee.pdf",
  );
  const [cacNumber, setCacNumber] = useState("RC-1234567");
  const [cacHistory] = useState<VerificationHistoryEntry[]>([
    { stage: "Draft", date: "Mar 1, 2026", reviewer: "" },
    { stage: "Submitted", date: "Mar 5, 2026", reviewer: "System" },
    {
      stage: "Under Review",
      date: "Mar 10, 2026",
      reviewer: "Motee CMS Admin",
    },
  ]);

  const [tinStatus, setTinStatus] = useState<VerificationStage>("Submitted");
  const [tinFile, setTinFile] = useState<string | null>(
    "TIN_Certificate_Motee.pdf",
  );
  const [tinNumber, setTinNumber] = useState("TIN-9876543");
  const [tinHistory] = useState<VerificationHistoryEntry[]>([
    { stage: "Draft", date: "Mar 1, 2026", reviewer: "" },
    { stage: "Submitted", date: "Mar 8, 2026", reviewer: "System" },
  ]);

  const [announcement, setAnnouncement] = useState(
    "Q2 performance review season is now open. All managers must complete team reviews by April 30, 2026.",
  );
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState(announcement);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Company Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your organisation&apos;s details, verification documents and
            structure.
          </p>
        </div>
      </div>


        <Tabs defaultValue="profile">
          <TabsList className="h-9 mb-6">
            <TabsTrigger value="profile" className="text-xs">
              Profile
            </TabsTrigger>
            <TabsTrigger value="verification" className="text-xs">
              Verification Documents
            </TabsTrigger>
            <TabsTrigger value="announcement" className="text-xs">
              Pinned Announcement
            </TabsTrigger>
            <TabsTrigger value="organogram" className="text-xs">
              Organogram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <ProfileTab
              editing={editing}
              setEditing={setEditing}
              profile={profile}
              profileDraft={profileDraft}
              setProfileDraft={setProfileDraft}
              setProfile={setProfile}
              cacStatus={cacStatus}
              cacNumber={cacNumber}
              tinStatus={tinStatus}
              tinNumber={tinNumber}
            />
          </TabsContent>

          <TabsContent value="verification" className="mt-0">
            <VerificationTab
              cacNumber={cacNumber}
              setCacNumber={setCacNumber}
              cacStatus={cacStatus}
              setCacStatus={setCacStatus}
              cacFile={cacFile}
              setCacFile={setCacFile}
              cacHistory={cacHistory}
              tinNumber={tinNumber}
              setTinNumber={setTinNumber}
              tinStatus={tinStatus}
              setTinStatus={setTinStatus}
              tinFile={tinFile}
              setTinFile={setTinFile}
              tinHistory={tinHistory}
            />
          </TabsContent>

          <TabsContent value="announcement" className="mt-0">
            <AnnouncementTab
              announcement={announcement}
              setAnnouncement={setAnnouncement}
              editing={editingAnnouncement}
              setEditing={setEditingAnnouncement}
              draft={announcementDraft}
              setDraft={setAnnouncementDraft}
            />
          </TabsContent>

          <TabsContent value="organogram" className="mt-0">
            <OrganogramTab />
          </TabsContent>
        </Tabs>
    </div>
  );
}
