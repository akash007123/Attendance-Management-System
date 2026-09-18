import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, UserRole } from "../../types/user";
import { AuthState } from "../../types/auth";
import { getItem, setItem, removeItem } from "../../utils/storage";

const AUTH_STORAGE_KEY = "ams_auth_session";

interface StoredSession {
  user: User;
  token: string;
}

const initialStored = getItem<StoredSession | null>(AUTH_STORAGE_KEY, null);

const initialState: AuthState = {
  currentUser: initialStored ? initialStored.user : null,
  token: initialStored ? initialStored.token : null,
  role: initialStored ? initialStored.user.role : null,
  isAuthenticated: !!initialStored,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user.role;
      state.isAuthenticated = true;
      state.error = null;
      setItem(AUTH_STORAGE_KEY, {
        user: action.payload.user,
        token: action.payload.token,
      });
    },
    updateCurrentUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        setItem(AUTH_STORAGE_KEY, {
          user: state.currentUser,
          token: state.token || "",
        });
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error = null;
      removeItem(AUTH_STORAGE_KEY);
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, updateCurrentUserProfile, logout, setAuthError } =
  authSlice.actions;

export default authSlice.reducer;
