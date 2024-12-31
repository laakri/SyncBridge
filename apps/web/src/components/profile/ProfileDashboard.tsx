import { motion,  LayoutGroup } from "framer-motion";
import { 
  Shield, Settings, HardDrive, Smartphone, 
  ChevronRight, Bell, Key
} from "lucide-react";
import { useState, useEffect } from "react";
import { profileService, UserProfile } from "../../services/profileService";
import { cn } from "../../lib/utils";
import defaultAvatar from "../../assets/default-avatar.png";
import { useNavigate } from "@tanstack/react-router";
import { EditProfileModal } from "./EditProfileModal";

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)}GB`;
}

export function ProfileDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const data = await profileService.getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await profileService.uploadProfilePicture(file);
      await profileService.updateProfile({ profile_picture_url: url });
      await loadProfileData();
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Security Settings':
        navigate({ to: '/settings/security' });
        break;
      case 'Notifications':
        navigate({ to: '/settings/notifications' });
        break;
      case 'Devices':
        navigate({ to: '/devices' });
        break;
      case 'Preferences':
        navigate({ to: '/settings/preferences' });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Settings className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[128px]" />
      </div>

      {/* Main Content */}
      <div className="relative mx-auto p-6 pb-32 max-w-3xl">
        <LayoutGroup>
          {/* Profile Header */}
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-6">
              <div className="relative">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={isUploading}
                  />
                  <motion.div 
                    className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img 
                      src={profile?.user?.profile_picture_url || defaultAvatar}
                      alt={profile?.user?.full_name || 'Profile picture'}
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Settings className="w-6 h-6 text-white" />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </label>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <h1 className="text-2xl font-bold text-white/90">{profile?.user?.full_name}</h1>
                <p className="text-white/60">@{profile?.user?.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="px-2 py-1 bg-primary/10 rounded-full">
                    <span className="text-xs text-primary/90">{profile?.user?.subscription_tier}</span>
                  </div>
                  <div className="w-1 h-1 bg-white/20 rounded-full" />
                  <span className="text-xs text-white/40">Member since {new Date(profile?.user?.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-white/90 transition-colors"
              >
                Edit Profile
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Storage Card */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-primary" />
                  <h2 className="font-medium text-white/90">Storage</h2>
                </div>
                <span className="text-sm text-white/60">
                  {formatBytes(profile?.user?.storage_used || 0)} / {formatBytes(profile?.user?.storage_quota || 0)}
                </span>
              </div>
              <div className="relative h-2 bg-white/[0.03] rounded-full overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(profile?.user?.storage_used || 0) / (profile?.user?.storage_quota || 1) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* Security Status */}
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-medium text-white/90">Security Status</h2>
              </div>
              <div className="space-y-3">
                {profile?.security && profile.security.highSeverityCount > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                    <span className="text-sm text-red-400">High Severity Alerts</span>
                    <span className="font-medium text-red-400">{profile.security.highSeverityCount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Active Devices</span>
                  <span className="font-medium text-white/90">
                    {profile?.devices?.filter(d => d.is_active).length || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden"
          >
            {[
              { icon: Key, label: 'Security Settings', color: 'text-amber-400', description: 'Manage your account security' },
              { icon: Bell, label: 'Notifications', color: 'text-blue-400', description: 'Configure your alerts' },
              { icon: Smartphone, label: 'Devices', color: 'text-green-400', description: 'Manage connected devices' },
              { icon: Settings, label: 'Preferences', color: 'text-purple-400', description: 'Customize your experience' },
            ].map((action) => (
              <motion.button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] border-b border-white/[0.08] last:border-0 group"
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    `bg-white/[0.03] group-hover:bg-white/[0.06]`
                  )}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <span className="block text-white/90">{action.label}</span>
                    <span className="text-sm text-white/40">{action.description}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60" />
              </motion.button>
            ))}
          </motion.div>
        </LayoutGroup>
      </div>

      <EditProfileModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onUpdate={loadProfileData}
      />
    </div>
  );
} 