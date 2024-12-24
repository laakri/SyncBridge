import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Plus, Smartphone, Monitor, QrCode, Settings, Trash2, Power, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { QRLogin } from "../components/QRLogin";
import { socketService } from "../services/socketService";
import { toast } from "react-hot-toast";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { DeviceSettingsModal } from "../components/DeviceSettingsModal";

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

interface DeviceEvent {
  deviceId: string;
  deviceName: string;
  ipAddress?: string;
}

export function DevicesPage() {
  const [showQR, setShowQR] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const currentDeviceId = localStorage.getItem('current_device_id');
  const [settingsDevice, setSettingsDevice] = useState<Device | null>(null);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/devices');
      setDevices(response.data.map((device: Device) => ({
        ...device,
        is_current: device.device_id === currentDeviceId
      })));
    } catch (error) {
      toast.error('Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    const initSocket = async () => {
      const socket = await socketService.connect();

      socket.on('device:status', (data: { deviceId: string, is_active: 'online' | 'offline', lastActive: string }) => {
        setDevices(prevDevices => prevDevices.map(device => {
          if (device.device_id === data.deviceId) {
            return {
              ...device,
              is_active: data.is_active === 'online',
              last_active: data.lastActive
            };
          }
          return device;
        }));
        
        // Show toast notification
        const device = devices.find(d => d.device_id === data.deviceId);
        if (device) {
          if (data.is_active === 'online') {
            toast.success(`${device.device_name.split(' - ')[0]} connected`);
          } else {
            toast(`${device.device_name.split(' - ')[0]} disconnected`);
          }
        }
      });

      socket.on('device:online', (device: DeviceEvent) => {
        toast.success(`${device.deviceName.split(' - ')[0]} connected`);
        fetchDevices();
      });

      socket.on('device:offline', (device: DeviceEvent) => {
        toast(`${device.deviceName.split(' - ')[0]} disconnected`);
        fetchDevices();
      });

      socket.on('device:new', (device: DeviceEvent) => {
        toast(`New device logged in: ${device.deviceName.split(' - ')[0]}`, {
          duration: 5000,
          icon: '🔔',
        });
        fetchDevices();
      });

      socket.on('device:login', (device: DeviceEvent) => {
        toast(`${device.deviceName.split(' - ')[0]} logged in from ${device.ipAddress}`, {
          duration: 4000,
        });
        fetchDevices();
      });
    };

    initSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const getDeviceIcon = (type: Device['device_type']) => {
    const iconProps = "w-6 h-6";
    switch (type) {
      case 'mobile':
        return <Smartphone className={iconProps} />;
      case 'desktop':
        return <Monitor className={iconProps} />;
      default:
        return <Laptop className={iconProps} />;
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return;
    
    try {
      await api.delete(`/devices/${deviceId}`);
      toast.success('Device removed successfully');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to remove device');
    }
  };

  const handleUpdateSettings = async (deviceId: string, settings: any) => {
    try {
      await api.put(`/devices/${deviceId}/settings`, settings);
      toast.success('Device settings updated');
      fetchDevices();
    } catch (error) {
      toast.error('Failed to update device settings');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Devices</h1>
            <p className="text-muted-foreground mt-1">
              Manage and sync your connected devices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchDevices()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/5 text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </motion.button>
          </div>
        </div>

        {/* Devices Grid */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your devices...</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <motion.div
                  key={device.device_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "relative group rounded-xl border bg-card p-6 transition-all hover:shadow-lg",
                      device.is_current && "ring-2 ring-primary",
                      selectedDevice === device.device_id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedDevice(device.device_id)}
                  >
                    {/* Device Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg transition-colors",
                          device.is_active ? "bg-primary/10" : "bg-muted"
                        )}>
                          {getDeviceIcon(device.device_type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {device.device_name.split(' - ')[0]}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {device.os_type.charAt(0).toUpperCase() + device.os_type.slice(1)} • {device.browser_type}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                        device.is_active 
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          device.is_active ? "bg-green-500" : "bg-gray-500"
                        )} />
                        {device.is_active ? 'Online' : 'Offline'}
                      </div>
                    </div>

                    {/* Device Info */}
                    <div className="grid  gap-4 mb-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Active</p>
                        <p className="font-medium">
                          {new Date(device.last_active).toLocaleString()}
                        </p>
                      </div>
                      
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {device.is_current ? (
                        <span className="text-sm text-primary font-medium">Current Device</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Added {new Date(device.created_at).toLocaleDateString()}
                        </span>
                      )}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDevice(device);
                          }}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {!device.is_current && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevice(device.device_id);
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add Device Card */}
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <button
                  onClick={() => setShowQR(true)}
                  className="h-full min-h-[250px] w-full rounded-xl border border-dashed border-muted-foreground/20 p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="p-3 rounded-lg bg-primary/10">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold mb-1">Add New Device</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan QR code to connect another device
                    </p>
                  </div>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* QR Modal */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card relative rounded-xl shadow-lg border max-w-md w-full p-6"
              >
                <button
                  onClick={() => setShowQR(false)}
                  className="absolute right-4 top-4 p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Power className="w-4 h-4 text-muted-foreground" />
                </button>
                <QRLogin />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <DeviceSettingsModal
          device={settingsDevice!}
          isOpen={!!settingsDevice}
          onClose={() => setSettingsDevice(null)}
          onUpdate={handleUpdateSettings}
        />
      </motion.div>
    </div>
  );
}
