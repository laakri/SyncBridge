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

export const contentDetectorService = {
  detect(input: string): DetectedContent {
    // URL Detection (Reading)
    if (input.match(/^https?:\/\//i)) {
      return {
        type: 'reading',
        confidence: 0.9,
        metadata: {
          url: input,
          title: 'Web Page',
          preview: input.substring(0, 50)
        }
      };
    }

    // File Detection (PDF, TXT, etc)
    if (input.match(/\.(pdf|txt|doc|docx)$/i) || input.match(/^([a-zA-Z]:\\|\/)/)) {
      return {
        type: 'file',
        confidence: 0.8,
        metadata: {
          path: input,
          format: input.split('.').pop()?.toLowerCase(),
          size: input.length // This would be replaced with actual file size
        }
      };
    }

    // Note Detection (longer text with structure)
    if (input.length > 100 || input.includes('\n')) {
      const wordCount = input.split(/\s+/).length;
      return {
        type: 'note',
        confidence: 0.7,
        metadata: {
          preview: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
          wordCount,
          readingTime: Math.ceil(wordCount / 200) // Assuming 200 words per minute
        }
      };
    }

    // Clipboard (short text, likely to be pasted)
    return {
      type: 'clipboard',
      confidence: 0.6,
      metadata: {
        preview: input.substring(0, 50),
        wordCount: input.split(/\s+/).length
      }
    };
  },

  validateContent(type: DetectedContent['type'], input: string): boolean {
    switch (type) {
      case 'clipboard':
        return input.length <= 1000; // Max 1000 chars for clipboard
      case 'reading':
        return input.startsWith('http'); // Must be valid URL
      case 'file':
        return input.length <= 10 * 1024 * 1024; // Max 10MB (theoretical)
      case 'note':
        return input.length <= 10000; // Max 10000 chars for notes
      default:
        return false;
    }
  }
}; 