import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Image,
  FileCheck,
  X,
  AlertCircle
} from 'lucide-react';
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB
} from '../../utils/constants';
import { formatFileSize } from '../../utils/formatters';

export const UploadDropzone = ({
  selectedFile,
  onFileSelect,
  onFileRemove,
  error,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  const validateAndSelect = (file) => {
    setLocalError(null);

    if (!file) return;

    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const isExtensionValid = ALLOWED_FILE_EXTENSIONS.includes(extension);

    // Check MIME type if present
    const isMimeValid = !file.type || ALLOWED_FILE_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith('image/');

    if (!isExtensionValid && !isMimeValid) {
      setLocalError(`Unsupported file format. Please upload PDF, JPG, JPEG, PNG, or TIFF format.`);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError(`File size exceeds maximum allowable limit of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const activeError = error || localError;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
        id="land-record-file-upload"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all
            flex flex-col items-center justify-center select-none
            ${isDragOver
              ? 'border-navy-700 bg-navy-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-navy-600 hover:bg-slate-50/80 bg-white'
            }
            ${activeError ? 'border-rose-400 bg-rose-50/30' : ''}
            ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
          `}
        >
          <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-semibold text-slate-800">
            Drag &amp; drop scanned land record here, or <span className="text-navy-700 underline underline-offset-2">browse file</span>
          </h4>

          <p className="text-xs text-slate-500 mt-1.5">
            Supported formats: <strong className="font-semibold text-slate-700">PDF, JPG, JPEG, PNG, TIFF</strong> (Max: {MAX_FILE_SIZE_MB}MB)
          </p>

          <div className="mt-3 text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
            Recommended scan quality: 300+ DPI in greyscale or color for optimal document processing accuracy
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-navy-50 text-navy-800 flex items-center justify-center shrink-0">
              {selectedFile.type?.includes('pdf') || selectedFile.name?.endsWith('.pdf') ? (
                <FileText className="w-5 h-5 text-rose-600" />
              ) : (
                <Image className="w-5 h-5 text-sky-600" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span className="uppercase text-[10px] font-mono font-medium px-1.5 py-0.5 bg-slate-100 rounded">
                  {selectedFile.name.split('.').pop()}
                </span>
                <span>•</span>
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <FileCheck className="w-3.5 h-3.5" /> Ready for upload
                </span>
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (inputRef.current) inputRef.current.value = '';
                onFileRemove();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {activeError && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
