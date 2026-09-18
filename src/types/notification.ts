export type NotificationType = "ATTENDANCE" | "OVERTIME" | "VALIDATION" | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId: string; // or "ALL" or role
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string;
}
