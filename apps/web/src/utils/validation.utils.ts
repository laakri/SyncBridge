import { ContentType, SYNC_VALIDATION } from '../types/sync';

export const validateSync = (type: ContentType, content: string | File): { isValid: boolean; error?: string } => {
  switch (type) {
    case 'clipboard':
      if (content.toString().length > SYNC_VALIDATION.clipboard.maxLength) {
        return {
          isValid: false,
          error: `Content exceeds maximum length of ${SYNC_VALIDATION.clipboard.maxLength} characters`
        };
      }
      break;

    case 'link':
      if (!SYNC_VALIDATION.link.urlPattern.test(content.toString())) {
        return {
          isValid: false,
          error: 'Please enter a valid URL'
        };
      }
      break;

    case 'note':
      if (content.toString().length > SYNC_VALIDATION.note.maxLength) {
        return {
          isValid: false,
          error: `Note exceeds maximum length of ${SYNC_VALIDATION.note.maxLength} characters`
        };
      }
      break;

    case 'file':
      if (content instanceof File) {
        if (content.size > SYNC_VALIDATION.file.maxSize) {
          return {
            isValid: false,
            error: `File size exceeds maximum of ${SYNC_VALIDATION.file.maxSize / (1024 * 1024)}MB`
          };
        }
        // Add more file validation as needed
      }
      break;
  }

  return { isValid: true };
}; 