import { SystemSettings } from "../types/settings";
import { DEFAULT_OFFICE_COORDINATES } from "./mockAttendance";

export const DEFAULT_SETTINGS: SystemSettings = {
  standardShiftHours: 8,
  geofenceEnabled: true,
  officeLatitude: DEFAULT_OFFICE_COORDINATES.latitude,
  officeLongitude: DEFAULT_OFFICE_COORDINATES.longitude,
  allowedRadiusMeters: DEFAULT_OFFICE_COORDINATES.allowedRadiusMeters,
  requireSelfieValidation: true,
  missedPunchAlertThresholdHours: 12,
  officeName: "Tech Hub Tower - Vijay Nagar",
};
