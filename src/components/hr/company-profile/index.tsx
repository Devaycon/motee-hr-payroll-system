"use client";

import { useState, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  useCompanyActions,
  useCompanyNotice,
  useCompanyProfile,
  useCompanyVerification,
} from "./hooks";
import { notifyNotIntegrated } from "@/src/components/shared/not-integrated";
import type { VerificationKind } from "@/src/types/company";
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
  const actions = useCompanyActions();
  const notice = useCompanyNotice();
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

  // Signed in, saving the profile writes it to the API before the local copy
  // changes; a refused save leaves the form as it was.
  const saveProfile = (next: SetStateAction<ProfileData>) => {
    const value = typeof next === "function" ? next(profile) : next;
    if (!actions.live) {
      setProfile(value);
      return;
    }
    void actions.saveProfile(value).then((ok) => {
      if (!ok) return;
      setProfile(value);
      toast.success("Company profile saved");
    });
  };

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

  // The picked supporting documents, uploaded when the card is submitted.
  const [cacUpload, setCacUpload] = useState<File | null>(null);
  const [tinUpload, setTinUpload] = useState<File | null>(null);

  /** Signed in, "Submit for Verification" saves and submits through the API. */
  const submitter =
    (
      kind: VerificationKind,
      number: string,
      upload: File | null,
      setStatus: (v: VerificationStage) => void,
    ) =>
    (status: VerificationStage) => {
      if (!actions.live || status !== "Submitted") {
        setStatus(status);
        return;
      }
      void actions.submit(kind, number, upload).then((ok) => {
        if (!ok) return;
        setStatus("Submitted");
        toast.success("Submitted for verification");
      });
    };

  const reg = verification?.registration;
  const tax = verification?.tax;

  const [announcement, setAnnouncement] = useState(
    "Q2 performance review season is now open. All managers must complete team reviews by April 30, 2026.",
  );
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState(announcement);
  // Signed in, the pinned notice is the server one.
  const [seenNotice, setSeenNotice] = useState<string | undefined>(undefined);
  if (notice.text !== undefined && notice.text !== seenNotice) {
    setSeenNotice(notice.text);
    setAnnouncement(notice.text);
    setAnnouncementDraft(notice.text);
  }
  // The API has no endpoint to change the pinned notice.
  const saveAnnouncement = (v: string) => {
    if (notice.live) {
      notifyNotIntegrated("Editing the pinned notice");
      return;
    }
    setAnnouncement(v);
  };

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
            setProfile={saveProfile}
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
            setCacStatus={submitter("registration", cacNumber, cacUpload, setCacStatus)}
            cacFile={cacFile}
            setCacFile={setCacFile}
            onCacUpload={setCacUpload}
            cacHistory={cacHistory}
            tinLabel={tax?.label ?? "Tax ID"}
            tinDescription={tax?.description ?? ""}
            tinNumberLabel={tax?.numberLabel ?? "Tax No."}
            tinNumber={tinNumber}
            setTinNumber={setTinNumber}
            tinStatus={tinStatus}
            setTinStatus={submitter("tax", tinNumber, tinUpload, setTinStatus)}
            tinFile={tinFile}
            setTinFile={setTinFile}
            onTinUpload={setTinUpload}
            tinHistory={tinHistory}
          />
        </TabsContent>

        <TabsContent value="announcement" className="mt-0">
          <AnnouncementTab
            announcement={announcement}
            setAnnouncement={saveAnnouncement}
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
