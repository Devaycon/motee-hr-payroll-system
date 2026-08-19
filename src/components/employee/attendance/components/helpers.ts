/**
 * Re-export of the shared duration helpers.
 *
 * These used to be defined here; they moved to `lib/utils/format-duration` once
 * the HR side and the timesheet grid needed them too. The re-export keeps the
 * module's own imports short and local.
 */
export {
  pad,
  secondsToHHMMSS,
  secondsToHHMM,
  hoursToHHMM,
  formatTimeAMPM,
  formatTimeHHMM,
  addMinutesToTime,
  minutesFromTime,
  timeOnDate,
} from "@/src/lib/utils/format-duration";
