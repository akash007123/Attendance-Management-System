import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Settings } from "../models/settings.model";

export async function getSettings(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
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
    }

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const updates = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    return res.json({
      success: true,
      message: "System settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}
