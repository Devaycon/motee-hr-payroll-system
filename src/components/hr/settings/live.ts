"use client";

/**
 * Live adapters for the Settings page. Each hook returns `null` data signed
 * out (the panels keep their demo copy) and, signed in, the server's settings
 * mapped onto the panel's own types plus the writes that panel makes.
 */
import { useMemo } from "react";
import { toast } from "sonner";
import { useApiRunner, useIsLive } from "@/src/lib/live/use-is-live";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  useGetHolidayYearsQuery,
  useGetModuleSettingsQuery,
  useGetPasswordPolicyQuery,
  useGetSubscriptionQuery,
  useUpdateHolidayYearMutation,
  useUpdateModuleSettingsMutation,
  useUpdatePasswordPolicyMutation,
} from "@/src/store/services/settings";
import {
  useAddPickListOptionMutation,
  useDeletePickListOptionMutation,
  useGetPickListsQuery,
  useSetDefaultPickListOptionMutation,
  useUpdatePickListOptionMutation,
} from "@/src/store/services/pick-lists";
import {
  useGetMyAccountActivityQuery,
  useGetMyNotificationSettingsQuery,
  useGetMySessionsQuery,
  useRevokeMySessionMutation,
  useUpdateMyNotificationSettingsMutation,
} from "@/src/store/services/account-settings";
import {
  useCreateLeaveBlackoutMutation,
  useCreatePublicHolidayMutation,
  useDeleteLeaveBlackoutMutation,
  useDeletePublicHolidayMutation,
  useGetLeaveBlackoutsQuery,
  useGetPublicHolidaysQuery,
  useUpdateLeaveBlackoutMutation,
  useUpdatePublicHolidayMutation,
} from "@/src/store/services/leave-policies";
import type {
  AccountSettings,
  BlackoutPeriod,
  CompanyHoliday,
  DigestFrequency,
  HolidayYearConfig,
  LanguageOption,
  ModuleSetting,
  NotificationPrefs,
  PasswordPolicy,
  PickList,
  SecuritySettings,
} from "./types";
import type { DigestFrequency as ApiDigest } from "@/src/types/account-settings";

// ── Account › Module Settings ──

export function useLiveModuleSettings() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetModuleSettingsQuery(undefined, { skip: !live });
  const [update] = useUpdateModuleSettingsMutation();
  const modules = useMemo<ModuleSetting[] | null>(
    () =>
      q.data?.data
        ? q.data.data.modules.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            enabled: m.enabled,
            showInSidebar: m.showInSidebar,
          }))
        : null,
    [q.data],
  );
  const save = (next: ModuleSetting[]) =>
    run(
      () =>
        update({
          modules: next.map((m) => ({
            id: m.id,
            enabled: m.enabled,
            showInSidebar: m.showInSidebar,
          })),
        }).unwrap(),
      "Could not save the module settings.",
    );
  return { live, modules, version: q.fulfilledTimeStamp ?? 0, save };
}

// ── Account › Pick List ──

export interface PickListApi {
  add: (listId: string, value: string) => Promise<boolean>;
  update: (listId: string, optionId: string, value: string) => Promise<boolean>;
  remove: (listId: string, optionId: string) => Promise<boolean>;
  setDefault: (listId: string, optionId: string) => Promise<boolean>;
}

export function useLivePickLists() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetPickListsQuery(undefined, { skip: !live });
  const [add] = useAddPickListOptionMutation();
  const [update] = useUpdatePickListOptionMutation();
  const [remove] = useDeletePickListOptionMutation();
  const [setDefault] = useSetDefaultPickListOptionMutation();
  const lists = useMemo<PickList[] | null>(
    () =>
      q.data?.data
        ? q.data.data.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description,
            options: l.options.map((o) => ({ id: o.id, value: o.value, isDefault: o.isDefault })),
          }))
        : null,
    [q.data],
  );
  const api: PickListApi = {
    add: (key, value) =>
      run(() => add({ key, body: { value } }).unwrap(), "Could not add the value."),
    update: (key, id, value) =>
      run(() => update({ key, id, body: { value } }).unwrap(), "Could not update the value."),
    remove: (key, id) =>
      run(() => remove({ key, id }).unwrap(), "Could not delete the value."),
    setDefault: (key, id) =>
      run(() => setDefault({ key, id }).unwrap(), "Could not set the default value."),
  };
  return { live, lists, version: q.fulfilledTimeStamp ?? 0, api };
}

// ── Account › Notifications (the signed-in user's own preferences) ──

const DIGEST_TO_API: Record<DigestFrequency, ApiDigest> = {
  realtime: "realtime",
  hourly: "realtime",
  daily: "daily",
  weekly: "weekly",
  never: "weekly",
};

