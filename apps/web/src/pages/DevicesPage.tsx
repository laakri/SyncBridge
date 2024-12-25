import { motion, AnimatePresence } from "framer-motion";
import { 
  Laptop, Plus, Smartphone, Monitor, QrCode, Settings, 
  Trash2, Power, RefreshCw, Shield, Signal, Globe, 
  CheckCircle2, Clock, 
} from "lucide-react";
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
    <div className="container mx-auto p-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium tracking-tight text-white/90">Your Devices</h1>
          <p className="text-sm text-white/50">
            Manage and sync your connected devices
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: "Protected", value: devices.length },
            { icon: Signal, label: "Active", value: devices.filter(d => d.is_active).length },
            { icon: Globe, label: "Network", value: "Online" }
          ].map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40">{label}</p>
                  <p className="text-sm font-medium text-white/80">{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Devices List */}
        <div className="space-y-3">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-12"
            >
              <RefreshCw className="w-5 h-5 animate-spin text-white/40" />
            </motion.div>
          ) : (
            <>
              {devices.map((device) => (
                <motion.div
                  key={device.device_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "group relative rounded-2xl border bg-white/[0.02] backdrop-blur-xl p-5 transition-all duration-300",
                    device.is_current 
                      ? "ring-1 ring-primary/20 shadow-[0_0_30px_-10px] shadow-primary/10" 
                      : "hover:bg-white/[0.04]",
                    selectedDevice === device.device_id && "ring-1 ring-primary/20"
                  )}
                  onClick={() => setSelectedDevice(device.device_id)}
                >
                  <div className="space-y-4">
                    {/* Device Header */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors duration-300",
                        device.is_active 
                          ? "bg-primary/5 border border-primary/10" 
                          : "bg-white/[0.03] border border-white/[0.08]"
                      )}>
                        {getDeviceIcon(device.device_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white/90 truncate">
                            {device.device_name.split(' - ')[0]}
                          </h3>
                          {device.is_current && (
                            <span className="text-xs text-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                              Current Device
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-white/40">
                            {device.os_type.charAt(0).toUpperCase() + device.os_type.slice(1)} • {device.browser_type}
                          </p>
                          <span className="text-white/20">•</span>
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              device.is_active ? "bg-emerald-400" : "bg-white/20"
                            )} />
                            <span className="text-xs text-white/40">
                              {device.is_active ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsDevice(device);
                          }}
                          className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-white/60" />
                        </motion.button>
                        {!device.is_current && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDevice(device.device_id);
                            }}
                            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white/40" />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Device Details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-white/30" />
                          <div>
                            <p className="text-xs text-white/40">Last Active</p>
                            <p className="text-xs font-medium text-white/60">
                              {new Date(device.last_active).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-white/30" />
                          <div>
                            <p className="text-xs text-white/40">IP Address</p>
                            <p className="text-xs font-medium text-white/60">
                              {device.last_ip_address}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Signal className="w-3.5 h-3.5 text-white/30" />
                          <div>
                            <p className="text-xs text-white/40">Sync Status</p>
                            <p className="text-xs font-medium text-white/60">
                              {device.sync_enabled ? 'Auto-sync enabled' : 'Manual sync'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-white/30" />
                          <div>
                            <p className="text-xs text-white/40">Added On</p>
                            <p className="text-xs font-medium text-white/60">
                              {new Date(device.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add Device Button - Softer Style */}
              <motion.button
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setShowQR(true)}
                className="w-full p-5 rounded-2xl border border-dashed border-white/[0.08] flex items-center justify-center gap-2 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300"
              >
                <Plus className="w-4 h-4 text-primary/60" />
                <span className="text-sm text-white/60">Add New Device</span>
              </motion.button>
            </>
          )}
        </div>

        {/* Keep existing modals with updated styling */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/[0.03] backdrop-blur-2xl relative rounded-xl shadow-lg border border-white/[0.08] max-w-md w-full p-6"
              >
                <QRLogin />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
