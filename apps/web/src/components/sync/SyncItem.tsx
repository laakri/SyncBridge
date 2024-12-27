import { forwardRef } from 'react';
import { motion } from "framer-motion";
import { Star, ExternalLink, Trash2, Download, Copy } from "lucide-react";
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
  onDelete?: (syncId: string) => void;
  isFavorite?: boolean;
}

export const SyncItem = forwardRef<HTMLDivElement, SyncItemProps>(
  ({ sync, onCopy, onToggleFavorite, onDelete }, ref) => {
    const [showPopup, setShowPopup] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
      <>
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-xl p-4 transition-all duration-300"
          onClick={() => setShowPopup(true)}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-2.5 rounded-lg border",
              sync.type === 'clipboard' && "bg-primary/[0.07] border-primary/[0.15]",
              sync.type === 'link' && "bg-emerald-400/[0.07] border-emerald-400/[0.15]",
              sync.type === 'file' && "bg-violet-400/[0.07] border-violet-400/[0.15]",
              sync.type === 'note' && "bg-amber-400/[0.07] border-amber-400/[0.15]"
            )}>
              {getIconForType(sync.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white/90 truncate flex-1">
                  {sync.content}
                </p>
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
                  <ExternalLink className="w-4 h-4 text-emerald-400/80" />
                </a>
              )}
              {sync.type === 'file' && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(sync.content, '_blank');
                  }}
                >
                  <Download className="w-4 h-4 text-violet-400/80" />
                </button>
              )}
              {sync.type === 'clipboard' && (
                <button
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(sync.content);
                    onCopy?.();
                  }}
                >
                  <Copy className="w-4 h-4 text-primary/80 hover:text-primary hover:scale-110 transition-all duration-300" />
                </button>
              )}
              <button 
                className={cn(
                  "transition-all duration-300",
                  sync.isFavorite 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(sync.id);
                }}
              >
                <Star 
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    sync.isFavorite 
                      ? "fill-amber-400 text-amber-400 hover:fill-transparent" 
                      : "text-primary/80 hover:text-amber-400 hover:scale-110"
                  )} 
                />
              </button>
              <button
                className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-400/80 hover:text-red-400 hover:scale-110 transition-all duration-300" />
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

        <ContentPopup
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          content="Are you sure you want to delete this item?"
          type="note"
          actions={[
            {
              label: "Delete",
              onClick: () => {
                onDelete?.(sync.id);
                setShowDeleteConfirm(false);
              },
              variant: "danger"
            },
            {
              label: "Cancel",
              onClick: () => setShowDeleteConfirm(false),
              variant: "secondary"
            }
          ]}
        />
      </>
    );
  }
);

SyncItem.displayName = 'SyncItem'; 