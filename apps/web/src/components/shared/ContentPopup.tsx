import { motion, AnimatePresence } from "framer-motion";
import { X} from "lucide-react";
import { cn } from "../../lib/utils";

interface ContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  type?: 'note' | 'clipboard' | 'link' | 'file';
  metadata?: Record<string, any>;
  timestamp?: Date;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant: 'danger' | 'secondary' | 'primary';
  }>;
}

export function ContentPopup({
  isOpen,
  onClose,
  content,
  title,
  type = 'note',
  metadata,
  timestamp,
  actions
}: ContentPopupProps) {

  

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background border border-white/[0.08] rounded-2xl shadow-2xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white/90">
                  {title || type.charAt(0).toUpperCase() + type.slice(1)}
                </h3>
                {timestamp && (
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap break-words font-sans text-white/90">
                  {content}
                </pre>
              </div>

              {/* Metadata */}
              {metadata && Object.keys(metadata).length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <h4 className="text-sm font-medium text-white/70 mb-3">Details</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-white/50">{key}</dt>
                        <dd className="text-white/90">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {actions && actions.length > 0 && (
              <div className="border-t border-white/[0.08] p-4 flex justify-end gap-3">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      action.variant === 'danger' && "bg-red-500/10 hover:bg-red-500/20 text-red-400",
                      action.variant === 'secondary' && "bg-white/5 hover:bg-white/10 text-white/70",
                      action.variant === 'primary' && "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 