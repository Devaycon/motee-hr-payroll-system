/**
 * Presence check-in notifications — HR should hear about an inactive stretch
 * when it happens, not only discover it later in the productivity table.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";

export function presenceInactiveFlagged(
  employeeName: string,
  missThreshold: number,
): PushNotificationPayload {
  return {
    title: `${employeeName} may be inactive`,
    description: `${employeeName} missed ${missThreshold} consecutive presence check-ins while clocked in.`,
    detail:
      `${employeeName} missed ${missThreshold} presence check-ins in a row while clocked in.\n\n` +
      `This period has been logged as inactive in today's productivity summary.`,
    type: "warning",
  };
}
