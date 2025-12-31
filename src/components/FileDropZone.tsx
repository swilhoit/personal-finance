'use client';

import { useState, useCallback, useRef } from 'react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export function FileDropZone({
  onFileSelect,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.some(type => type === fileExtension || type === file.type)) {
      return `Invalid file type. Please upload ${accept} files.`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File is too large. Maximum size is ${maxMB}MB.`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-cyan-500 bg-cyan-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-cyan-100' : 'bg-gray-200'}
          `}>
            <svg
              className={`w-6 h-6 ${isDragging ? 'text-cyan-600' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Supports {accept} files up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
