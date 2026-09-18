export interface SystemSettings {
  standardShiftHours: number;
  geofenceEnabled: boolean;
  officeLatitude: number;
  officeLongitude: number;
  allowedRadiusMeters: number;
  requireSelfieValidation: boolean;
  missedPunchAlertThresholdHours: number;
  officeName: string;
  gracePeriodMinutes?: number;
  overtimeMinimumMinutes?: number;
}
