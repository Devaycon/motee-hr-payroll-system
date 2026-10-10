import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/src/lib/stores/store";
import { logout, setCredentials } from "@/src/store/reducers/authSlice";
import type { LoginResponse } from "@/src/types/auth";
import { cacher } from "./rtkQueryCacheUtils";

export const API_PREFIX = "/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_MOTEE_BASE_URL ?? "",
  prepareHeaders: (headers, { getState }) => {
    const { token } = (getState() as RootState).session;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Parallel 401s share one refresh: the refresh token is single-use, so a
// second concurrent call would be rejected and sign the user out.
let refreshInFlight: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) return result;

  const { refresh_token: refreshToken, is_loggedIn: isLoggedIn } = (
    api.getState() as RootState
  ).session;

  // A 401 with no session is a failed sign-in, not an expired token.
  if (!isLoggedIn) return result;

  if (!refreshToken) {
    api.dispatch(logout());
    return result;
  }

  refreshInFlight ??= (async () => {
    const refreshResult = await baseQuery(
      {
        url: `${API_PREFIX}/auth/refresh`,
        method: "POST",
        body: { refreshToken },
      },
      api,
      extraOptions,
    );
    const session = (refreshResult.data as LoginResponse | undefined)?.data;

    if (!session?.accessToken) return false;

    api.dispatch(
      setCredentials({
        token: session.accessToken,
        refresh_token: session.refreshToken ?? undefined,
        expires_at: session.expiresAt,
        user_id: session.userId,
        tenant_id: session.tenantId,
        onboarding_completed: session.onboardingCompleted,
      }),
    );
    return true;
  })().finally(() => {
    refreshInFlight = null;
  });

  if (await refreshInFlight) {
    result = await baseQuery(args, api, extraOptions);
  } else {
    api.dispatch(logout());
  }

  return result;
};

const api = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    ...cacher.defaultTags,
    "CurrentUser",
    "Users",
    "TenantLocale",
    "TenantSetup",
    "Departments",
    "Branches",
    "BusinessUnits",
    "Employees",
    "Files",
    "Exports",
    "AccessLevels",
    "JoinPack",
    "Onboarding",
    "Offboarding",
    "Assets",
    "LeavePolicies",
    "LeaveBalances",
    "Leave",
    "ApprovalTemplates",
    "ApprovalDelegations",
    "Approvals",
    "AuditTrail",
    "Platform",
  ],
  endpoints: () => ({}),
  refetchOnReconnect: true,
});

export default api;
