"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  announcementToRequest,
  dtoToRequest,
  toAnnouncement,
} from "@/src/lib/announcements/api-mapping";
import type {
  Announcement,
  NewAnnouncement,
} from "@/src/lib/types/announcements";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useArchiveAnnouncementMutation,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  usePublishAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from "@/src/store/services/announcements";
import {
  collectionsApi,
  useGetAllAnnouncementsQuery,
} from "@/src/store/services/collections";

/** Every announcement, archived included, newest first. */
export function useAnnouncements() {
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const query = useGetAllAnnouncementsQuery(undefined, { skip });

  const data = useMemo<Announcement[] | null>(
    () =>
      query.data
        ? query.data
            .map(toAnnouncement)
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

/** Department names on the form, mapped to the ids the API stores. */
export function useDepartmentNames() {
  const departments = useAppSelector((s) => s.locale.data?.departments);
  return useMemo(() => {
    const idByName = new Map(
      (departments ?? []).map((d) => [d.name, d.id] as const),
    );
    return { names: [...idByName.keys()].sort(), idByName };
  }, [departments]);
}

/** Each action resolves true once the server has accepted it. */
export function useAnnouncementActions() {
  // Reads the list the page already loaded; it does not fetch again.
  const query = collectionsApi.endpoints.getAllAnnouncements.useQueryState();
  const { idByName } = useDepartmentNames();
  const [create] = useCreateAnnouncementMutation();
  const [update] = useUpdateAnnouncementMutation();
  const [publish] = usePublishAnnouncementMutation();
  const [archive] = useArchiveAnnouncementMutation();
  const [remove] = useDeleteAnnouncementMutation();
  const stored = query.data;

  return useMemo(() => {
    const dtoById = new Map((stored ?? []).map((d) => [d.id, d]));
    const attempt = async (run: () => Promise<unknown>, fallback: string) => {
      try {
        await run();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };
    // Drafts stay drafts; anything else goes out through the publish call,
    // which honours a future "scheduled for" date.
    const shouldPublish = (input: NewAnnouncement) =>
      input.status === "published" || input.status === "scheduled";

    return {
      create(input: NewAnnouncement) {
        return attempt(async () => {
          const created = await create(
            announcementToRequest(input, idByName),
          ).unwrap();
          if (shouldPublish(input)) await publish(created.data.id).unwrap();
        }, "Could not create the announcement.");
      },

      update(current: Announcement, input: NewAnnouncement) {
        const dto = dtoById.get(current.id);
        return attempt(async () => {
          await update({
            id: current.id,
            body: announcementToRequest(input, idByName, dto?.attachmentFileId),
          }).unwrap();
          if (current.status === "draft" && shouldPublish(input)) {
            await publish(current.id).unwrap();
          }
        }, "Could not update the announcement.");
      },

      togglePin(id: string) {
        const dto = dtoById.get(id);
        if (!dto) return Promise.resolve(false);
        return attempt(
          () =>
            update({
              id,
              body: { ...dtoToRequest(dto), isPinned: !dto.isPinned },
            }).unwrap(),
          "Could not change the pin.",
        );
      },

      archive(id: string) {
        return attempt(
          () => archive(id).unwrap(),
          "Could not archive the announcement.",
        );
      },

      remove(id: string) {
        return attempt(
          () => remove(id).unwrap(),
          "Could not delete the announcement.",
        );
      },
    };
  }, [stored, idByName, create, update, publish, archive, remove]);
}
