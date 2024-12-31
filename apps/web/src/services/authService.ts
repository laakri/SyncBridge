import { api } from "../lib/api";

export interface User {
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
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  device_id: string;
}

interface RegisterResponse {
  message: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      const deviceName = `Web Browser - ${window.navigator.userAgent}`;
      const response = await api.post<AuthResponse>("/auth/login", {
        identifier,
        password,
        deviceName: deviceName.substring(0, 255),
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message;
      const customError = new Error(message || "Login failed");
      (customError as any).type =
        message === "Please verify your email first"
          ? "VERIFY_EMAIL"
          : "AUTH_ERROR";
      throw customError;
    }
  },

  async register(data: {
    email: string;
    password: string;
    username: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await api.post<RegisterResponse>("/auth/register", data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message;
      throw new Error(
        Array.isArray(message) ? message[0] : message || "Registration failed"
      );
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await api.post("/auth/verify-email", { token });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Email verification failed";
      throw new Error(message);
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>("/auth/me");
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to get user profile";
      throw new Error(message);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
  },
};
