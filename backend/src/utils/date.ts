export const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Returns normalized YYYY-MM-DD date in the configured business timezone (Asia/Kolkata).
 * Do NOT depend on raw UTC dates when comparing 'today' attendance.
 */
export function getAttendanceDateString(dateInput?: Date | string | number): string {
  const dateObj = dateInput ? new Date(dateInput) : new Date();
  
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  return formatter.format(dateObj); // Returns "YYYY-MM-DD"
}

export function calculateWorkingMinutes(
  punchInIso: string,
  punchOutIso?: string | null,
  referenceNow?: Date
): number {
  if (!punchInIso) return 0;
  const start = new Date(punchInIso).getTime();
  const end = punchOutIso ? new Date(punchOutIso).getTime() : (referenceNow ? referenceNow.getTime() : Date.now());
  
  const diffMs = Math.max(0, end - start);
  return Math.floor(diffMs / (1000 * 60));
}

export function isCompletedShift(workingMinutes: number, standardShiftHours = 8): boolean {
  return workingMinutes >= standardShiftHours * 60;
}
