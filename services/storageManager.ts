
import { Policy, UserProfile, User, UsageStats } from '../types';

const APP_PREFIX = 'pw_';
const CURRENT_VERSION = '1.2.0'; 

export const STORAGE_KEYS = {
  POLICIES: `${APP_PREFIX}policies`,
  PROFILE: `${APP_PREFIX}profile`,
  SCORE: `${APP_PREFIX}protection_score`,
  SESSION: `${APP_PREFIX}session`,
  VERSION: `${APP_PREFIX}data_version`,
  USERS: `${APP_PREFIX}users`,
  UNDERWRITING_USAGE: `${APP_PREFIX}underwriting_usage`
};

export const storageManager = {
  init() {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    
    if (!storedVersion) {
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      return;
    }

    if (storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    }
  },

  save<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (e) {
      console.error(`Failed to save to storage: ${key}`, e);
    }
  },

  load<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return defaultValue;
      return JSON.parse(saved) as T;
    } catch (e) {
      console.error(`Failed to load from storage: ${key}. Returning default.`, e);
      return defaultValue;
    }
  },

  getUnderwritingUsage(): UsageStats {
    const today = new Date().toISOString().split('T')[0];
    // Fix: Solely rely on storageManager reference instead of "this" to satisfy TypeScript generic constraints in object literal
    const saved = storageManager.load<UsageStats | null>(STORAGE_KEYS.UNDERWRITING_USAGE, null);
    
    if (!saved || saved.date !== today) {
      const reset = { date: today, count: 0 };
      storageManager.save(STORAGE_KEYS.UNDERWRITING_USAGE, reset);
      return reset;
    }
    return saved;
  },

  incrementUnderwritingUsage(): void {
    // Fix: Solely rely on storageManager reference instead of "this"
    const stats = storageManager.getUnderwritingUsage();
    stats.count += 1;
    storageManager.save(STORAGE_KEYS.UNDERWRITING_USAGE, stats);
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  wipeAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  getStats() {
    return {
      version: localStorage.getItem(STORAGE_KEYS.VERSION) || 'Unknown',
      size: (JSON.stringify(localStorage).length / 1024).toFixed(2) + ' KB',
      lastUpdate: new Date().toLocaleString()
    };
  }
};
