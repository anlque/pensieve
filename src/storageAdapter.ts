type ChromeStorageArea = {
  get: (keys: string | string[]) => Promise<Record<string, unknown>>;
  remove: (keys: string | string[]) => Promise<void>;
  set: (items: Record<string, unknown>) => Promise<void>;
};

type ChromeRuntime = {
  id?: string;
};

type ChromeGlobal = typeof globalThis & {
  chrome?: {
    runtime?: ChromeRuntime;
    storage?: {
      local?: ChromeStorageArea;
    };
  };
};

export type AppStorage = {
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

const createLocalStorageAdapter = (): AppStorage => ({
  getItem: async (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  removeItem: async (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is optional; the in-memory app can continue.
    }
  },
  setItem: async (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage is optional; the in-memory app can continue.
    }
  },
});

const createChromeStorageAdapter = (storage: ChromeStorageArea): AppStorage => ({
  getItem: async (key) => {
    try {
      const result = await storage.get(key);
      const value = result[key];
      return typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  },
  removeItem: async (key) => {
    try {
      await storage.remove(key);
    } catch {
      // Storage is optional; the in-memory app can continue.
    }
  },
  setItem: async (key, value) => {
    try {
      await storage.set({ [key]: value });
    } catch {
      // Storage is optional; the in-memory app can continue.
    }
  },
});

const getChromeStorage = () => {
  const chromeGlobal = globalThis as ChromeGlobal;

  if (!chromeGlobal.chrome?.runtime?.id) {
    return null;
  }

  return chromeGlobal.chrome.storage?.local ?? null;
};

const chromeStorage = getChromeStorage();

export const appStorage = chromeStorage
  ? createChromeStorageAdapter(chromeStorage)
  : createLocalStorageAdapter();
