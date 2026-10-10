import api, { API_PREFIX } from "./api";
import type { ApiResponse } from "@/src/types/api";
import type {
  SupportedCountry,
  TenantLocale,
  VisitorLocale,
} from "@/src/types/locale";

const url = `${API_PREFIX}/locale`;

// The locale endpoints are documented with the standard wrapper but currently
// answer with the bare payload, so both forms are accepted.
function unwrap<T>(response: T | ApiResponse<T>): T {
  if (
    response &&
    typeof response === "object" &&
    !Array.isArray(response) &&
    "responseCode" in response &&
    "data" in response
  ) {
    return response.data;
  }
  return response as T;
}

export const localeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    detectLocale: builder.query<VisitorLocale, void>({
      query: () => ({
        url: `${url}/detect`,
        method: "GET",
      }),
      transformResponse: unwrap<VisitorLocale>,
    }),
    getSupportedCountries: builder.query<SupportedCountry[], void>({
      query: () => ({
        url: `${url}/countries`,
        method: "GET",
      }),
      transformResponse: unwrap<SupportedCountry[]>,
    }),
    getTenantLocale: builder.query<TenantLocale, void>({
      query: () => ({
        url,
        method: "GET",
      }),
      transformResponse: unwrap<TenantLocale>,
      providesTags: ["TenantLocale"],
    }),
  }),
});

export const {
  useDetectLocaleQuery,
  useGetSupportedCountriesQuery,
  useGetTenantLocaleQuery,
} = localeApi;
