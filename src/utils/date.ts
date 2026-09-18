// Date and Attendance Duration calculation utilities

export function formatTime(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--:--";
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--";
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return String(isoOrDate);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return "--";
  const date = new Date(isoOrDate);
  if (isNaN(date.getTime())) return String(isoOrDate);
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Calculates working minutes between punchIn and punchOut.
 * If punchOut is not provided, calculates from punchIn to currentTime.
 */
export function calculateWorkingMinutes(
  punchIn: string,
  punchOut?: string | null,
  currentDate = new Date()
): number {
  if (!punchIn) return 0;
  const start = new Date(punchIn).getTime();
  if (isNaN(start)) return 0;

  const end = punchOut ? new Date(punchOut).getTime() : currentDate.getTime();
  if (isNaN(end)) return 0;

  const diffMs = Math.max(0, end - start);
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Format minutes into "HH:MM" format (e.g., 462 mins -> "07:42")
 */
export function formatDurationHoursMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Format minutes into "7h 42m" format
 */
export function formatDurationPretty(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hrs = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hrs}h ${mins}m`;
}

/**
 * Check if the shift meets the 8-hour requirement (480 minutes)
 */
export function isCompletedShift(minutes: number, standardHours = 8): boolean {
  return minutes >= standardHours * 60;
}

/**
 * Get context-appropriate greeting
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
