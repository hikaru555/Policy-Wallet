
import { Policy, UserProfile } from '../types';

// Using relative path ensures it works whether hosted on the same domain or proxied
const API_BASE_URL = '/api';

export const cloudSyncService = {
  async getFullData(userId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${userId}`, {
        headers: { 'X-User-ID': userId }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn('Sync Service: Bridge unreachable.');
      return null;
    }
  },

  async getPublicView(viewId: string): Promise<{ policies: Policy[], profile: UserProfile } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/${viewId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

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
      return false;
    }
  },

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
      return false;
    }
  },

  async uploadFile(userId: string, file: File): Promise<{ url: string, name: string, mimeType: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/vault/upload`, {
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
      const parts = fileUrl.split('storage.googleapis.com/')[1].split('/');
      const fileName = parts.slice(1).join('/');
      const response = await fetch(`${API_BASE_URL}/vault/delete`, {
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
