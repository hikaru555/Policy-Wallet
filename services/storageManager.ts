
import { Policy, UserProfile, User } from '../types';

const APP_PREFIX = 'pw_';
const CURRENT_VERSION = '1.1.0'; // Increment this when changing data schemas

export const STORAGE_KEYS = {
  POLICIES: `${APP_PREFIX}policies`,
  PROFILE: `${APP_PREFIX}profile`,
  SCORE: `${APP_PREFIX}protection_score`,
  SESSION: `${APP_PREFIX}session`,
  VERSION: `${APP_PREFIX}data_version`,
  USERS: `${APP_PREFIX}users`
};

export const storageManager = {
  /**
   * Initializes storage and handles version migrations if necessary
   */
  init() {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    
    if (!storedVersion) {
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      return;
    }

    if (storedVersion !== CURRENT_VERSION) {
      console.log(`Migrating data from ${storedVersion} to ${CURRENT_VERSION}`);
      // Migration logic would go here if fields in Policy or Profile change
      // For now, we just update the version tag
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