const LANGUAGES: LanguageOption[] = ["en", "fr", "es", "pt", "ar"];

export function useLiveNotificationPrefs() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetMyNotificationSettingsQuery(undefined, { skip: !live });
  const [update] = useUpdateMyNotificationSettingsMutation();
  const prefs = useMemo<NotificationPrefs | null>(() => {
    const v = q.data?.data;
    if (!v) return null;
    const lang = (v.language ?? "en").slice(0, 2) as LanguageOption;
    return {
      modules: v.groups.map((g) => ({
        id: g.id,
        label: g.label,
        email: g.email,
        inApp: g.inApp,
        push: g.push,
      })),
      digestFrequency: v.digestFrequency,
      timezone: v.timeZoneId ?? "Africa/Lagos",
      language: LANGUAGES.includes(lang) ? lang : "en",
    };
  }, [q.data]);
  const save = (p: NotificationPrefs) =>
    run(
      () =>
        update({
          groups: p.modules.map((m) => ({ id: m.id, email: m.email, inApp: m.inApp, push: m.push })),
          digestFrequency: DIGEST_TO_API[p.digestFrequency],
          timeZoneId: p.timezone,
          language: p.language,
        }).unwrap(),
      "Could not save your notification preferences.",
    );
  return { live, prefs, version: q.fulfilledTimeStamp ?? 0, save };
}

// ── Account › Subscription ──

export function useLiveSubscription(): { live: boolean; account: AccountSettings | null } {
  const live = useIsLive();
  const q = useGetSubscriptionQuery(undefined, { skip: !live });
  const account = useMemo<AccountSettings | null>(() => {
    const v = q.data?.data;
    if (!v) return null;
    return {
      companyName: v.companyName,
      plan: v.plan,
      planLabel: v.planLabel,
      renewalDate: v.trialEndsAt ?? "",
      contactEmail: v.billingEmail ?? "",
      // Unlimited plans have no seat limit; show the seats in use as the cap.
      seats: v.seatLimit ?? Math.max(v.usedSeats, 1),
      usedSeats: v.usedSeats,
    };
  }, [q.data]);
  return { live, account };
}

// ── Absence › Holiday Year ──

export function useLiveHolidayYear() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetHolidayYearsQuery(undefined, { skip: !live });
  const [update] = useUpdateHolidayYearMutation();
  const cycles = useMemo<HolidayYearConfig[] | null>(
    () =>
      q.data?.data
        ? q.data.data.cycles.map((c) => ({
            id: c.id,
            label: c.label,
            startDate: c.startDate.slice(0, 10),
            endDate: c.endDate.slice(0, 10),
            isActive: c.isActive,
          }))
        : null,
    [q.data],
  );
  /** The API derives every cycle from one start day; editing a cycle moves it. */
  const setStart = (startDate: string) => {
    const [, month, day] = startDate.split("-").map(Number);
    return run(
      () => update({ startMonth: month, startDay: day }).unwrap(),
      "Could not update the holiday year.",
    );
  };
  return { live, cycles, version: q.fulfilledTimeStamp ?? 0, setStart };
}

// ── Absence › Company Holidays (public holidays) ──

export function useLiveCompanyHolidays() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetPublicHolidaysQuery(undefined, { skip: !live });
  const [create] = useCreatePublicHolidayMutation();
  const [update] = useUpdatePublicHolidayMutation();
  const [remove] = useDeletePublicHolidayMutation();
  const departments = useAppSelector((s) => s.locale.data?.departments);
  const holidays = useMemo<CompanyHoliday[] | null>(
    () =>
      q.data?.data
        ? q.data.data.map((h) => ({
            id: h.id,
            name: h.name,
            date: h.date.slice(0, 10),
            nonWorking: h.isNonWorking ?? true,
            excludedDepartments: h.excludedDepartmentNames ?? [],
          }))
        : null,
    [q.data],
  );
  const save = async (h: CompanyHoliday, existingId?: string) => {
    // The form holds department names; the API takes ids.
    const byName = new Map(
      (departments ?? []).map((d) => [d.name.trim().toLowerCase(), d.id]),
    );
    const unknown = h.excludedDepartments.filter((n) => !byName.has(n.trim().toLowerCase()));
    if (unknown.length > 0) {
      toast.error(`No department called ${unknown.map((n) => `"${n}"`).join(", ")}.`);
      return false;
    }
    const body = {
      name: h.name,
      date: h.date,
      isNonWorking: h.nonWorking,
      excludedDepartmentIds: h.excludedDepartments.map((n) => byName.get(n.trim().toLowerCase())!),
    };
    return run(
      () => (existingId ? update({ id: existingId, body }).unwrap() : create(body).unwrap()),
      "Could not save the holiday.",
    );
  };
  const del = (id: string) => run(() => remove(id).unwrap(), "Could not delete the holiday.");
  return { live, holidays, version: q.fulfilledTimeStamp ?? 0, save, remove: del };
}

