import { io, Socket } from 'socket.io-client';
import axios from 'axios';

class SocketService {
  private socket: Socket | null = null;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (socket: Socket) => void;
    reject: (error: any) => void;
  }[] = [];

  private processQueue(error: any, socket: Socket | null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (socket) {
        promise.resolve(socket);
      }
    });
    this.failedQueue = [];
  }

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
    if (this.socket?.connected) return this.socket;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3500', {
      auth: {
        token: `Bearer ${localStorage.getItem('access_token')}`,
        deviceId: localStorage.getItem('current_device_id'),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect_error', async (error) => {
      console.error('Socket connection error:', error.message);
      
      if (error.message.includes('jwt expired') || error.message.includes('Unauthorized')) {
        if (this.isRefreshing) {
          // Wait for the token refresh
          try {
            const socket = await new Promise<Socket>((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            });
            return socket;
          } catch (err) {
            console.error('Failed to refresh token:', err);
            this.disconnect();
            return;
          }
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          
          if (this.socket) {
            this.socket.auth = {
              ...this.socket.auth,
              token: `Bearer ${newToken}`,
            };
            
            await this.socket.connect();
            this.processQueue(null, this.socket);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.processQueue(refreshError, null);
          this.disconnect();
        } finally {
          this.isRefreshing = false;
        }
      }
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService(); 