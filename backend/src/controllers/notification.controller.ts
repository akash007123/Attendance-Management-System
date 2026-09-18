import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Notification } from "../models/notification.model";

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({
      $or: [{ userId }, { userId: "ALL" }, { userId: req.user?.role }],
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }] },
      { isRead: true }
    );

    return res.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    await Notification.updateMany(
      { $or: [{ userId }, { userId: "ALL" }, { userId: req.user?.role }] },
      { isRead: true }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    next(error);
  }
}
