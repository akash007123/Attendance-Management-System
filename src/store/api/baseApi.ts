import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Attendance, AttendanceStatus, ValidationStatus } from "../../types/attendance";
import { OvertimeRequest } from "../../types/overtime";
import { User } from "../../types/user";
import { NotificationItem } from "../../types/notification";
import { SystemSettings } from "../../types/settings";
import { LoginCredentials, SignupData } from "../../types/auth";
import type { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const currentUserId = state.auth?.currentUser?.id;
    if (currentUserId) {
      headers.set("x-user-id", currentUserId);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery,
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
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => ({
        user: response.user,
        token: response.token,
      }),
      invalidatesTags: ["Attendance", "Overtime", "Notifications"],
    }),

    signup: builder.mutation<{ user: User; token: string }, SignupData>({
      query: (data) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: any) => ({
        user: response.user,
        token: response.token,
      }),
      invalidatesTags: ["Users"],
    }),

    // ---------------- USERS ----------------
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (response: any) => response.data || response,
      providesTags: ["Users"],
    }),

    createUser: builder.mutation<User, any>({
      query: (userData) => ({
        url: "/users",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation<User, { id: string; updates?: Partial<User>; user?: Partial<User> }>({
      query: ({ id, updates, user }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: updates || user || {},
      }),
      transformResponse: (response: any) => response.data || response,
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
      query: (filter) => ({
        url: "/attendance",
        params: filter || undefined,
      }),
      transformResponse: (response: any) => response.data || response,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Attendance" as const, id })),
              { type: "Attendance" as const, id: "LIST" },
            ]
          : [{ type: "Attendance" as const, id: "LIST" }],
    }),

    getAttendanceById: builder.query<Attendance, string>({
      query: (id) => `/attendance/${id}`,
      transformResponse: (response: any) => response.data || response,
      providesTags: (_result, _error, id) => [{ type: "Attendance", id }],
    }),

    punchIn: builder.mutation<
      Attendance,
      {
        employeeId: string;
        selfie: string;
        location: Attendance["punchInLocation"];
        faceDetected?: boolean;
        faceConfidence?: number;
      }
    >({
      query: (payload) => ({
        url: "/attendance/punch-in",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result) => [
        { type: "Attendance" as const, id: "LIST" },
        ...(result?.id ? [{ type: "Attendance" as const, id: result.id }] : []),
        "Attendance",
        "Notifications",
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newRecord } = await queryFulfilled;
          dispatch(
            baseApi.util.updateQueryData("getAttendance", undefined, (draft) => {
              const existingIdx = draft.findIndex((a) => a.id === newRecord.id);
              if (existingIdx !== -1) {
                draft[existingIdx] = newRecord;
              } else {
                draft.unshift(newRecord);
              }
            })
          );
          if (newRecord.employeeId) {
            dispatch(
              baseApi.util.updateQueryData(
                "getAttendance",
                { employeeId: newRecord.employeeId },
                (draft) => {
                  const existingIdx = draft.findIndex((a) => a.id === newRecord.id);
                  if (existingIdx !== -1) {
                    draft[existingIdx] = newRecord;
                  } else {
                    draft.unshift(newRecord);
                  }
                }
              )
            );
          }
        } catch {}
      },
    }),

    punchOut: builder.mutation<
      Attendance,
      {
        attendanceId: string;
        selfie: string;
        location: Attendance["punchInLocation"];
      }
    >({
      query: (payload) => ({
        url: "/attendance/punch-out",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result, _error, arg) => [
        { type: "Attendance" as const, id: arg.attendanceId },
        { type: "Attendance" as const, id: "LIST" },
        ...(result?.id ? [{ type: "Attendance" as const, id: result.id }] : []),
        "Attendance",
        "Notifications",
      ],
      async onQueryStarted({ attendanceId }, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedRecord } = await queryFulfilled;
          dispatch(
            baseApi.util.updateQueryData("getAttendance", undefined, (draft) => {
              const index = draft.findIndex(
                (a) => a.id === attendanceId || a.id === updatedRecord.id
              );
              if (index !== -1) {
                draft[index] = updatedRecord;
              }
            })
          );
          if (updatedRecord.employeeId) {
            dispatch(
              baseApi.util.updateQueryData(
                "getAttendance",
                { employeeId: updatedRecord.employeeId },
                (draft) => {
                  const index = draft.findIndex(
                    (a) => a.id === attendanceId || a.id === updatedRecord.id
                  );
                  if (index !== -1) {
                    draft[index] = updatedRecord;
                  }
                }
              )
            );
          }
          dispatch(
            baseApi.util.updateQueryData("getAttendanceById", attendanceId, (draft) => {
              Object.assign(draft, updatedRecord);
            })
          );
        } catch {}
      },
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
      query: ({ attendanceId, validationStatus, remarks, validatedBy }) => ({
        url: `/attendance/${attendanceId}/validation`,
        method: "PATCH",
        body: { validationStatus, remarks, validatedBy },
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: (result, _error, arg) => [
        { type: "Attendance" as const, id: arg.attendanceId },
        { type: "Attendance" as const, id: "LIST" },
        ...(result?.id ? [{ type: "Attendance" as const, id: result.id }] : []),
        "Attendance",
        "Notifications",
      ],
    }),

    // ---------------- OVERTIME ----------------
    getOvertimeRequests: builder.query<
      OvertimeRequest[],
      { employeeId?: string; managerId?: string; status?: string } | void
    >({
      query: (filter) => ({
        url: "/overtime",
        params: filter || undefined,
      }),
      transformResponse: (response: any) => response.data || response,
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
      query: (payload) => ({
        url: "/overtime",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: any) => response.data || response,
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
      query: ({ requestId, remarks, reviewerName }) => ({
        url: `/overtime/${requestId}/approve`,
        method: "PATCH",
        body: { remarks, reviewerName },
      }),
      transformResponse: (response: any) => response.data || response,
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
      query: ({ requestId, remarks, reviewerName }) => ({
        url: `/overtime/${requestId}/reject`,
        method: "PATCH",
        body: { remarks, reviewerName },
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["Overtime", "Attendance", "Notifications"],
    }),

    // ---------------- NOTIFICATIONS ----------------
    getNotifications: builder.query<NotificationItem[], string | void>({
      query: () => "/notifications",
      transformResponse: (response: any) => response.data || response,
      providesTags: ["Notifications"],
    }),

    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllNotificationsRead: builder.mutation<void, string | void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notifications"],
    }),

    // ---------------- SETTINGS ----------------
    getSettings: builder.query<SystemSettings, void>({
      query: () => "/settings",
      transformResponse: (response: any) => response.data || response,
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation<SystemSettings, Partial<SystemSettings>>({
      query: (updates) => ({
        url: "/settings",
        method: "PATCH",
        body: updates,
      }),
      transformResponse: (response: any) => response.data || response,
      invalidatesTags: ["Settings"],
    }),

    resetDemoData: builder.mutation<void, void>({
      query: () => ({
        url: "/system/reset-seed",
        method: "POST",
      }),
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
