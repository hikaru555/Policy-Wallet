
import { Policy, UserProfile } from '../types';

/**
 * Service to interact with Cloud SQL (PostgreSQL) bridge
 */
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:8080/api' 
  : '/api'; 

export const cloudSyncService = {
  /**
   * Fetch all portfolio data (Policies + Profile) in one call
   */
  async getFullData(userId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${userId}`, {
        headers: { 'X-User-ID': userId }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('Cloud SQL Fetch failed - check network or server status');
      return null;
    }
  },

  /**
   * Sync policies to Cloud SQL
   */
  async savePolicies(userId: string, policies: Policy[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
        body: JSON.stringify({ policies }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to sync policies', error);
      return false;
    }
  },

  /**
   * Sync profile to Cloud SQL
   */
  async saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
        body: JSON.stringify({ profile }),
      });
      return response.ok;
    } catch (error) {
      console.error('Profile sync failed', error);
      return false;
    }
  },

  /**
   * Fetch Public View Summary (Unauthenticated sharing)
   */
  async getPublicView(userId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/public/view/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Public view fetch failed', error);
      return null;
    }
  }
};
