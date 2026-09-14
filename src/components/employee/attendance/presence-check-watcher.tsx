"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { store } from "@/src/lib/stores/store";
import { addPrompt, resolvePrompt } from "@/src/lib/stores/presence-check-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { presenceInactiveFlagged } from "@/src/lib/notifications/presence-check";
import { isoDateOf } from "@/src/lib/types/attendance";
import {
  derivePresencePeriods,
  type PresencePrompt,
} from "@/src/lib/types/presence-check";
import { useMyAttendanceIdentity } from "./hooks";
import { PresenceCheckDialog } from "./components/presence-check-dialog";

function uid(): string {
  return `PC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function randomIntervalMs(minMinutes: number, maxMinutes: number): number {
  const lo = Math.min(minMinutes, maxMinutes);
  const hi = Math.max(minMinutes, maxMinutes);
  const minutes = lo + Math.random() * Math.max(0, hi - lo);
  return Math.max(1, minutes) * 60_000;
}

/**
 * Global, page-agnostic watcher: while an employee is clocked in and presence
 * check-ins are enabled, it schedules "are you still there?" prompts at a
 * random interval within HR's configured range and logs whether each one is
 * confirmed or missed. Mounted once in the employee shell so it keeps running
 * no matter which page the employee is on.
 *
 * Ticks on a 1s interval rather than raw `setTimeout` for the scheduled
 * prompt/deadline — a backgrounded tab throttles long timers unpredictably,
 * but a 1s interval checked against wall-clock timestamps self-corrects the
 * moment the tab regains focus (the same trick `MyAttendancePage` uses for
 * its own clock).
 */
export function PresenceCheckWatcher() {
  const dispatch = useAppDispatch();
  const { employeeId, employee } = useMyAttendanceIdentity();
  const settings = useAppSelector((s) => s.presenceCheck.settings);
  const session = useAppSelector((s) =>
    employeeId ? s.attendance.sessions[employeeId] : undefined,
  );

  const [openPrompt, setOpenPrompt] = useState<PresencePrompt | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const nextAtRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const notifiedInactiveStartsRef = useRef<Set<string>>(new Set());

  const todayIso = isoDateOf(new Date());
  const activeSession =
    session && session.date === todayIso ? session : undefined;
  const eligible =
    settings.enabled &&
    !!employeeId &&
    !!activeSession &&
    (activeSession.state === "clocked_in" ||
      (activeSession.state === "on_break" && !settings.pauseDuringBreaks));

  // Reset scheduling whenever eligibility drops (clock out, break, feature
  // disabled) so a stale timer can't fire a prompt for a session that ended.
  useEffect(() => {
    if (!eligible) {
      nextAtRef.current = null;
      deadlineRef.current = null;
      setOpenPrompt(null);
    }
  }, [eligible]);

  useEffect(() => {
    if (!eligible || !employeeId || !employee) return;

    const tick = setInterval(() => {
      const now = Date.now();

      // A prompt is open — check whether the response window ran out.
      if (deadlineRef.current !== null) {
        const remaining = Math.ceil((deadlineRef.current - now) / 1000);
        setSecondsRemaining(Math.max(0, remaining));
        if (remaining <= 0) {
          setOpenPrompt((current) => {
            if (current) {
              const respondedAt = new Date().toISOString();
              dispatch(
                resolvePrompt({ id: current.id, outcome: "missed", respondedAt }),
              );
              maybeFlagInactive(current);
            }
            return null;
          });
          deadlineRef.current = null;
          nextAtRef.current =
            now + randomIntervalMs(settings.intervalMinMinutes, settings.intervalMaxMinutes);
        }
        return;
      }

      // No prompt open — schedule one, or fire it once due.
      if (nextAtRef.current === null) {
        nextAtRef.current =
          now + randomIntervalMs(settings.intervalMinMinutes, settings.intervalMaxMinutes);
        return;
      }
      if (now >= nextAtRef.current) {
        const prompt: PresencePrompt = {
          id: uid(),
          employeeId,
          employeeName: employee.fullName,
          sessionDate: todayIso,
          triggeredAt: new Date().toISOString(),
          responseWindowSeconds: settings.responseWindowSeconds,
        };
        dispatch(addPrompt(prompt));
        setOpenPrompt(prompt);
        deadlineRef.current = now + settings.responseWindowSeconds * 1000;
        setSecondsRemaining(settings.responseWindowSeconds);
        nextAtRef.current = null;
      }
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, employeeId, employee, settings, todayIso]);

  /** After a miss, check whether this just crossed the "inactive" threshold. */
  function maybeFlagInactive(justMissed: PresencePrompt) {
    if (!employee) return;
    const resolvedMissed: PresencePrompt = {
      ...justMissed,
      outcome: "missed",
      respondedAt: new Date().toISOString(),
    };
    // Read live state rather than the render-time selector value — this runs
    // from inside a long-lived interval closure, so a stale snapshot would
    // miss prompts resolved earlier in the same clocked-in session.
    const todaysPrompts = store
      .getState()
      .presenceCheck.prompts.filter(
        (p) =>
          p.employeeId === justMissed.employeeId &&
          p.sessionDate === todayIso &&
          p.id !== justMissed.id,
      )
      .concat(resolvedMissed);
    const periods = derivePresencePeriods(
      todaysPrompts,
      settings.missThreshold,
      activeSession?.clockInAt ?? justMissed.sessionDate,
      new Date().toISOString(),
    );
    // The streak just crossed the threshold iff the most recent period is
    // an (as yet unclosed) inactive one we haven't already notified about.
    const lastPeriod = periods[periods.length - 1];
    if (
      lastPeriod?.status === "inactive" &&
      !notifiedInactiveStartsRef.current.has(lastPeriod.startAt)
    ) {
      notifiedInactiveStartsRef.current.add(lastPeriod.startAt);
      dispatch(
        pushNotification(
          presenceInactiveFlagged(employee.fullName, settings.missThreshold),
        ),
      );
    }
  }

  function handleConfirm() {
    if (!openPrompt) return;
    dispatch(
      resolvePrompt({
        id: openPrompt.id,
        outcome: "confirmed",
        respondedAt: new Date().toISOString(),
      }),
    );
    setOpenPrompt(null);
    deadlineRef.current = null;
    nextAtRef.current =
      Date.now() +
      randomIntervalMs(settings.intervalMinMinutes, settings.intervalMaxMinutes);
  }

  if (!openPrompt) return null;

  return (
    <PresenceCheckDialog
      open
      secondsRemaining={secondsRemaining}
      responseWindowSeconds={openPrompt.responseWindowSeconds}
      onConfirm={handleConfirm}
    />
  );
}
