import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Command,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

interface SearchResult {
  id: string;
  type: "file" | "device" | "clipboard" | "recent";
  title: string;
  subtitle: string;
  icon?: any;
  deviceType?: "laptop" | "phone" | "tablet";
}

interface SearchBarProps {
  onClose: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      type: "device",
      title: "MacBook Pro",
      subtitle: "Last active: 2 minutes ago",
      deviceType: "laptop",
    },
    {
      id: "2",
      type: "file",
      title: "presentation.pdf",
      subtitle: "15MB • Shared 2 hours ago",
      icon: Clock,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 0) {
      setResults(mockResults);
    } else {
      setResults([]);
    }
  };

  return (
    <>
      {/* Search Trigger - Responsive width */}
      <div className="relative w-full max-w-[180px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px]">
        <button
          onClick={() => onClose()}
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg border border-border transition-all group"
        >
          <Search className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-300 transition-colors" />
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors truncate">
            Quick search...
          </span>
          <div className="ml-auto hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-background/50 rounded-md border border-border/50">
            <Command className="h-2.5 w-2.5 text-gray-500" />
            <span className="text-[10px] text-gray-500">K</span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {onClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 px-4 md:px-0"
          >
            <div className="fixed inset-x-0 top-[10%] sm:top-[15%] md:top-[20%] max-w-[90%] sm:max-w-lg md:max-w-xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden"
              >
                <div className="flex items-center px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 border-b border-border/50">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search devices and files..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm sm:text-sm placeholder:text-gray-400"
                    autoFocus
                  />
                  {query && (
                    <button
                      onClick={() => handleSearch("")}
                      className="p-1 hover:bg-background/80 rounded-md transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  )}
                </div>

                <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                  {results.map((result) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-background/80 transition-colors group"
                    >
                      <div className="p-1.5 sm:p-2 bg-primary/5 rounded-lg">
                        {result.deviceType === "laptop" && (
                          <Laptop className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        )}
                        {result.deviceType === "phone" && (
                          <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        )}
                        {result.deviceType === "tablet" && (
                          <Tablet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        )}
                        {result.icon && (
                          <result.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm sm:text-sm font-medium truncate">
                          {result.title}
                        </p>
                        <p className="text-[10px] sm:text-sm text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Command className="h-3 w-3 text-gray-400" />
                      </div>
                    </motion.button>
                  ))}

                  {query && results.length === 0 && (
                    <div className="px-4 py-6 sm:py-8 text-center text-gray-400">
                      <p className="text-sm sm:text-sm">No results found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
