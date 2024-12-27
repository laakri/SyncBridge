export type ContentType = 'clipboard' | 'link' | 'file' | 'note';

export interface SyncItem {
  id: string;
  type: ContentType;
  content: string;
  timestamp: Date;
  deviceFrom?: string;
  deviceTo?: string;
  isFavorite?: boolean;
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

export interface SyncValidation {
  clipboard: { maxLength: number };
  link: { urlPattern: RegExp };
  note: { maxLength: number };
  file: { maxSize: number; allowedTypes: string[] };
}

export const SYNC_VALIDATION: SyncValidation = {
  clipboard: { maxLength: 10000 },
  link: { urlPattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/ },
  note: { maxLength: 50000 },
  file: { 
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.txt']
  }
}; 