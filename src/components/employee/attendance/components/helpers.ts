const SCHEDULE_START = "09:00";

export function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

export function secondsToHHMMSS(s: number): string {
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
}

export function secondsToHHMM(s: number): string {
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (hrs === 0) return `${min}m`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}m`;
}

export function formatTimeAMPM(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatTimeHHMM(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(total / 60)}:${pad(total % 60)}`;
}

export function isLate(clockInDate: Date): boolean {
  const [sh, sm] = SCHEDULE_START.split(":").map(Number);
  const graceMinutes = 10;
  const scheduled = new Date(clockInDate);
  scheduled.setHours(sh, sm + graceMinutes, 0, 0);
  return clockInDate > scheduled;
}
