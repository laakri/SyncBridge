import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { syncToast } from "../../utils/toast.utils";

interface ContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  type?: 'note' | 'clipboard' | 'link' | 'file';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export function ContentPopup({
  isOpen,
  onClose,
  content,
  title,
  type = 'note',
  metadata,
  timestamp
}: ContentPopupProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    syncToast.success.created('clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

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
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-white/40'}`} />
                </button>
                {type === 'link' && (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-white/40" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-invert max-w-none">
                {type === 'link' ? (
                  <a
                    href={content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 break-all"
                  >
                    {content}
                  </a>
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-white/90">
                    {content}
                  </pre>
                )}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 