import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  Clipboard, Book, File, StickyNote, Clock, 
  Star, Smartphone, 
  Command, Zap, X, ArrowRight, 
  InboxIcon,
  Monitor,
  Laptop
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { contentDetectorService } from "../../services/contentDetectorService";
import { FileUpload } from './FileUpload';
import { useNavigate } from "@tanstack/react-router";
import { socketService } from "../../services/socketService";
import { Socket } from "socket.io-client";
import { syncToast } from "../../utils/toast.utils";
import { validateSync } from "../../utils/validation.utils";
import { ContentType, SyncItem } from "../../types/sync";
import { Device } from "../../types/device";
import { SyncItem as SyncItemComponent } from './SyncItem';

export function SyncDashboard() {
  const [activeTab, setActiveTab] = useState<ContentType>('clipboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<SyncItem[]>([]);
  const [favorites, setFavorites] = useState<SyncItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const socketInstance = await socketService.connect();
        setSocket(socketInstance);
        syncToast.connection.connected();

        // Listen for initial data
        socketInstance.on('init:data', (data) => {
          console.log('Received initial data:', {
            stats: data.stats,
            devices: data.devices,
            currentDevice: data.currentDevice
          });
          setStats(data.stats);
          setCurrentDevice(data.currentDevice);
        });

        // Listen for batch sync data
        socketInstance.on('sync:batch', (data) => {
          console.log('[Dashboard] Received sync batch:', data);
          if (!data) return;
          
          // Update stats if provided
          if (data.stats) {
            setStats(data.stats);
          }

          // Transform recent syncs
          if (data.recent) {
            const transformedRecents = data.recent.map((sync: { 
              sync_id: string;
              content_type: string;
              content: {
                value: string;
                timestamp: string;
              };
              source_device_id: string;
              metadata?: Record<string, any>;
              is_favorite?: boolean;
            }) => ({
              id: sync.sync_id,
              type: sync.content_type as ContentType,
              content: sync.content.value,
              timestamp: new Date(sync.content.timestamp),
              deviceFrom: sync.source_device_id,
              metadata: sync.metadata,
              isFavorite: sync.is_favorite || false
            }));
            setRecentSyncs(transformedRecents);
          }

          // Transform favorites
          if (data.favorites) {
            const transformedFavorites = data.favorites.map((sync: { 
              sync_id: string;
              content_type: string;
              content: {
                value: string;
                timestamp: string;
              };
              source_device_id: string;
              metadata?: Record<string, any>;
              is_favorite?: boolean;
            }) => ({
              id: sync.sync_id,
              type: sync.content_type as ContentType,
              content: sync.content.value,
              timestamp: new Date(sync.content.timestamp),
              deviceFrom: sync.source_device_id,
              metadata: sync.metadata,
              isFavorite: true
            }));
            setFavorites(transformedFavorites);
          }
        });

        // Listen for new syncs
        socketInstance.on('sync:data', (data) => {
          console.log('Received new sync:', data);
          if (!data?.content_type) return;
          
          const newSync: SyncItem = {
            id: data.sync_id,
            type: data.content_type as ContentType,
            content: data.content.value,
            timestamp: new Date(data.content.timestamp),
            deviceFrom: data.source_device_id,
            metadata: data.metadata
          };

          // Update stats
          setStats(prev => ({
            ...prev,
            [data.content_type]: Number(prev[data.content_type] || 0) + 1
          }));

          // Update recent syncs or notes based on type
          if (data.content_type === 'note') {
            setFavorites(prev => [newSync, ...prev].slice(0, 5));
          } else {
            setRecentSyncs(prev => [newSync, ...prev].slice(0, 10));
          }
        });

        // Request initial syncs (get all types)
        console.log('[Dashboard] Requesting initial syncs...');
        socketInstance.emit('sync:request', { limit: 10 });

        // Handle favorite toggle updates
        socketInstance.on('sync:favorite-updated', (data) => {
          const { syncId, isFavorite } = data;
          
          // Update recent syncs
          setRecentSyncs(prev => prev.map(sync => 
            sync.id === syncId ? { ...sync, isFavorite } : sync
          ));
          
          // Update favorites list
          if (isFavorite) {
            const sync = recentSyncs.find(s => s.id === syncId);
            if (sync) {
              setFavorites(prev => [{ ...sync, isFavorite: true }, ...prev].slice(0, 5));
            }
          } else {
            setFavorites(prev => prev.filter(s => s.id !== syncId));
          }
        });

        // Handle favorites list updates
        socketInstance.on('sync:favorites-updated', (data) => {
          console.log('[Dashboard] Favorites list updated:', data);
          setFavorites(data);
        });

      } catch (error) {
        console.error('[Dashboard] Socket connection error:', error);
        syncToast.error.connection();
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.off('init:data');
        socket.off('sync:batch');
        socket.off('sync:data');
        socket.disconnect();
      }
    };
  }, []);
  const getDeviceIcon = (type: Device['device_type'] | undefined) => {
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
  const handleSync = () => {
    if (!searchQuery.trim() || !socket) return;

    const validation = validateSync(activeTab, searchQuery);
    if (!validation.isValid) {
      syncToast.error.validation(validation.error!);
      return;
    }

    console.log('Emitting sync:', {
      content: searchQuery,
      content_type: activeTab,
      metadata: contentDetectorService.detect(searchQuery).metadata
    });

    socket.emit('sync:create', {
      content: searchQuery,
      content_type: activeTab,
      metadata: contentDetectorService.detect(searchQuery).metadata,
    });

    syncToast.success.created(activeTab);
    setSearchQuery('');
  };

  const handleFileSelect = async (file: File) => {
    if (!socket) return;

    const validation = validateSync('file', file);
    if (!validation.isValid) {
      syncToast.error.validation(validation.error!);
      return;
    }

    // Convert file to base64 or handle it according to your backend requirements
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('sync:create', {
        content: reader.result as string,
        content_type: 'file',
        metadata: {
          filename: file.name,
          size: file.size,
          type: file.type
        }
      });
      syncToast.success.created('file');
    };
    reader.readAsDataURL(file);
    setShowFileUpload(false);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setIsDetecting(true);

    // Debounce the detection
    const timer = setTimeout(() => {
      setIsDetecting(false);
    }, 500);

    return () => clearTimeout(timer);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-white/50">
      <InboxIcon className="w-12 h-12 mb-4 text-white/20" />
      <p className="text-sm">No recent syncs</p>
      <p className="text-xs mt-1">Start syncing content across your devices</p>
    </div>
  );

  const renderRecentSyncs = () => (
    <AnimatePresence mode="popLayout">
      {recentSyncs.length === 0 ? (
        renderEmptyState()
      ) : (
        recentSyncs.map((sync) => (
          <SyncItemComponent
            key={sync.id}
            sync={sync}
            onCopy={() => syncToast.success.created('clipboard')}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteSync}
            isFavorite={sync.isFavorite}
          />
        ))
      )}
    </AnimatePresence>
  );

  const renderFavorites = () => (
    <motion.div 
      layout 
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400/80" />
            <h2 className="text-sm font-medium text-white/70">Favorites</h2>
          </div>
        </div>
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {favorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4 text-white/40 text-sm"
              >
                No favorites yet. Star items to add them here!
              </motion.div>
            ) : (
              favorites.map((sync) => (
                <motion.div
                  key={sync.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <SyncItemComponent
                    sync={sync}
                    onCopy={() => syncToast.success.created('clipboard')}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteSync}
                    isFavorite={true}
                  />
                </motion.div>
              ))
            )}
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderQuickStats = () => (
    <motion.div layout className="mb-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Clips', type: 'clipboard', icon: Clipboard, color: 'text-primary/80' },
          { label: 'Files', type: 'file', icon: File, color: 'text-violet-400/80' },
          { label: 'Notes', type: 'note', icon: StickyNote, color: 'text-amber-400/80' },
        ].map(({ label, type, icon: Icon, color }) => (
          <div 
            key={type} 
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4 flex items-center gap-3"
          >
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              "bg-white/[0.03] border border-white/[0.08]"
            )}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-white/90">
                {stats[type] || 0}
              </p>
              <p className="text-xs font-medium text-white/50">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const handleToggleFavorite = (syncId: string) => {
    if (!socket) return;
    
    console.log('[Dashboard] Toggling favorite for sync:', syncId);
    
    // Optimistic update
    const sync = recentSyncs.find(s => s.id === syncId);
    if (sync) {
      const isFavorite = !sync.isFavorite;
      
      // Update recent syncs optimistically
      setRecentSyncs(prev => 
        prev.map(s => s.id === syncId ? { ...s, isFavorite } : s)
      );
      
      // Update favorites optimistically
      if (isFavorite) {
        setFavorites(prev => [{ ...sync, isFavorite: true }, ...prev].slice(0, 5));
      } else {
        setFavorites(prev => prev.filter(s => s.id !== syncId));
      }
    }
    
    // Send toggle request
    socket.emit('sync:toggle-favorite', { syncId });
  };

  const handleDeleteSync = (syncId: string) => {
    if (!socket) return;
    
    console.log('[Dashboard] Deleting sync:', syncId);
    
    // Optimistic update
    setRecentSyncs(prev => prev.filter(s => s.id !== syncId));
    setFavorites(prev => prev.filter(s => s.id !== syncId));
    
    // Send delete request
    socket.emit('sync:delete', { syncId });
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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "p-2.5 rounded-xl transition-all duration-300 ease-in-out",
                        currentDevice?.is_active 
                          ? "bg-primary/5 border border-primary/10 shadow-lg shadow-primary/5" 
                          : "bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05]"
                      )}>
                      {getDeviceIcon(currentDevice?.device_type)}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-1"
                    >
                      <p className="font-medium text-white/90 transition-colors duration-200 hover:text-white">
                        {currentDevice?.device_name?.split(' - ')?.[0] || 'Unknown Device'}
                      </p>
                      <p className="text-xs text-white/50 transition-opacity duration-200">
                        {currentDevice?.os_type ? currentDevice.os_type.charAt(0).toUpperCase() + currentDevice.os_type.slice(1) : 'Unknown OS'} • {currentDevice?.browser_type || 'Unknown Browser'}
                      </p>
                      <p className="text-xs text-white/40 transition-opacity duration-200">
                        {currentDevice?.last_active ? new Date(currentDevice.last_active).toLocaleString() : 'Never'}
                      </p>
                    </motion.div>
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
            {renderQuickStats()}

            {/* Favorites */}
            {renderFavorites()}

            {/* Recent Syncs */}
            <motion.div layout className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/70">Recent Syncs</h2>
                <button className="text-xs text-primary/80 hover:text-primary">View All</button>
              </div>
              {renderRecentSyncs()}
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
                placeholder={`${activeTab === 'clipboard' ? 'Paste' : activeTab === 'link' ? 'Enter URL' : activeTab === 'file' ? 'Enter file path' : 'Type note'}`}
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
              />
              <AnimatePresence mode="wait">
                {isDetecting ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-3 top-3 -translate-y-1/2"
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
                { type: 'clipboard' as const, icon: Clipboard, label: 'Paste', color: 'text-blue-400' },
                { type: 'note' as const, icon: StickyNote, label: 'Note', color: 'text-amber-400' },
                { type: 'file' as const, icon: File, label: 'Share', color: 'text-violet-400' },
                { type: 'link' as const, icon: Book, label: 'Link', color: 'text-emerald-400' },
              ].map(({ type, icon: Icon, label, color }) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab(type);
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