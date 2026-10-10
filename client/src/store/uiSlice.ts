import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Link } from '@/types';

export type StatusFilter = '' | 'active' | 'disabled' | 'expired';

/** Browser-owned UI state: table filters, row selection and modals. Never holds API data copies (except the row being edited). */
interface UiState {
  filters: { search: string; tag: string; status: StatusFilter; page: number };
  selectedIds: number[];
  createOpen: boolean;
  bulkOpen: boolean;
  editing: Link | null;
  qrFor: Link | null;
}

const initialState: UiState = {
  filters: { search: '', tag: '', status: '', page: 1 },
  selectedIds: [],
  createOpen: false,
  bulkOpen: false,
  editing: null,
  qrFor: null,
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFilters(state, a: PayloadAction<Partial<UiState['filters']>>) {
      const resetsPage = Object.keys(a.payload).some((k) => k !== 'page');
      state.filters = { ...state.filters, ...a.payload, ...(resetsPage ? { page: a.payload.page ?? 1 } : {}) };
      state.selectedIds = [];
    },
    toggleSelected(state, a: PayloadAction<number>) {
      const i = state.selectedIds.indexOf(a.payload);
      if (i >= 0) state.selectedIds.splice(i, 1);
      else state.selectedIds.push(a.payload);
    },
    setSelected(state, a: PayloadAction<number[]>) { state.selectedIds = a.payload; },
    clearSelected(state) { state.selectedIds = []; },
    openCreate(state) { state.createOpen = true; state.editing = null; },
    openEdit(state, a: PayloadAction<Link>) { state.editing = a.payload; state.createOpen = true; },
    closeCreate(state) { state.createOpen = false; state.editing = null; },
    setBulkOpen(state, a: PayloadAction<boolean>) { state.bulkOpen = a.payload; },
    setQrFor(state, a: PayloadAction<Link | null>) { state.qrFor = a.payload; },
  },
});

export const {
  setFilters, toggleSelected, setSelected, clearSelected,
  openCreate, openEdit, closeCreate, setBulkOpen, setQrFor,
} = slice.actions;
export default slice.reducer;
