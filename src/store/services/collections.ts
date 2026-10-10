import api, { API_PREFIX } from "./api";
import { fetchAllPages } from "./api/paging";
import type { AssetDto } from "@/src/types/assets";
import type { LeaveBalanceDto } from "@/src/types/leave-balances";
import type { LeaveRequestDto } from "@/src/types/leave";
import type {
  GetOffboardingResponse,
  OffboardingDto,
  OffboardingListItemDto,
} from "@/src/types/offboarding";
import type { OnboardingDto } from "@/src/types/onboarding";

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
  }),
});

export const {
  useGetAssetInventoryQuery,
  useGetAllLeaveRequestsQuery,
  useGetAllLeaveBalancesQuery,
  useGetAllOnboardingsQuery,
  useGetOffboardingRecordsQuery,
} = collectionsApi;
