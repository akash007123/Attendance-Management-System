import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { mockApi } from "../../services/mockApi";
import { Attendance, AttendanceStatus, ValidationStatus } from "../../types/attendance";
import { OvertimeRequest } from "../../types/overtime";
import { User } from "../../types/user";
import { NotificationItem } from "../../types/notification";
import { SystemSettings } from "../../types/settings";
import { LoginCredentials, SignupData } from "../../types/auth";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "Attendance",
    "Overtime",
    "Users",
    "Notifications",
    "Settings",
  ],
  endpoints: (builder) => ({
    // ---------------- AUTH ----------------
    login: builder.mutation<{ user: User; token: string }, LoginCredentials>({
      async queryFn(credentials) {
        try {
          const res = await mockApi.login(credentials);
          return { data: res };
        } catch (error: any) {
          return { error: error.message || "Failed to login" };
        }
      },
      invalidatesTags: ["Attendance", "Overtime", "Notifications"],
    }),

    signup: builder.mutation<{ user: User; token: string }, SignupData>({
      async queryFn(data) {
        try {
          const res = await mockApi.signup(data);
          return { data: res };
        } catch (error: any) {
          return { error: error.message || "Failed to sign up" };
        }
      },
      invalidatesTags: ["Users"],
    }),

    // ---------------- USERS ----------------
    getUsers: builder.query<User[], void>({
      async queryFn() {
        try {
          const data = await mockApi.getUsers();
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: ["Users"],
    }),

    createUser: builder.mutation<User, any>({
      async queryFn(userData) {
        try {
          const data = await mockApi.createUser(userData);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation<User, { id: string; updates?: Partial<User>; user?: Partial<User> }>({
      async queryFn({ id, updates, user }) {
        try {
          const payload = updates || user || {};
          const data = await mockApi.updateUser(id, payload);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Users"],
    }),

    // ---------------- ATTENDANCE ----------------
    getAttendance: builder.query<
      Attendance[],
      {
        employeeId?: string;
        managerId?: string;
        department?: string;
        date?: string;
        status?: AttendanceStatus;
        validationStatus?: ValidationStatus;
      } | void
    >({
      async queryFn(filter) {
        try {
          const data = await mockApi.getAttendance(filter || undefined);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: ["Attendance"],
    }),

    getAttendanceById: builder.query<Attendance, string>({
      async queryFn(id) {
        try {
          const data = await mockApi.getAttendanceById(id);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: (_result, _error, id) => [{ type: "Attendance", id }],
    }),

    punchIn: builder.mutation<
      Attendance,
      {
        employeeId: string;
        selfie: string;
        location: Attendance["punchInLocation"];
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.punchIn(payload);
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to punch in" };
        }
      },
      invalidatesTags: ["Attendance", "Notifications"],
    }),

    punchOut: builder.mutation<
      Attendance,
      {
        attendanceId: string;
        selfie: string;
        location: Attendance["punchInLocation"];
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.punchOut(payload);
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to punch out" };
        }
      },
      invalidatesTags: ["Attendance", "Notifications"],
    }),

    validateAttendance: builder.mutation<
      Attendance,
      {
        attendanceId: string;
        validationStatus: ValidationStatus;
        remarks?: string;
        validatedBy: string;
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.validateAttendance(payload);
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to validate attendance" };
        }
      },
      invalidatesTags: ["Attendance", "Notifications"],
    }),

    // ---------------- OVERTIME ----------------
    getOvertimeRequests: builder.query<
      OvertimeRequest[],
      { employeeId?: string; managerId?: string; status?: string } | void
    >({
      async queryFn(filter) {
        try {
          const data = await mockApi.getOvertimeRequests(filter || undefined);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: ["Overtime"],
    }),

    createOvertimeRequest: builder.mutation<
      OvertimeRequest,
      {
        employeeId: string;
        date: string;
        startTime: string;
        endTime: string;
        requestedHours: number;
        reason: string;
        attendanceId?: string;
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.createOvertimeRequest(payload);
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to submit overtime request" };
        }
      },
      invalidatesTags: ["Overtime", "Attendance", "Notifications"],
    }),

    approveOvertime: builder.mutation<
      OvertimeRequest,
      {
        requestId: string;
        remarks?: string;
        reviewerId: string;
        reviewerName: string;
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.reviewOvertime({
            requestId: payload.requestId,
            status: "APPROVED",
            remarks: payload.remarks,
            reviewerId: payload.reviewerId,
            reviewerName: payload.reviewerName,
          });
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to approve overtime" };
        }
      },
      invalidatesTags: ["Overtime", "Attendance", "Notifications"],
    }),

    rejectOvertime: builder.mutation<
      OvertimeRequest,
      {
        requestId: string;
        remarks: string;
        reviewerId: string;
        reviewerName: string;
      }
    >({
      async queryFn(payload) {
        try {
          const data = await mockApi.reviewOvertime({
            requestId: payload.requestId,
            status: "REJECTED",
            remarks: payload.remarks,
            reviewerId: payload.reviewerId,
            reviewerName: payload.reviewerName,
          });
          return { data };
        } catch (error: any) {
          return { error: error.message || "Failed to reject overtime" };
        }
      },
      invalidatesTags: ["Overtime", "Attendance", "Notifications"],
    }),

    // ---------------- NOTIFICATIONS ----------------
    getNotifications: builder.query<NotificationItem[], string | void>({
      async queryFn(userId) {
        try {
          const data = await mockApi.getNotifications(userId || undefined);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: ["Notifications"],
    }),

    markNotificationRead: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          await mockApi.markNotificationRead(id);
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Notifications"],
    }),

    markAllNotificationsRead: builder.mutation<void, string | void>({
      async queryFn(userId) {
        try {
          await mockApi.markAllNotificationsRead(userId || undefined);
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Notifications"],
    }),

    // ---------------- SETTINGS ----------------
    getSettings: builder.query<SystemSettings, void>({
      async queryFn() {
        try {
          const data = await mockApi.getSettings();
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation<SystemSettings, Partial<SystemSettings>>({
      async queryFn(updates) {
        try {
          const data = await mockApi.updateSettings(updates);
          return { data };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Settings"],
    }),

    resetDemoData: builder.mutation<void, void>({
      async queryFn() {
        try {
          await mockApi.resetDemo();
          return { data: undefined };
        } catch (error: any) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Attendance", "Overtime", "Users", "Notifications", "Settings"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetAttendanceQuery,
  useGetAttendanceByIdQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useValidateAttendanceMutation,
  useGetOvertimeRequestsQuery,
  useCreateOvertimeRequestMutation,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useResetDemoDataMutation,
} = baseApi;
