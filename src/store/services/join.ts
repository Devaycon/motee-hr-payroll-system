import api, { API_PREFIX } from "./api";
import type {
  UploadJoinPhotoParams,
  UploadJoinPhotoResponse,
} from "@/src/types/join";
import type {
  AcceptInvitationParams,
  AcceptInvitationResponse,
  AcceptJoinConsentResponse,
  AttachJoinDocumentParams,
  AttachJoinDocumentResponse,
  DeclareJoinPackParams,
  DeclareJoinPackResponse,
  GetInvitationResponse,
  GetJoinPackResponse,
  GetJoinRequirementsResponse,
  RemoveJoinDocumentParams,
  RemoveJoinDocumentResponse,
  SaveJoinDraftParams,
  SaveJoinDraftResponse,
  SaveJoinGuarantorsParams,
  SaveJoinGuarantorsResponse,
  SaveJoinStarterTaxParams,
  SaveJoinStarterTaxResponse,
} from "@/src/types/join";

const url = `${API_PREFIX}/join`;

export const joinApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJoinRequirements: builder.query<
      GetJoinRequirementsResponse,
      string
    >({
      query: (token) => ({
        url: `${url}/${token}/requirements`,
        method: "GET",
      }),
      providesTags: ["JoinPack"],
    }),
    getJoinPack: builder.query<
      GetJoinPackResponse,
      string
    >({
      query: (token) => ({
        url: `${url}/${token}/pack`,
        method: "GET",
      }),
      providesTags: ["JoinPack"],
    }),
    acceptJoinConsent: builder.mutation<
      AcceptJoinConsentResponse,
      string
    >({
      query: (token) => ({
        url: `${url}/${token}/consent`,
        method: "POST",
      }),
      invalidatesTags: ["JoinPack"],
    }),
    attachJoinDocument: builder.mutation<
      AttachJoinDocumentResponse,
      AttachJoinDocumentParams
    >({
      query: ({ token, kind, body }) => ({
        url: `${url}/${token}/documents/${kind}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["JoinPack"],
    }),
    removeJoinDocument: builder.mutation<
      RemoveJoinDocumentResponse,
      RemoveJoinDocumentParams
    >({
      query: ({ token, kind }) => ({
        url: `${url}/${token}/documents/${kind}`,
        method: "DELETE",
      }),
      invalidatesTags: ["JoinPack"],
    }),
    saveJoinGuarantors: builder.mutation<
      SaveJoinGuarantorsResponse,
      SaveJoinGuarantorsParams
    >({
      query: ({ token, body }) => ({
        url: `${url}/${token}/guarantors`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["JoinPack"],
    }),
    saveJoinStarterTax: builder.mutation<
      SaveJoinStarterTaxResponse,
      SaveJoinStarterTaxParams
    >({
      query: ({ token, body }) => ({
        url: `${url}/${token}/starter-tax`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["JoinPack"],
    }),
    saveJoinDraft: builder.mutation<
      SaveJoinDraftResponse,
      SaveJoinDraftParams
    >({
      query: ({ token, body }) => ({
        url: `${url}/${token}/draft`,
        method: "PUT",
        body,
      }),
    }),
    declareJoinPack: builder.mutation<
      DeclareJoinPackResponse,
      DeclareJoinPackParams
    >({
      query: ({ token, body }) => ({
        url: `${url}/${token}/declare`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["JoinPack"],
    }),
    getInvitation: builder.query<
      GetInvitationResponse,
      string
    >({
      query: (token) => ({
        url: `${url}/${token}`,
        method: "GET",
      }),
      providesTags: ["JoinPack"],
    }),
    acceptInvitation: builder.mutation<
      AcceptInvitationResponse,
      AcceptInvitationParams
    >({
      query: ({ token, body }) => ({
        url: `${url}/${token}`,
        method: "POST",
        body,
      }),
    }),
    uploadJoinPhoto: builder.mutation<
      UploadJoinPhotoResponse,
      UploadJoinPhotoParams
    >({
      query: ({ token, file }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `${url}/${token}/photo`,
          method: "POST",
          body,
        };
      },
    }),
  }),
});

export const {
  useGetJoinRequirementsQuery,
  useGetJoinPackQuery,
  useAcceptJoinConsentMutation,
  useAttachJoinDocumentMutation,
  useRemoveJoinDocumentMutation,
  useSaveJoinGuarantorsMutation,
  useSaveJoinStarterTaxMutation,
  useSaveJoinDraftMutation,
  useDeclareJoinPackMutation,
  useGetInvitationQuery,
  useAcceptInvitationMutation,
  useUploadJoinPhotoMutation,
} = joinApi;
