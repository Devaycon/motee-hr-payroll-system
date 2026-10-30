import api, { API_PREFIX } from "./api";
import { fetchAllPages } from "./api/paging";
import type { AssetDto } from "@/src/types/assets";
import type { AuditEntryDto } from "@/src/types/audit-trail";
import type { LeaveBalanceDto } from "@/src/types/leave-balances";
import type { LeaveRequestDto } from "@/src/types/leave";
import type {
  GetOffboardingResponse,
  OffboardingDto,
  OffboardingListItemDto,
} from "@/src/types/offboarding";
import type { OnboardingDto } from "@/src/types/onboarding";
import type { AttendanceDayDto, TimesheetDto } from "@/src/types/attendance";
import type {
  PerformanceGoalDto,
  PerformanceReviewDto,
} from "@/src/types/performance";
import type { AnnouncementDto } from "@/src/types/announcements";
import type { ExpenseClaimDto } from "@/src/types/expenses";
import type { ContractDto } from "@/src/types/contracts";
import type { DocumentDto } from "@/src/types/documents";
import type { RequisitionDto } from "@/src/types/requisitions";
import type { CandidateDto } from "@/src/types/candidates";

/**
 * Whole-collection reads of the paged list endpoints. Each walks every page
 * (see `fetchAllPages`) and shares its module's cache tag, so the same
 * mutations that refresh the paged queries refresh these.
 */
export const collectionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssetInventory: builder.query<AssetDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<AssetDto>(baseQuery, `${API_PREFIX}/assets`, "camel"),
      providesTags: ["Assets"],
    }),
    /** The most recent audit entries (three pages), newest first. */
    getRecentAuditEntries: builder.query<AuditEntryDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<AuditEntryDto>(
          baseQuery,
          `${API_PREFIX}/audit-trail`,
          "pascal",
          {},
          3,
        ),
      providesTags: ["AuditTrail"],
    }),
    getAllLeaveRequests: builder.query<LeaveRequestDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<LeaveRequestDto>(
          baseQuery,
          `${API_PREFIX}/leave/requests`,
          "pascal",
        ),
      providesTags: ["Leave"],
    }),
    getAllLeaveBalances: builder.query<LeaveBalanceDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<LeaveBalanceDto>(
          baseQuery,
          `${API_PREFIX}/leave/balances`,
          "pascal",
        ),
      providesTags: ["LeaveBalances"],
    }),
    getAllOnboardings: builder.query<OnboardingDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<OnboardingDto>(
          baseQuery,
          `${API_PREFIX}/onboarding`,
          "pascal",
        ),
      providesTags: ["Onboarding"],
    }),
    /**
     * The list endpoint carries clearance as counts only, but the screens tick
     * individual steps, so each record is read in full.
     */
    getOffboardingRecords: builder.query<OffboardingDto[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const list = await fetchAllPages<OffboardingListItemDto>(
          baseQuery,
          `${API_PREFIX}/offboarding`,
          "pascal",
        );
        if ("error" in list) return list;

        const records: OffboardingDto[] = [];
        const BATCH = 8;
        for (let i = 0; i < list.data.length; i += BATCH) {
          const batch = await Promise.all(
            list.data.slice(i, i + BATCH).map((item) =>
              baseQuery({
                url: `${API_PREFIX}/offboarding/${item.id}`,
                method: "GET",
              }),
            ),
          );
          for (const result of batch) {
            if (result.error) return { error: result.error };
            records.push((result.data as GetOffboardingResponse).data);
          }
        }
        return { data: records };
      },
      providesTags: ["Offboarding"],
    }),
    /** Every attendance day on one date (the Today tab). */
    getAttendanceForDate: builder.query<AttendanceDayDto[], string>({
      queryFn: (date, _api, _extraOptions, baseQuery) =>
        fetchAllPages<AttendanceDayDto>(
          baseQuery,
          `${API_PREFIX}/attendance`,
          "pascal",
          { Date: date },
        ),
      providesTags: ["Attendance"],
    }),
    getAllTimesheets: builder.query<TimesheetDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<TimesheetDto>(
          baseQuery,
          `${API_PREFIX}/attendance/timesheets`,
          "pascal",
        ),
      providesTags: ["Timesheets"],
    }),
    getAllPerformanceReviews: builder.query<PerformanceReviewDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<PerformanceReviewDto>(
          baseQuery,
          `${API_PREFIX}/performance/reviews`,
          "pascal",
        ),
      providesTags: ["PerformanceReviews"],
    }),
    getAllPerformanceGoals: builder.query<PerformanceGoalDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<PerformanceGoalDto>(
          baseQuery,
          `${API_PREFIX}/performance/goals`,
          "pascal",
        ),
      providesTags: ["PerformanceGoals"],
    }),
    /** Archived ones too: the screen has an Archived tab. */
    getAllAnnouncements: builder.query<AnnouncementDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<AnnouncementDto>(
          baseQuery,
          `${API_PREFIX}/announcements`,
          "pascal",
          { IncludeArchived: true },
        ),
      providesTags: ["Announcements"],
    }),
    getAllExpenseClaims: builder.query<ExpenseClaimDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<ExpenseClaimDto>(
          baseQuery,
          `${API_PREFIX}/expenses/claims`,
          "pascal",
        ),
      providesTags: ["ExpenseClaims"],
    }),
    getAllContracts: builder.query<ContractDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<ContractDto>(baseQuery, `${API_PREFIX}/contracts`, "pascal"),
      providesTags: ["Contracts"],
    }),
    /** Archived and trashed too: both have their own views. */
    getAllDocuments: builder.query<DocumentDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<DocumentDto>(baseQuery, `${API_PREFIX}/documents`, "pascal", {
          IncludeArchived: true,
          IncludeTrashed: true,
        }),
      providesTags: ["Documents"],
    }),
    getAllRequisitions: builder.query<RequisitionDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<RequisitionDto>(baseQuery, `${API_PREFIX}/requisitions`, "pascal"),
      providesTags: ["Requisitions"],
    }),
    getAllCandidates: builder.query<CandidateDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<CandidateDto>(baseQuery, `${API_PREFIX}/candidates`, "pascal"),
      providesTags: ["Candidates"],
    }),
  }),
});

export const {
  useGetAssetInventoryQuery,
  useGetRecentAuditEntriesQuery,
  useGetAllLeaveRequestsQuery,
  useGetAllLeaveBalancesQuery,
  useGetAllOnboardingsQuery,
  useGetOffboardingRecordsQuery,
  useGetAttendanceForDateQuery,
  useGetAllTimesheetsQuery,
  useGetAllPerformanceReviewsQuery,
  useGetAllPerformanceGoalsQuery,
  useGetAllAnnouncementsQuery,
  useGetAllExpenseClaimsQuery,
  useGetAllContractsQuery,
  useGetAllDocumentsQuery,
  useGetAllRequisitionsQuery,
  useGetAllCandidatesQuery,
} = collectionsApi;
