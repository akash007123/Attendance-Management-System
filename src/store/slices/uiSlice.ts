import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getItem, setItem } from "../../utils/storage";

export type ThemeMode = "light" | "dark";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface UiState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  toasts: ToastMessage[];
}

const savedTheme = getItem<ThemeMode>("ams_theme", "light");

// Initialize root element class
if (typeof document !== "undefined") {
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const initialState: UiState = {
  theme: savedTheme,
  sidebarOpen: true,
  toasts: [],
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      setItem("ams_theme", state.theme);
      if (typeof document !== "undefined") {
        if (state.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      setItem("ams_theme", state.theme);
      if (typeof document !== "undefined") {
        if (state.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (
      state,
      action: PayloadAction<{
        type: "success" | "error" | "warning" | "info";
        message: string;
      }>
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      state.toasts.push({
        id,
        type: action.payload.type,
        message: action.payload.message,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
