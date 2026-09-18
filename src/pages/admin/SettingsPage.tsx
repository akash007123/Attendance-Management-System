import React, { useState, useEffect } from "react";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "../../store/api/baseApi";
import { useAppDispatch } from "../../store/hooks";
import { addToast } from "../../store/slices/uiSlice";
import { SystemSettings } from "../../types/settings";
import {
  Settings,
  MapPin,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Navigation,
  HelpCircle,
  Loader2,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettingsMutation, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [formData, setFormData] = useState<SystemSettings>({
    officeLatitude: 22.7196,
    officeLongitude: 75.8577,
    allowedRadiusMeters: 100,
    officeName: "Tech Park Corporate HQ",
    standardShiftHours: 8,
    gracePeriodMinutes: 15,
    geofenceEnabled: true,
    overtimeMinimumMinutes: 30,
    requireSelfieValidation: true,
    missedPunchAlertThresholdHours: 12,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation(formData).unwrap();
      dispatch(
        addToast({
          type: "success",
          message: "System attendance policy and geofence updated successfully.",
        })
      );
    } catch (err: any) {
      dispatch(addToast({ type: "error", message: "Failed to update settings." }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          System Settings & Geofence Policy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure office GPS anchor coordinates, geofence radius perimeter, and standard 8-hour shift parameters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Office Geofence Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Office Location & Geofence Anchor
              </h3>
            </div>

            {/* Geofence Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.geofenceEnabled}
                onChange={(e) => setFormData({ ...formData, geofenceEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
              />
              Enforce Geofence Validation
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Office Facility / Campus Name
              </label>
              <input
                type="text"
                required
                value={formData.officeName}
                onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anchor Latitude (GPS) *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.officeLatitude}
                onChange={(e) =>
                  setFormData({ ...formData, officeLatitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anchor Longitude (GPS) *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.officeLongitude}
                onChange={(e) =>
                  setFormData({ ...formData, officeLongitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Permitted Attendance Radius (meters) *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={formData.allowedRadiusMeters}
                  onChange={(e) =>
                    setFormData({ ...formData, allowedRadiusMeters: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center text-slate-800 dark:text-slate-200">
                  {formData.allowedRadiusMeters}m
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Employees punching outside this perimeter will be flagged as "Suspicious" and require manager review.
              </p>
            </div>
          </div>
        </div>

        {/* Shift Duration & Policy Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Shift Policy & Standard Work Hours
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Standard Shift Hours *
              </label>
              <input
                type="number"
                min="4"
                max="12"
                step="0.5"
                required
                value={formData.standardShiftHours}
                onChange={(e) =>
                  setFormData({ ...formData, standardShiftHours: parseFloat(e.target.value) || 8 })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ≥8 hours qualifies as Completed
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.gracePeriodMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Permitted delay before marking Late
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min. Overtime Request (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="120"
                value={formData.overtimeMinimumMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, overtimeMinimumMinutes: parseInt(e.target.value, 10) || 30 })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum extra time to file overtime
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            id="save-settings-button"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Policy Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save System Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
