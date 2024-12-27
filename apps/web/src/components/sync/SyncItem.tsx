import { forwardRef } from 'react';
import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ContentPopup } from "../shared/ContentPopup";
import { getIconForType } from "../../utils/sync.utils";
import { formatTimeAgo } from "../../utils/sync.utils";
import { cn } from "../../lib/utils";
import { SyncItem as SyncItemType } from "../../types/sync";

interface SyncItemProps {
  sync: SyncItemType;
  onCopy?: () => void;
  onToggleFavorite?: (syncId: string) => void;
  isFavorite?: boolean;
}

export const SyncItem = forwardRef<HTMLDivElement, SyncItemProps>(
  ({ sync, onCopy, onToggleFavorite, isFavorite }, ref) => {
    const [showPopup, setShowPopup] = useState(false);

    return (
      <>
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4 transition-all duration-300 cursor-pointer"
          onClick={() => setShowPopup(true)}
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-primary/[0.07] border border-primary/[0.15]">
              {getIconForType(sync.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white/90 truncate flex-1">
                  {sync.content}
                </p>
                {sync.isFavorite && (
                  <Star className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-xs text-white/50 mt-1">
                {formatTimeAgo(sync.timestamp)} • {sync.deviceFrom}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sync.type === 'link' && (
                <a
                  href={sync.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4 text-primary/80" />
                </a>
              )}
              <button 
                className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(sync.id);
                }}
              >
                <Star className={cn(
                  "w-4 h-4",
                  sync.isFavorite ? "text-amber-400" : "text-primary/80"
                )} />
              </button>
            </div>
          </div>
        </motion.div>

        <ContentPopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          content={sync.content}
          type={sync.type}
          metadata={sync.metadata}
          timestamp={sync.timestamp}
        />
      </>
    );
  }
);

SyncItem.displayName = 'SyncItem'; 