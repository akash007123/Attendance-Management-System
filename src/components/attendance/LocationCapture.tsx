import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { AttendanceLocation } from "../../types/attendance";
import { SystemSettings } from "../../types/settings";
import { checkGeofence, formatCoordinates } from "../../utils/geolocation";

interface LocationCaptureProps {
  settings: SystemSettings;
  onLocationCaptured: (location: AttendanceLocation) => void;
  capturedLocation: AttendanceLocation | null;
  onRetry: () => void;
}

export const LocationCapture: React.FC<LocationCaptureProps> = ({
  settings,
  onLocationCaptured,
  capturedLocation,
  onRetry,
}) => {
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser environment.");
      return;
    }

    setIsAcquiring(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);

        const geofence = checkGeofence(
          { latitude: userLat, longitude: userLon },
          { latitude: settings.officeLatitude, longitude: settings.officeLongitude },
          settings.allowedRadiusMeters
        );

        const loc: AttendanceLocation = {
          latitude: userLat,
          longitude: userLon,
          accuracy,
          isWithinGeofence: settings.geofenceEnabled ? geofence.isWithin : true,
          distanceMeters: geofence.distanceMeters,
          address: "Detected via Device GPS",
          isDemoLocation: false,
        };

        setIsAcquiring(false);
        onLocationCaptured(loc);
      },
      (err) => {
        setIsAcquiring(false);
        console.warn("Geolocation acquisition error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Location permission denied by user. Please enable GPS permission.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg("Location information is unavailable from your device.");
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg("Location request timed out. Please retry.");
        } else {
          setErrorMsg(err.message || "Failed to acquire device location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [settings, onLocationCaptured]);

  // Demo Location Simulator (within office or slightly outside for testing)
  const setDemoLocation = (withinOffice: boolean) => {
    setIsAcquiring(false);
    setErrorMsg(null);

    const lat = withinOffice ? settings.officeLatitude + 0.0001 : settings.officeLatitude + 0.035;
    const lon = withinOffice ? settings.officeLongitude + 0.0001 : settings.officeLongitude + 0.035;
    const geofence = checkGeofence(
      { latitude: lat, longitude: lon },
      { latitude: settings.officeLatitude, longitude: settings.officeLongitude },
      settings.allowedRadiusMeters
    );

    const loc: AttendanceLocation = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      accuracy: 8,
      isWithinGeofence: settings.geofenceEnabled ? geofence.isWithin : true,
      distanceMeters: geofence.distanceMeters,
      address: withinOffice
        ? `${settings.officeName} (Demo Verified)`
        : "External Cafe / Out-of-bounds (Demo)",
      isDemoLocation: true,
    };

    onLocationCaptured(loc);
  };

  useEffect(() => {
    if (!capturedLocation) {
      fetchBrowserLocation();
    }
  }, [capturedLocation, fetchBrowserLocation]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Location Status Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              GPS Geolocation & Geofence
            </span>
          </div>
          {capturedLocation && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Captured
            </span>
          )}
        </div>

        {/* Acquiring State */}
        {isAcquiring && (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Acquiring live GPS satellite coordinates...</span>
          </div>
        )}

        {/* Captured Coordinates Box */}
        {capturedLocation && !isAcquiring && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Latitude</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {capturedLocation.latitude}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Longitude</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {capturedLocation.longitude}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>
                Formatted: <strong>{formatCoordinates(capturedLocation.latitude, capturedLocation.longitude)}</strong>
              </span>
              <span>
                Accuracy: <strong>±{capturedLocation.accuracy}m</strong>
              </span>
            </div>

            {/* Geofence Check Indicator */}
            {settings.geofenceEnabled && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  capturedLocation.isWithinGeofence
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                }`}
              >
                {capturedLocation.isWithinGeofence ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-bold">
                    {capturedLocation.isWithinGeofence
                      ? "Within office radius"
                      : "Outside permitted attendance area"}
                  </div>
                  <div className="mt-0.5 opacity-90">
                    Distance from office:{" "}
                    <strong>{capturedLocation.distanceMeters ?? 0}m</strong> (Permitted radius:{" "}
                    {settings.allowedRadiusMeters}m)
                  </div>
                  {!capturedLocation.isWithinGeofence && (
                    <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                      Note: You may still submit, but attendance will be flagged as "Suspicious" for manager verification.
                    </p>
                  )}
                </div>
              </div>
            )}

            {capturedLocation.isDemoLocation && (
              <div className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-center">
                Simulated demo location enabled for testing
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {errorMsg && !isAcquiring && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Unable to obtain live GPS</div>
              <div className="mt-0.5">{errorMsg}</div>
            </div>
          </div>
        )}
      </div>

      {/* Geofence Office Info Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5" />
          Target Office: {settings.officeName}
        </span>
        <span>Radius: {settings.allowedRadiusMeters}m</span>
      </div>

      {/* Retry & Demo Location Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          id="retry-location-button"
          type="button"
          onClick={() => {
            onRetry();
            fetchBrowserLocation();
          }}
          disabled={isAcquiring}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAcquiring ? "animate-spin" : ""}`} />
          Retry GPS
        </button>

        {/* Demo buttons for testing in browser sandboxes where GPS is mocked or restricted */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Demo test:</span>
          <button
            type="button"
            onClick={() => setDemoLocation(true)}
            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 rounded-md transition-colors"
          >
            Office (In Geofence)
          </button>
          <button
            type="button"
            onClick={() => setDemoLocation(false)}
            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950/60 dark:hover:text-amber-300 rounded-md transition-colors"
          >
            Outside Geofence
          </button>
        </div>
      </div>
    </div>
  );
};
