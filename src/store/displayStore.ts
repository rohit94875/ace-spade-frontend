import { create } from 'zustand';

const STORAGE_KEY = 'ace-spade-display-prefs';

interface DisplayPrefs {
  incognitoMode: boolean;
  sortHand: boolean;
}

interface DisplayStore extends DisplayPrefs {
  setIncognitoMode: (value: boolean) => void;
  setSortHand: (value: boolean) => void;
  toggleIncognitoMode: () => void;
  toggleSortHand: () => void;
}

function loadPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { incognitoMode: false, sortHand: false };
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      incognitoMode: Boolean(parsed.incognitoMode),
      sortHand: Boolean(parsed.sortHand),
    };
  } catch {
    return { incognitoMode: false, sortHand: false };
  }
}

function savePrefs(prefs: DisplayPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const initial = loadPrefs();

export const useDisplayStore = create<DisplayStore>((set, get) => ({
  ...initial,

  setIncognitoMode: (value) => {
    savePrefs({ ...get(), incognitoMode: value });
    set({ incognitoMode: value });
  },

  setSortHand: (value) => {
    savePrefs({ ...get(), sortHand: value });
    set({ sortHand: value });
  },

  toggleIncognitoMode: () => {
    const next = !get().incognitoMode;
    savePrefs({ ...get(), incognitoMode: next });
    set({ incognitoMode: next });
  },

  toggleSortHand: () => {
    const next = !get().sortHand;
    savePrefs({ ...get(), sortHand: next });
    set({ sortHand: next });
  },
}));
