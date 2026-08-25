import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Report, UserProfile, ReportStatus, PriorityLevel, ReportCategory, UserSettings } from '../types';

export interface FilterState {
  categories: ReportCategory[];
  statuses: ReportStatus[];
  priorities: PriorityLevel[];
  searchQuery: string;
}

interface CivicReportStore {
  user: UserProfile | null;
  registeredUsers: UserProfile[];
  deletedEmails: string[];
  isGuest: boolean;
  settings: UserSettings;
  reports: Report[];
  filters: FilterState;
  selectedReport: Report | null;

  // User Actions
  setUser: (user: UserProfile | null) => void;
  registerUserAccount: (user: UserProfile) => void;
  deleteUserAccount: (email: string) => void;
  setGuest: (isGuest: boolean) => void;
  logout: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  verifyUserEmail: (email?: string) => void;
  updateSettings: (updated: Partial<UserSettings>) => void;

  // Reports Actions
  setReports: (reports: Report[]) => void;
  addReport: (newReport: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'photos_count' | 'status'> & { photos?: string[] }) => Report;
  updateReportStatus: (id: string, status: ReportStatus, comment?: string) => void;
  toggleConfirmReport: (id: string) => void;
  deleteReport: (id: string) => void;
  setSelectedReport: (report: Report | null) => void;

