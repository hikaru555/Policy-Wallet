
import { Policy, UserProfile, PolicyDocument } from '../types';

/**
 * Service to interact with Cloud SQL (PostgreSQL) and Cloud Storage
 * Assumes a backend API is running to bridge the frontend to the DB/Bucket
 */
const API_BASE_URL = '/api'; // Change this to your deployed backend URL

export const cloudSyncService = {
  /**
   * Sync policies to Cloud SQL
   */
  async savePolicies(userId: string, policies: Policy[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, policies }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to sync policies to Cloud SQL', error);
      return false;
    }
  },

  /**
   * Fetch policies from Cloud SQL
   */
  async getPolicies(userId: string): Promise<Policy[] | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/policies/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch from Cloud SQL', error);
      return null;
    }
  },

  /**
   * Sync profile to Cloud SQL
   */
  async saveProfile(userId: string, profile: UserProfile): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile }),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to sync profile', error);
      return false;
    }
  },

  /**
   * Upload file to Cloud Storage Bucket
   */
  async uploadToBucket(userId: string, policyId: string, file: File, category: string): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('policyId', policyId);
    formData.append('category', category);

    try {
      const response = await fetch(`${API_BASE_URL}/vault/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.publicUrl; // Returns the gs:// or https:// storage URL
    } catch (error) {
      console.error('Cloud Storage upload failed', error);
      return null;
    }
  },

  /**
   * Delete from Cloud Storage
   */
  async deleteFromBucket(fileUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/vault/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl }),
      });
      return response.ok;
    } catch (error) {
      console.error('Delete from bucket failed', error);
      return false;
    }
  }
};
