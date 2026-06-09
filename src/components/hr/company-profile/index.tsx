"use client";

import { useState } from "react";
import { useCompanyProfile, useCompanyVerification } from "./hooks";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
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
  const { data: profileFromLocale } = useCompanyProfile();
  const { data: verification } = useCompanyVerification();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    industry: "",
    size: "",
    country: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
  });
  const [profileDraft, setProfileDraft] = useState<ProfileData>(profile);
  // Re-seed the editable profile copy whenever the locale (country) data changes.
  const [seenProfile, setSeenProfile] = useState<ProfileData | null>(null);
  if (profileFromLocale && profileFromLocale !== seenProfile) {
    setSeenProfile(profileFromLocale);
    setProfile(profileFromLocale);
    setProfileDraft(profileFromLocale);
  }

  // Registration (CAC / Companies House) + Tax (TIN / VAT) state, seeded from the
  // active country's companyVerification block in the JSON bundle.
  const [cacStatus, setCacStatus] = useState<VerificationStage>("Draft");
  const [cacFile, setCacFile] = useState<string | null>(null);
  const [cacNumber, setCacNumber] = useState("");
  const [cacHistory, setCacHistory] = useState<VerificationHistoryEntry[]>([]);

  const [tinStatus, setTinStatus] = useState<VerificationStage>("Draft");
  const [tinFile, setTinFile] = useState<string | null>(null);
  const [tinNumber, setTinNumber] = useState("");
  const [tinHistory, setTinHistory] = useState<VerificationHistoryEntry[]>([]);

  // Re-seed verification state from the active country's JSON whenever it changes.
  const [seenVerification, setSeenVerification] =
    useState<typeof verification>(null);
  if (verification && verification !== seenVerification) {
    setSeenVerification(verification);
    const r = verification.registration;
    const t = verification.tax;
    setCacNumber(r.number);
    setCacStatus(r.status);
    setCacFile(r.documentName || null);
    setCacHistory(r.history);
    setTinNumber(t.number);
    setTinStatus(t.status);
    setTinFile(t.documentName || null);
    setTinHistory(t.history);
  }

  const reg = verification?.registration;
  const tax = verification?.tax;

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
        <PageTabsList
          className="mb-6"
          tabs={[
            { value: "profile", label: "Profile" },
            { value: "verification", label: "Verification Documents" },
            { value: "announcement", label: "Pinned Announcement" },
            { value: "organogram", label: "Organogram" },
          ]}
        />

        <TabsContent value="profile" className="mt-0">
          <ProfileTab
            editing={editing}
            setEditing={setEditing}
            profile={profile}
            profileDraft={profileDraft}
            setProfileDraft={setProfileDraft}
            setProfile={setProfile}
            cacLabel={reg?.label ?? "Registration"}
            cacStatus={cacStatus}
            cacNumber={cacNumber}
            tinLabel={tax?.label ?? "Tax ID"}
            tinStatus={tinStatus}
            tinNumber={tinNumber}
          />
        </TabsContent>

        <TabsContent value="verification" className="mt-0">
          <VerificationTab
            cacLabel={reg?.label ?? "Registration"}
            cacDescription={reg?.description ?? ""}
            cacNumberLabel={reg?.numberLabel ?? "Registration No."}
            cacNumber={cacNumber}
            setCacNumber={setCacNumber}
            cacStatus={cacStatus}
            setCacStatus={setCacStatus}
            cacFile={cacFile}
            setCacFile={setCacFile}
            cacHistory={cacHistory}
            tinLabel={tax?.label ?? "Tax ID"}
            tinDescription={tax?.description ?? ""}
            tinNumberLabel={tax?.numberLabel ?? "Tax No."}
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