// ── Absence › Company Blackout ──

export function useLiveBlackouts() {
  const live = useIsLive();
  const run = useApiRunner();
  const q = useGetLeaveBlackoutsQuery(undefined, { skip: !live });
  const [create] = useCreateLeaveBlackoutMutation();
  const [update] = useUpdateLeaveBlackoutMutation();
  const [remove] = useDeleteLeaveBlackoutMutation();
  const periods = useMemo<BlackoutPeriod[] | null>(
    () =>
      q.data?.data
        ? q.data.data.map((b) => ({
            id: b.id,
            name: b.name,
            startDate: b.startDate.slice(0, 10),
            endDate: b.endDate.slice(0, 10),
            reason: b.reason ?? undefined,
          }))
        : null,
    [q.data],
  );
  const save = (p: BlackoutPeriod, existingId?: string) => {
    const existing = q.data?.data.find((b) => b.id === existingId);
    const body = {
      name: p.name,
      reason: p.reason || null,
      startDate: p.startDate,
      endDate: p.endDate,
      // A company blackout applies to every leave type and department.
      leaveTypeIds: existing?.leaveTypeIds ?? [],
      departmentIds: existing?.departmentIds ?? [],
      isActive: true,
    };
    return run(
      () => (existingId ? update({ id: existingId, body }).unwrap() : create(body).unwrap()),
      "Could not save the blackout period.",
    );
  };
  const del = (id: string) =>
    run(() => remove(id).unwrap(), "Could not remove the blackout period.");
  return { live, periods, version: q.fulfilledTimeStamp ?? 0, save, remove: del };
}

// ── Security › password policy, sessions and sign-in activity ──

export function useLiveSecurity(demo: SecuritySettings) {
  const live = useIsLive();
  const run = useApiRunner();
  const policyQ = useGetPasswordPolicyQuery(undefined, { skip: !live });
  const sessionsQ = useGetMySessionsQuery(undefined, { skip: !live });
  const activityQ = useGetMyAccountActivityQuery({ take: 20 }, { skip: !live });
  const [updatePolicy] = useUpdatePasswordPolicyMutation();
  const [revoke] = useRevokeMySessionMutation();

  const security = useMemo<SecuritySettings | null>(() => {
    const p = policyQ.data?.data?.policy;
    if (!p) return null;
    const passwordPolicy: PasswordPolicy = {
      minLength: p.minLength ?? demo.passwordPolicy.minLength,
      requireUppercase: p.requireUppercase ?? false,
      requireNumbers: p.requireNumbers ?? false,
      requireSymbols: p.requireSymbols ?? false,
      expiryDays: p.expiryDays ?? 0,
      preventReuse: p.preventReuse ?? 0,
      sessionTimeoutMinutes: p.sessionTimeoutMinutes,
    };
    return {
      ...demo,
      sessionTimeoutMinutes: p.sessionTimeoutMinutes ?? demo.sessionTimeoutMinutes,
      passwordPolicy,
      trustedDevices: (sessionsQ.data?.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        browser: s.browser,
        os: s.operatingSystem,
        lastSeen: s.signedInAt,
        isCurrent: s.isCurrent,
      })),
      loginActivity: (activityQ.data?.data ?? []).map((e) => ({
        id: e.id,
        event: e.event,
        ipAddress: e.ipAddress ?? "",
        location: e.location ?? "",
        device: e.device ?? "",
        timestamp: e.at,
        success: e.succeeded,
      })),
    };
  }, [policyQ.data, sessionsQ.data, activityQ.data, demo]);

  const savePolicy = (p: PasswordPolicy) =>
    run(
      () =>
        updatePolicy({
          minLength: p.minLength,
          requireUppercase: p.requireUppercase,
          requireNumbers: p.requireNumbers,
          requireSymbols: p.requireSymbols,
          expiryDays: p.expiryDays,
          preventReuse: p.preventReuse,
          sessionTimeoutMinutes: p.sessionTimeoutMinutes,
        }).unwrap(),
      "Could not save the password policy.",
    );
  const revokeDevice = (id: string) =>
    run(() => revoke(id).unwrap(), "Could not sign that device out.");

  const version =
    (policyQ.fulfilledTimeStamp ?? 0) +
    (sessionsQ.fulfilledTimeStamp ?? 0) +
    (activityQ.fulfilledTimeStamp ?? 0);
  return { live, security, version, savePolicy, revokeDevice };
}
