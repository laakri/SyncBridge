import { api } from "../lib/api";

interface QRResponse {
  qrId: string;
  qrCode: string;
}

interface QRStatus {
  status: "pending" | "authenticated" | "expired";
  tokens?: {
    access_token: string;
    refresh_token: string;
  };
  deviceId?: string;
}

interface QRAuthResponse {
  access_token: string;
  refresh_token: string;
  device_id: string;
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string;
  };
}

export const qrService = {
  async generateQR(): Promise<QRResponse> {
    const response = await api.get<QRResponse>("/auth/qr/generate");
    return response.data;
  },

  async checkStatus(qrId: string): Promise<QRStatus> {
    const response = await api.get<QRStatus>(`/auth/qr/status/${qrId}`);
    return response.data;
  },

  async authenticateQR(
    qrId: string,
    deviceInfo: {
      name: string;
      userAgent: string;
      ipAddress: string;
    }
  ): Promise<QRAuthResponse> {
    const response = await api.post<QRAuthResponse>("/auth/qr/authenticate", {
      qrId,
      deviceInfo,
    });
    return response.data;
  },
};
