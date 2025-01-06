import { Shield, Key, Smartphone, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { profileService, SecurityOverview } from "../../../services/profileService";
import { toast } from "react-hot-toast";

export function SecuritySettings() {
  const [securityData, setSecurityData] = useState<SecurityOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const data = await profileService.getSecurityOverview();
      setSecurityData(data);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="relative mx-auto p-6 pb-32 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white/90">Security Settings</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Shield className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Status */}
            <div 
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium text-white/90">Account Status</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Status</span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    securityData?.account_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {securityData?.account_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Email Verification</span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    securityData?.email_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {securityData?.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Last Login</span>
                  <span className="text-white/90">
                    {securityData?.last_login ? new Date(securityData.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Security Events */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium text-white/90">Recent Security Events</h2>
                </div>
                {(securityData?.unresolvedCount ?? 0) > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                    {securityData?.unresolvedCount} unresolved
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {securityData?.recentEvents?.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    No recent security events
                  </div>
                ) : (
                  securityData?.recentEvents.map((event) => (
                    <div key={event.id} className="p-4 bg-white/[0.02] rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white/90">{event.description}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          event.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          event.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {event.severity}
                        </span>
                      </div>
                      {event.device && (
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Smartphone className="w-4 h-4" />
                          <span>{event.device.device_name}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span>{new Date(event.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 