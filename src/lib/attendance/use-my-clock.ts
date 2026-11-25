"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { adoptServerSession } from "@/src/lib/stores/attendance-slice";
import { useGetMyAttendanceDayQuery } from "@/src/store/services/attendance";
import type { ClockSession } from "@/src/lib/types/attendance";
import type { AttendanceDayDto } from "@/src/types/attendance";

const STATE: Record<AttendanceDayDto["state"], ClockSession["state"]> = {
  notStarted: "idle",
  clockedIn: "clocked_in",
  onBreak: "on_break",
  clockedOut: "clocked_out",
};

const LOCATION: Record<AttendanceDayDto["location"], ClockSession["location"]> = {
  office: "office",
  remote: "remote",
  clientSite: "client_site",
};

/** Today's punch on the server, as the clock widget's session. */
export function sessionFromApi(dto: AttendanceDayDto): ClockSession {
  return {
    employeeId: dto.employeeId,
    date: dto.date.slice(0, 10),
    state: STATE[dto.state] ?? "idle",
    clockInAt: dto.clockInAt ?? undefined,
    clockOutAt: dto.clockOutAt ?? undefined,
    breaks: dto.breaks.map((b) => ({ start: b.start, end: b.end ?? undefined })),
    location: LOCATION[dto.location] ?? "office",
    locationName: dto.locationName ?? undefined,
    clockInCoords: dto.clockInCoordinates ?? undefined,
    clockOutCoords: dto.clockOutCoordinates ?? undefined,
    source: dto.source === "manual" ? "web" : dto.source,
    note: dto.note ?? undefined,
  };
}

/**
 * Signed in: reads today's punch (`GET /attendance/mine`) into the clock
 * store, so a punch made elsewhere (another device, or by HR) shows here.
 */
export function useMyClockLive(employeeId: string | null | undefined, today: string) {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const q = useGetMyAttendanceDayQuery({ date: today }, { skip: !live || !employeeId });
  useEffect(() => {
    const dto = q.data?.data;
    if (!live || !dto || !employeeId || dto.employeeId !== employeeId) return;
    if (dto.state === "notStarted") return;
    dispatch(adoptServerSession(sessionFromApi(dto)));
  }, [live, q.data, employeeId, dispatch]);
}
