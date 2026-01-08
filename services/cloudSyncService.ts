
import { Policy, UserProfile } from '../types';

/**
 * Dynamically determines the API base URL.
 * 1. Checks for manual override in localStorage (useful for separate frontend/backend hosting)
 * 2. Defaults to relative /api (useful for unified cloud deployments)
 */
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const manualUrl = localStorage.getItem('pw_bridge_url');
    if (manualUrl) return manualUrl;
  }
  return '/api';
};

export const cloudSyncService = {
  async getFullData(userId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/portfolio/${userId}`, {
        headers: { 'X-User-ID': userId },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('Sync Service: Bridge unreachable at ' + getApiBaseUrl());
      return null;
    }
  },

  async getPublicView(viewId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/portfolio/${viewId}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  async savePolicies(userId: string, policies: Policy[]): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/policies/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
        body: JSON.stringify({ policies }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/profile/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-ID': userId 
        },
        body: JSON.stringify({ profile }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async uploadFile(userId: string, file: File): Promise<{ url: string, name: string, mimeType: string } | null> {
    try {
      const baseUrl = getApiBaseUrl();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${baseUrl}/vault/upload`, {
        method: 'POST',
        headers: { 'X-User-ID': userId },
        body: formData,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  async deleteFile(userId: string, fileUrl: string): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const parts = fileUrl.split('storage.googleapis.com/')[1].split('/');
      const fileName = parts.slice(1).join('/');
      const response = await fetch(`${baseUrl}/vault/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-User-ID': userId },
        body: JSON.stringify({ fileName }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};
