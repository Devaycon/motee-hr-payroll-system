"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  contractToRequest,
  toContract,
} from "@/src/lib/contracts/api-mapping";
import type { Contract, NewContract } from "@/src/lib/types/contracts";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetAllContractsQuery } from "@/src/store/services/collections";
import {
  useActivateContractMutation,
  useCreateContractMutation,
  useDeleteContractMutation,
  useFileContractToDocumentsMutation,
  useSendContractMutation,
  useUpdateContractMutation,
} from "@/src/store/services/contracts";
import { useUploadFileMutation } from "@/src/store/services/files";
import { buildContractLetterHtml } from "./components/contract-letter-modal";

export function useContracts() {
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const query = useGetAllContractsQuery(undefined, { skip });

  const data = useMemo<Contract[] | null>(
    () =>
      query.data
        ? query.data
            .map(toContract)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : null,
    [query.data],
  );

  return {
    data,
    loading: query.isLoading && !data,
    error: query.error ? getApiErrorMessage(query.error) : null,
  };
}

/** Each action resolves true once the server has accepted it. */
export function useContractActions() {
  const [create] = useCreateContractMutation();
  const [update] = useUpdateContractMutation();
  const [remove] = useDeleteContractMutation();
  const [send] = useSendContractMutation();
  const [activate] = useActivateContractMutation();
  const [upload] = useUploadFileMutation();
  const [fileToDocuments] = useFileContractToDocumentsMutation();

  return useMemo(() => {
    const attempt = async (run: () => Promise<unknown>, fallback: string) => {
      try {
        await run();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };
    /**
     * The form's status is a target, reached through the lifecycle calls: a
     * draft is only saved, "pending signature" sends it out, and "active"
     * activates it. Expiry and termination are not set from the form.
     */
    const advance = async (id: string, from: string, to: NewContract["status"]) => {
      if (to === from) return;
      if (to === "pending_signature" && from === "draft") {
        await send(id).unwrap();
      } else if (to === "active" && (from === "draft" || from === "pending_signature")) {
        await activate(id).unwrap();
      }
    };

    return {
      save(editing: Contract | null, input: NewContract) {
        if (!input.employeeId) {
          toast.error("Choose an employee for the contract.");
          return Promise.resolve(false);
        }
        const body = contractToRequest(input);
        return attempt(async () => {
          if (editing) {
            await update({ id: editing.id, body }).unwrap();
            await advance(editing.id, editing.status, input.status);
          } else {
            const created = await create(body).unwrap();
            await advance(created.data.id, "draft", input.status);
          }
        }, editing ? "Could not update the contract." : "Could not create the contract.");
      },

      remove(id: string) {
        return attempt(() => remove(id).unwrap(), "Could not delete the contract.");
      },

      /** The letter is stored as a file, then filed against the employee. */
      moveToDocuments(contract: Contract, hrSignature?: string) {
        return attempt(async () => {
          const html = buildContractLetterHtml(contract, hrSignature);
          const file = new File(
            [html],
            `${contract.title.replace(/[^\w\- ]+/g, "").trim() || "contract"}.html`,
            { type: "text/html" },
          );
          const stored = await upload({
            file,
            purpose: "employeeDocument",
            ownerId: contract.employeeId,
          }).unwrap();
          await fileToDocuments({
            id: contract.id,
            body: { storedFileId: stored.data.id },
          }).unwrap();
        }, "Could not move the contract to documents.");
      },
    };
  }, [create, update, remove, send, activate, upload, fileToDocuments]);
}
