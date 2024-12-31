import { api } from "../lib/api";

export interface ProfileStats {
  accountStatus: 'active' | 'suspended' | 'deactivated';
  subscriptionTier: 'free' | 'premium' | 'business';
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  activeDevices: number;
  totalDevices: number;
  totalSyncs: number;
  memberSince: string;
  lastLogin: string;
}

export interface SecurityOverview {
  email_verified: boolean;
  account_status: string;
  last_login: string;
  recentEvents: Array<{
    id: string;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    created_at: string;
    device: {
      device_name: string;
      device_type: string;
    };
  }>;
  highSeverityCount: number;
  unresolvedCount: number;
}

export interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  preferred_language?: string;
  timezone?: string;
  profile_picture_url?: string;
}

export interface UserProfile {
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string | null;
    profile_picture_url?: string;
    created_at: string;
    last_login: string;
    email_verified: boolean;
    subscription_tier: 'free' | 'premium' | 'business';
    account_status: 'active' | 'suspended' | 'deactivated';
    preferred_language: string;
    timezone: string | null;
    storage_quota: number;
    storage_used: number;
  };
  security: SecurityOverview;
  devices: Array<{
    id: string;
    name: string;
    type: string;
    last_active: string;
    is_current: boolean;
    is_active: boolean;
  }>;
}

export const profileService = {
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<UserProfile>('/profile');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  async getProfileStats(): Promise<ProfileStats> {
    try {
      const response = await api.get<ProfileStats>('/profile/stats');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch profile stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile statistics');
    }
  },

  async getSecurityOverview(): Promise<SecurityOverview> {
    try {
      const response = await api.get<SecurityOverview>('/profile/security');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch security overview:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch security overview');
    }
  },

  async updateProfile(updates: ProfileUpdateData): Promise<void> {
    try {
      await api.patch('/profile', updates);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<{ url: string }>('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload profile picture');
    }
  },

  async getDevices(): Promise<Array<{
    device_id: string;
    device_name: string;
    device_type: string;
    os_type: string;
    browser_type: string;
    is_active: boolean;
    last_active: string;
  }>> {
    try {
      const response = await api.get('/profile/devices');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch devices:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch devices');
    }
  },

  async removeDevice(deviceId: string): Promise<void> {
    try {
      await api.delete(`/profile/devices/${deviceId}`);
    } catch (error: any) {
      console.error('Failed to remove device:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove device');
    }
  }
}; 