  // Filter Actions
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const INITIAL_FILTERS: FilterState = {
  categories: [],
  statuses: [],
  priorities: [],
  searchQuery: '',
};

const INITIAL_DEMO_REPORTS: Report[] = [];

const safeStorage = {
  getItem: (name: string) => (typeof window !== 'undefined' ? AsyncStorage.getItem(name) : Promise.resolve(null)),
  setItem: (name: string, value: string) => (typeof window !== 'undefined' ? AsyncStorage.setItem(name, value) : Promise.resolve()),
  removeItem: (name: string) => (typeof window !== 'undefined' ? AsyncStorage.removeItem(name) : Promise.resolve()),
};

export const useCivicStore = create<CivicReportStore>()(
  persist(
    (set, get) => ({
      user: null,
      registeredUsers: [],
      deletedEmails: [],
      isGuest: false,
      settings: {
        pushNotifications: true,
        emailAlerts: true,
        darkMode: false,
        language: 'EN',
      },
      reports: INITIAL_DEMO_REPORTS,
      filters: INITIAL_FILTERS,
      selectedReport: null,

      setUser: (user) => {
        if (user) {
          const lowerEmail = user.email.toLowerCase();
          set((state) => ({
            user,
            isGuest: false,
            deletedEmails: state.deletedEmails.filter((e) => e !== lowerEmail),
            registeredUsers: [
              user,
              ...state.registeredUsers.filter((u) => u.email.toLowerCase() !== lowerEmail),
            ],
          }));
        } else {
          set({ user, isGuest: false });
        }
      },

      registerUserAccount: (newUser) => {
        const lowerEmail = newUser.email.toLowerCase();
        set((state) => ({
          user: newUser,
          isGuest: false,
          deletedEmails: state.deletedEmails.filter((e) => e !== lowerEmail),
          registeredUsers: [
            newUser,
            ...state.registeredUsers.filter((u) => u.email.toLowerCase() !== lowerEmail),
          ],
        }));
      },

      deleteUserAccount: (email) => {
        const lowerEmail = email.toLowerCase();
        set((state) => ({
          user: null,
          isGuest: false,
          deletedEmails: Array.from(new Set([...state.deletedEmails, lowerEmail])),
          registeredUsers: state.registeredUsers.filter((u) => u.email.toLowerCase() !== lowerEmail),
          // Disassociate reports so public reports remain visible to all citizens
          reports: state.reports.map((r) =>
            r.user_id === state.user?.id
              ? { ...r, user_id: null, is_anonymous: true, user_full_name: 'Former Citizen' }
              : r
          ),
        }));
      },

      setGuest: (isGuest) => set({ isGuest, user: isGuest ? null : get().user }),
      logout: () => set({ user: null, isGuest: false }),

      updateProfile: (updated) =>
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...updated, updated_at: new Date().toISOString() };
          const lowerEmail = updatedUser.email.toLowerCase();
          return {
            user: updatedUser,
            registeredUsers: state.registeredUsers.map((u) =>
              u.email.toLowerCase() === lowerEmail ? updatedUser : u
            ),
          };
        }),

      verifyUserEmail: (targetEmail) =>
        set((state) => {
          const emailToVerify = (targetEmail || state.user?.email || '').toLowerCase();
          if (!emailToVerify) return state;

          const updatedRegisteredUsers = state.registeredUsers.map((u) =>
            u.email.toLowerCase() === emailToVerify ? { ...u, email_verified: true } : u
          );

          const matchedUser = updatedRegisteredUsers.find((u) => u.email.toLowerCase() === emailToVerify);

          const updatedUser =
            state.user && state.user.email.toLowerCase() === emailToVerify
              ? { ...state.user, email_verified: true }
              : (matchedUser || (state.user ? { ...state.user, email_verified: true } : null));

          return {
            user: updatedUser,
            isGuest: false,
            registeredUsers: updatedRegisteredUsers,
          };
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setReports: (reports) => set({ reports }),

      addReport: (newReportData: any) => {
        const id = newReportData.id || `cr-${Math.floor(1000 + Math.random() * 9000)}`;
        const state = get();
        const created_at = newReportData.created_at || new Date().toISOString();

        const newReport: Report = {
          ...newReportData,
          id,
          user_id: newReportData.user_id !== undefined ? newReportData.user_id : (state.user ? state.user.id : null),
          user_full_name: newReportData.is_anonymous ? 'Anonymous Citizen' : (state.user ? state.user.full_name : 'Citizen'),
          status: newReportData.status || 'submitted',
          photos_count: newReportData.photos ? newReportData.photos.length : 0,
          photos: newReportData.photos || [],
          view_count: newReportData.view_count || 1,
          confirmations_count: newReportData.confirmations_count || 0,
          has_user_confirmed: false,
          created_at,
          updated_at: newReportData.updated_at || created_at,
          updates: newReportData.updates || [],
        };

        set((s) => ({
          reports: [newReport, ...s.reports.filter((r) => r.id !== id)],
        }));
        return newReport;
      },

      updateReportStatus: (id, status, message) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== id) return r;
            const updated_at = new Date().toISOString();
            const newUpdate = message
              ? {
                  id: `upd-${Date.now()}`,
                  report_id: id,
                  status,
                  message,
                  updated_at,
                }
              : undefined;
            return {
              ...r,
              status,
              updated_at,
              updates: newUpdate ? [...(r.updates || []), newUpdate] : r.updates,
            };
          }),
        }));
      },

      toggleConfirmReport: (id) => {
        set((state) => {
          const updatedReports = state.reports.map((r) => {
            if (r.id !== id) return r;
            const currentConfirmed = Boolean(r.has_user_confirmed);
            const currentCount = r.confirmations_count || 0;
            return {
              ...r,
              has_user_confirmed: !currentConfirmed,
              confirmations_count: !currentConfirmed ? currentCount + 1 : Math.max(0, currentCount - 1),
            };
          });

          const updatedSelectedReport =
            state.selectedReport?.id === id
              ? updatedReports.find((r) => r.id === id) || null
              : state.selectedReport;

          return {
            reports: updatedReports,
            selectedReport: updatedSelectedReport,
          };
        });
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
          selectedReport: state.selectedReport?.id === id ? null : state.selectedReport,
        }));
      },

      setSelectedReport: (selectedReport) => set({ selectedReport }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: INITIAL_FILTERS }),
    }),
    {
      name: 'civicreport-storage-v3',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
