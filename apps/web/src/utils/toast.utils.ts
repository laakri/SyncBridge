import { toast } from 'react-hot-toast';
import { ContentType } from '../types/sync';

export const syncToast = {
  success: {
    created: (type: ContentType) => toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} synced successfully!`,
      { duration: 3000 }
    ),
    received: (type: ContentType, deviceName?: string) => toast.success(
      `New ${type} received${deviceName ? ` from ${deviceName}` : ''}`,
      { duration: 4000 }
    )
  },
  error: {
    validation: (message: string) => toast.error(
      `Validation failed: ${message}`,
      { duration: 4000 }
    ),
    connection: () => toast.error(
      'Connection lost. Trying to reconnect...',
      { duration: 5000 }
    ),
    sync: (error: string) => toast.error(
      `Sync failed: ${error}`,
      { duration: 4000 }
    )
  },
  connection: {
    connected: () => toast.success(
      '🔌 Connected to sync service',
      { duration: 3000, icon: '🟢' }
    ),
    disconnected: () => toast.error(
      '🔌 Disconnected from sync service',
      { duration: 3000, icon: '🔴' }
    ),
    reconnecting: () => toast.loading(
      '🔄 Reconnecting to sync service...',
      { duration: 3000 }
    )
  }
}; 