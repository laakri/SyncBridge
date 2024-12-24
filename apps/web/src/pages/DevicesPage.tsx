import { motion } from "framer-motion";
import { Laptop, Plus, Smartphone, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { QRLogin } from "../components/QRLogin";
import { socketService } from "../services/socketService";
import { toast } from "react-hot-toast";
import { api } from "../lib/api";

interface Device {
  device_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'other';
  last_active: string;
  is_current: boolean;
}

interface DeviceEvent {
  deviceId: string;
  deviceName: string;
}

export function DevicesPage() {
  const [showQR, setShowQR] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const currentDeviceId = localStorage.getItem('current_device_id');

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data.map((device: Device) => ({
        ...device,
        is_current: device.device_id === currentDeviceId
      })));
    } catch (error) {
      toast.error('Failed to fetch devices');
    }
  };

  useEffect(() => {
    fetchDevices();
    
    const initSocket = async () => {
      const socket = await socketService.connect();

      socket.on('device:online', (device: DeviceEvent) => {
        toast.success(`${device.deviceName} connected`);
        fetchDevices(); // Refresh devices list
      });

      socket.on('device:offline', (device: DeviceEvent) => {
        toast(`${device.deviceName} disconnected`);
        fetchDevices(); // Refresh devices list
      });
    };

    initSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const getDeviceIcon = (type: Device['device_type']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-8 h-8 text-primary" />;
      case 'desktop':
        return <Monitor className="w-8 h-8 text-primary" />;
      default:
        return <Laptop className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Your Devices</h1>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {/* Devices List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className={`bg-card p-4 rounded-lg border ${
                device.device_id === currentDeviceId
                  ? 'border-primary'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {getDeviceIcon(device.device_type)}
                <div>
                  <h3 className="font-medium">
                    {device.device_name}
                    {device.device_id === currentDeviceId && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Current Device
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Last active: {new Date(device.last_active).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* QR Modal */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-card rounded-xl p-6 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              <QRLogin />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
