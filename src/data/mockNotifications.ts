import { NotificationItem } from "../types/notification";

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_01",
    userId: "usr_emp_01", // Aarav Sharma
    title: "Overtime Approved",
    message: "Your overtime request of 2.0 hours for Sep 17 was approved by Priya Patel.",
    type: "OVERTIME",
    isRead: false,
    createdAt: "2026-09-17T20:45:00.000Z",
    link: "/employee/overtime",
  },
  {
    id: "notif_02",
    userId: "usr_mgr_01", // Priya Patel
    title: "Pending Attendance Validation",
    message: "Rahul Verma punched in outside permitted office geofence on Sep 18. Verification required.",
    type: "VALIDATION",
    isRead: false,
    createdAt: "2026-09-18T10:20:00.000Z",
    link: "/manager/validation",
  },
  {
    id: "notif_03",
    userId: "usr_mgr_01", // Priya Patel
    title: "New Overtime Request",
    message: "Neha Singh submitted an overtime request for 1.5 hours on Sep 18.",
    type: "OVERTIME",
    isRead: false,
    createdAt: "2026-09-18T18:05:00.000Z",
    link: "/manager/overtime",
  },
  {
    id: "notif_04",
    userId: "usr_admin_01", // Rajesh Malhotra
    title: "Missed Punch-Out Alert",
    message: "Sneha Kulkarni missed punch-out on Sep 12. Automated flag logged.",
    type: "ATTENDANCE",
    isRead: true,
    createdAt: "2026-09-13T09:00:00.000Z",
    link: "/admin/attendance",
  },
  {
    id: "notif_05",
    userId: "usr_emp_01",
    title: "Shift Active",
    message: "You punched in successfully today at 09:15 AM with verified camera selfie and location.",
    type: "ATTENDANCE",
    isRead: true,
    createdAt: "2026-09-18T09:15:00.000Z",
    link: "/employee/attendance",
  },
  {
    id: "notif_06",
    userId: "usr_admin_01",
    title: "System Geofence Active",
    message: "HQ Campus Geofence perimeter active with 500m radius.",
    type: "SYSTEM",
    isRead: true,
    createdAt: "2026-09-18T08:00:00.000Z",
    link: "/admin/settings",
  }
];
