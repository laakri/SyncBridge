import { Settings } from "lucide-react";

export function PreferenceSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="relative mx-auto p-6 pb-32 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-white/90">Preferences</h1>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6">
          {/* Add preferences content */}
          <div className="space-y-4">
            <h2 className="text-lg text-white/90">Display Settings</h2>
            {/* Add preference controls */}
          </div>
        </div>
      </div>
    </div>
  );
} 