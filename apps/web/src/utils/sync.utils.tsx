import { Clipboard, Book, File, StickyNote } from "lucide-react";

export const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'clipboard':
      return <Clipboard className="w-4 h-4 text-primary/90" />;
    case 'link':
      return <Book className="w-4 h-4 text-emerald-400/80" />;
    case 'file':
      return <File className="w-4 h-4 text-violet-400/80" />;
    case 'note':
      return <StickyNote className="w-4 h-4 text-amber-400/80" />;
    default:
      return <Clipboard className="w-4 h-4 text-primary/90" />;
  }
};

export const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}; 