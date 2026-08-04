import { create } from 'zustand';
import { saveDocument, deleteDocument, syncCollection } from '../services/firebase/firestoreHelpers';

export type Reminder = {
  id: string;
  medicine: string;
  time: string;
  dosage: string;
  taken: boolean;
};

interface ReminderStore {
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;
  initSync: () => () => void;
}

const COLLECTION_PATH = 'users/demo_user_123/reminders';

const initialReminders: Reminder[] = [
  { id: '1', medicine: 'Metformin 500mg', time: '08:00 AM', dosage: '1 Tablet (After Food)', taken: true },
  { id: '2', medicine: 'Vitamin D3', time: '02:00 PM', dosage: '1 Capsule', taken: false },
  { id: '3', medicine: 'Metformin 500mg', time: '08:00 PM', dosage: '1 Tablet (After Food)', taken: false },
];

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: initialReminders,

  addReminder: (reminder: Reminder) => {
    saveDocument(COLLECTION_PATH, reminder);
    set((state) => ({ reminders: [...state.reminders, reminder] }));
  },

  toggleReminder: (id: string) => {
    set((state) => {
      const updated = state.reminders.map((r) => {
        if (r.id === id) {
          const toggled = { ...r, taken: !r.taken };
          saveDocument(COLLECTION_PATH, toggled);
          return toggled;
        }
        return r;
      });
      return { reminders: updated };
    });
  },

  removeReminder: (id: string) => {
    deleteDocument(COLLECTION_PATH, id);
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
  },

  initSync: () => {
    initialReminders.forEach((rem) => saveDocument(COLLECTION_PATH, rem));
    const unsubscribe = syncCollection<Reminder>(COLLECTION_PATH, (remoteReminders) => {
      if (remoteReminders.length > 0) {
        set({ reminders: remoteReminders });
      }
    });
    return unsubscribe;
  },
}));

useReminderStore.getState().initSync();
