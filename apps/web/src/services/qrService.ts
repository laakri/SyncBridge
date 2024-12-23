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
    deviceInfo: { name: string }
  ): Promise<void> {
    await api.post("/auth/qr/authenticate", { qrId, deviceInfo });
  },
};
