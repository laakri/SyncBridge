import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  Clipboard, Book, File, StickyNote,  Clock, 
   Star, Smartphone, Laptop,
  Command, Zap, Share2, X, ArrowRight, Bookmark
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { contentDetectorService } from "../../services/contentDetectorService";
import { FileUpload } from './FileUpload';
import { useNavigate } from "@tanstack/react-router";

interface DetectedContent {
  type: 'clipboard' | 'reading' | 'file' | 'note';
  confidence: number;
  metadata?: {
    title?: string;
    size?: number;
    format?: string;
    preview?: string;
    url?: string;
    path?: string;
    wordCount?: number;
    readingTime?: number;
  };
}

interface SyncItem {
  id: string;
  type: 'clipboard' | 'reading' | 'file' | 'note';
  content: string;
  timestamp: Date;
  deviceFrom?: string;
  deviceTo?: string;
}

export function SyncDashboard() {
  const [activeTab, setActiveTab] = useState<SyncItem['type']>('clipboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedContent, setDetectedContent] = useState<DetectedContent | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsDetecting(true);
    
    // Detect content type
    const detected = contentDetectorService.detect(value);
    console.log('Detected content:', detected);
    setDetectedContent(detected);
    
    // Auto-switch to detected type if confidence is high
    if (detected.confidence > 0.8) {
      setActiveTab(detected.type);
    }
    
    setTimeout(() => setIsDetecting(false), 800);
  };

  const handleSync = () => {
    if (!searchQuery.trim()) return;

    // Validate content based on active type
    if (!contentDetectorService.validateContent(activeTab, searchQuery)) {
      console.error('Invalid content for type:', activeTab);
      return;
    }

    // Log the sync action (to be replaced with actual service call)
    console.log('Syncing:', {
      type: activeTab,
      content: searchQuery,
      metadata: detectedContent?.metadata,
      timestamp: new Date(),
      deviceFrom: 'Current Device',
      deviceTo: 'All Devices'
    });

    // Clear input after sync
    setSearchQuery('');
    setDetectedContent(null);
  };

  const handleFileSelect = (file: File) => {
    console.log('Selected file:', file);
    setSearchQuery(file.name);
    setActiveTab('file');
    setShowFileUpload(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* File Upload Modal */}
      <AnimatePresence>
        {showFileUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowFileUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white/90">Upload File</h3>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              
              <FileUpload onFileSelect={handleFileSelect} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area with Blur Overlay */}
      <div className="relative">
        {/* Ambient Background */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[128px]" />
        </div>

        {/* Main Content */}
        <div className="relative mx-auto p-6 pb-32 max-w-3xl">
          <LayoutGroup>
            {/* Device Connection Status with View All Button */}
            <motion.div layout className="mb-6">
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/[0.07] border border-primary/[0.15]">
                      <Smartphone className="w-5 h-5 text-primary/90" />
                    </div>
                    <div>
                      <p className="font-medium text-white/90">iPhone 14 Pro</p>
                      <p className="text-xs text-white/50">Connected • Last sync 2m ago</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate({ to: "/devices" })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors group"
                  >
                    <span className="text-sm text-white/70 group-hover:text-white/90">All Devices</span>
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div layout className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Clips', count: 12, icon: Clipboard },
                { label: 'Files', count: 8, icon: File },
                { label: 'Notes', count: 4, icon: StickyNote },
              ].map(({ label, count, icon: Icon }) => (
                <div key={label} className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4">
                  <Icon className="w-4 h-4 text-primary/80 mb-2" />
                  <p className="text-2xl font-semibold text-white/90">{count}</p>
                  <p className="text-xs text-white/50">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* Reading List Section */}
            <motion.div layout className="mb-6">
              <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-emerald-400/80" />
                    <h2 className="text-sm font-medium text-white/70">Reading List</h2>
                  </div>
                  <button className="text-xs text-primary/80 hover:text-primary">View All</button>
                </div>
                <div className="space-y-3">
                  {[1, 2].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      layout
                      className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] rounded-lg p-3 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                          <Book className="w-5 h-5 text-emerald-400/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white/90 truncate">
                            How to Build a Better Design System
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            5 min read • Added 2h ago
                          </p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star className="w-4 h-4 text-amber-400/80" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent Syncs */}
            <motion.div layout className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/70">Recent Syncs</h2>
                <button className="text-xs text-primary/80 hover:text-primary">View All</button>
              </div>
              <AnimatePresence mode="popLayout">
                {[1, 2, 3].map((_, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/[0.07] border border-primary/[0.15]">
                        <Clipboard className="w-4 h-4 text-primary/90" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white/90 truncate">
                          Recent clipboard content...
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          2m ago • iPhone → MacBook
                        </p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Star className="w-4 h-4 text-primary/80" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </div>
      </div>

      {/* Command Bar - iOS 16 Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 inset-x-0 mx-auto max-w-3xl px-6 z-50"
      >
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-lg shadow-black/10">
          {/* Main Input */}
          <div className="flex items-center gap-3 p-4">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.05] rounded-lg border border-white/[0.08] shadow-sm">
              <Command className="w-3 h-3 text-white/40" />
              <span className="text-[10px] font-medium text-white/40 tracking-wide">K</span>
            </div>

            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-transparent text-[15px] text-white/90 placeholder:text-white/40 focus:outline-none"
                placeholder={`${activeTab === 'clipboard' ? 'Paste' : activeTab === 'reading' ? 'Enter URL' : activeTab === 'file' ? 'Enter file path' : 'Type note'}`}
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
              />
              <AnimatePresence mode="wait">
                {isDetecting ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-2 top-1.5 -translate-y-1/2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="w-4 h-4 text-primary/80" />
                    </motion.div>
                  </motion.div>
                ) : (
                  searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={handleSync}
                      className="absolute right-2 top-1.5 -translate-y-1/2 p-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      <Zap className="w-4 h-4 text-primary" />
                    </motion.button>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-white/[0.08]">
            <div className="flex items-center justify-around px-2 py-3">
              {[
                { type: 'clipboard', icon: Clipboard, label: 'Paste', color: 'text-blue-400' },
                { type: 'reading', icon: Book, label: 'Read', color: 'text-emerald-400' },
                { type: 'file', icon: File, label: 'Share', color: 'text-violet-400' },
                { type: 'note', icon: StickyNote, label: 'Note', color: 'text-amber-400' },
              ].map(({ type, icon: Icon, label, color }) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(type as SyncItem['type']);
                    if (type === 'file') {
                      setShowFileUpload(true);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-300 relative group",
                    activeTab === type 
                      ? "text-white" 
                      : "text-white/60 hover:text-white/90"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    activeTab === type 
                      ? `${color} bg-white/10` 
                      : "text-white/60 group-hover:text-white/90 group-hover:bg-white/[0.05]"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium tracking-wide">{label}</span>
                  {activeTab === type && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-3 w-1 h-1 rounded-full bg-white"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 