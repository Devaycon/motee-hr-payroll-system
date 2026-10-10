import api, { API_PREFIX } from "./api";
import type {
  GetAuditTrailCatalogueResponse,
  GetAuditTrailParams,
  GetAuditTrailResponse,
} from "@/src/types/audit-trail";

const url = `${API_PREFIX}/audit-trail`;

export const auditTrailApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuditTrail: builder.query<
      GetAuditTrailResponse,
      GetAuditTrailParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AuditTrail"],
    }),
    getAuditTrailCatalogue: builder.query<
      GetAuditTrailCatalogueResponse,
      void
    >({
      query: () => ({
        url: `${url}/catalogue`,
        method: "GET",
      }),
      providesTags: ["AuditTrail"],
    }),
  }),
});

export const {
  useGetAuditTrailQuery,
  useGetAuditTrailCatalogueQuery,
} = auditTrailApi;
