import { motion } from "framer-motion";
import { X } from "lucide-react";



interface Device {
    device_id: string;
    device_name: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'other';
    last_active: string;
    is_current: boolean;
    auto_sync: boolean;
    browser_type?: string;
    created_at: string;
    device_settings: Record<string, any>;
    device_token: string;
    is_active: boolean;
    last_ip_address: string;
    os_type: string;
    sync_enabled: boolean;
    sync_interval: number;
    updated_at: string;
    user_id: string;
    is_connected: boolean;
  }
  
interface DeviceSettingsModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (deviceId: string, settings: any) => Promise<void>;
}

export function DeviceSettingsModal({
  device,
  isOpen,
  onClose,
  onUpdate,
}: DeviceSettingsModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const settings = {
      device_name: formData.get('device_name'),
      sync_enabled: formData.get('sync_enabled') === 'true',
      auto_sync: formData.get('auto_sync') === 'true',
      sync_interval: Number(formData.get('sync_interval')),
    };
    
    await onUpdate(device.device_id, settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card relative rounded-xl shadow-lg border max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Device Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Device Name
            </label>
            <input
              type="text"
              name="device_name"
              defaultValue={device.device_name}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Sync Enabled</label>
                <p className="text-sm text-muted-foreground">
                  Allow this device to sync with others
                </p>
              </div>
              <input
                type="checkbox"
                name="sync_enabled"
                defaultChecked={device.sync_enabled}
                value="true"
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Auto Sync</label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync changes
                </p>
              </div>
              <input
                type="checkbox"
                name="auto_sync"
                defaultChecked={device.auto_sync}
                value="true"
                className="h-4 w-4"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Sync Interval (seconds)
              </label>
              <input
                type="number"
                name="sync_interval"
                defaultValue={device.sync_interval}
                min="60"
                max="3600"
                className="w-full px-3 py-2 rounded-lg border bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-primary/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 