import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload,  AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export function FileUpload({ 
  onFileSelect, 
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'] 
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size
      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return;
      }

      // Validate file type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedTypes.includes(fileExtension)) {
        setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }

      setError(null);
      onFileSelect(file);
    }
  }, [maxSize, allowedTypes, onFileSelect]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={`
          relative p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'}
          ${isDragReject ? '!border-red-500 !bg-red-500/5' : ''}
        `}
        
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{
              y: isDragActive ? -5 : 0,
              scale: isDragActive ? 1.1 : 1,
            }}
            className="p-3 rounded-xl bg-white/5"
          >
            <Upload className="w-6 h-6 text-white/40" />
          </motion.div>
          
          <div>
            <p className="text-sm text-white/60">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              or click to browse
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {allowedTypes.map((type) => (
              <span 
                key={type}
                className="px-2 py-1 text-[10px] font-medium rounded-md bg-white/5 text-white/40"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-12 left-0 right-0 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 