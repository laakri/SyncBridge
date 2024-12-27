import { io, Socket } from 'socket.io-client';
import axios from 'axios';

class SocketService {
  private socket: Socket | null = null;
  private isRefreshing = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  private async refreshToken() {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      const device_id = localStorage.getItem('current_device_id');

      if (!refresh_token || !device_id) {
        throw new Error('Missing authentication tokens');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
        {},
        {
          headers: {
            'refresh-token': refresh_token,
            'device-id': device_id,
          },
        }
      );

      const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);

      return newAccessToken;
    } catch (error) {
      localStorage.clear();
      window.location.href = '/auth';
      throw error;
    }
  }

  async connect() {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected, reusing connection');
      return this.socket;
    }

    const token = localStorage.getItem('access_token');
    const deviceId = localStorage.getItem('current_device_id');

    console.log('[Socket] Connecting with:', { 
      hasToken: !!token, 
      deviceId 
    });

    if (!token || !deviceId) {
      if (localStorage.getItem('refresh_token')) {
        try {
          const newToken = await this.refreshToken();
          return this.createSocketConnection(newToken, deviceId!);
        } catch (error) {
          console.error('[Socket] Token refresh failed:', error);
          throw error;
        }
      }
      throw new Error('No authentication tokens found');
    }

    return this.createSocketConnection(token, deviceId);
  }

  private createSocketConnection(token: string, deviceId: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3500';
    console.log('[Socket] Creating connection to:', wsUrl);

    this.socket = io(wsUrl, {
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
      auth: {
        token: `Bearer ${token}`,
        deviceId
      },
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Credentials': 'true',
      }
    });

    return new Promise<Socket>((resolve, reject) => {
      if (!this.socket) return reject('Socket not initialized');

      this.socket.on('connect', () => {
        console.log('[Socket] Connected successfully');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', async (error) => {
        console.error('[Socket] Connection error:', error.message);
        
        if (error.message.includes('Unauthorized') && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          try {
            console.log('[Socket] Attempting token refresh...');
            const newToken = await this.refreshToken();
            this.socket?.disconnect();
            resolve(await this.createSocketConnection(newToken, deviceId));
          } catch (refreshError) {
            reject(refreshError);
          }
        } else {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        if (reason === 'io server disconnect') {
          this.socket?.connect();
        }
      });

      this.socket.on('error', (error) => {
        console.error('[Socket] Transport error:', error);
      });

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.log('[Socket] Connection timeout, falling back to polling');
          this.socket.disconnect();
          this.socket.connect();
        }
      }, 5000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService(); 