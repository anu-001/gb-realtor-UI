import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ViewMode = "grid" | "list" | "map";

export interface UiState {
  sidebarOpen: boolean;
  viewMode: ViewMode;
  activeModal: string | null;
  recentlyViewedIds: string[];
}

const initialState: UiState = {
  sidebarOpen: false,
  viewMode: "grid",
  activeModal: null,
  recentlyViewedIds: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    addRecentlyViewed(state, action: PayloadAction<string>) {
      state.recentlyViewedIds = [action.payload, ...state.recentlyViewedIds.filter((id) => id !== action.payload)].slice(0, 20);
    },
    clearRecentlyViewed(state) {
      state.recentlyViewedIds = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setViewMode,
  openModal,
  closeModal,
  addRecentlyViewed,
  clearRecentlyViewed,
} = uiSlice.actions;

export default uiSlice.reducer;
