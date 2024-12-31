import { Bell } from "lucide-react";

export function NotificationSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="relative mx-auto p-6 pb-32 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white/90">Notification Settings</h1>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6">
          {/* Add notification settings content */}
          <div className="space-y-4">
            <h2 className="text-lg text-white/90">Email Notifications</h2>
            {/* Add notification toggles */}
          </div>
        </div>
      </div>
    </div>
  );
} 