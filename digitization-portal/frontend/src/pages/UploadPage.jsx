import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import documentsApi from '../api/documents';
import { useToast } from '../context/ToastContext';
import UploadDropzone from '../components/documents/UploadDropzone';
import PipelineTracker from '../components/documents/PipelineTracker';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import {
  DOCUMENT_TYPES,
  INDIAN_STATES
} from '../utils/constants';
import {
  UploadCloud,
  FileCheck2,
  ShieldAlert,
  ArrowRight,
  Info,
  Calendar,
  MapPin,
  Building,
  RotateCcw
} from 'lucide-react';

export function UploadPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [recordYear, setRecordYear] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const errors = {};

    if (!file) {
      errors.file = 'Please select or drop a scanned land record file.';
    }

    if (!documentType) {
      errors.documentType = 'Please select the land record document type.';
    }

    if (!state) {
      errors.state = 'Please select the state or union territory.';
    }

    if (!district.trim()) {
      errors.district = 'District name is required.';
    }

    if (!tehsil.trim()) {
      errors.tehsil = 'Tehsil / Taluk name is required.';
    }

    if (!village.trim()) {
      errors.village = 'Village / Mauza name is required.';
    }

    const currentYear = new Date().getFullYear();
    const yearNum = Number(recordYear);
    if (!recordYear) {
      errors.recordYear = 'Record creation or settlement year is required.';
    } else if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
      errors.recordYear = `Enter a valid year between 1800 and ${currentYear}.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setFile(null);
    setDocumentType('');
    setState('');
    setDistrict('');
    setTehsil('');
    setVillage('');
    setRecordYear('');
    setFieldErrors({});
    setApiError(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      toastError('Please correct the validation errors in the form before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('state', state);
    formData.append('district', district.trim());
    formData.append('tehsil', tehsil.trim());
    formData.append('village', village.trim());
    formData.append('recordYear', recordYear.trim());

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await documentsApi.upload(formData, (percent) => {
        setUploadProgress(percent);
      });

      // Handle backend response format: { document: { id, ... } } or { id: ... } or { documentId: ... }
      const newDoc = response?.document || response?.data?.document || response?.data || response;
      const documentId = newDoc?._id || newDoc?.id || newDoc?.documentId;

      success('Document uploaded successfully. Processing started.', 'Upload Complete');

      if (documentId) {
        // Redirect directly to real-time Processing Details page for this document
        navigate(`/documents/${documentId}/processing`);
      } else {
        // If document ID wasn't directly returned, navigate to Documents History list
        navigate('/documents');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const message = err.message || 'Failed to upload document. Please check server connectivity.';
      setApiError(message);
      toastError(message, 'Upload Failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Upload Document' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Upload Scanned Land Record
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Upload a scanned land record document for processing
          </p>
        </div>
      </div>

      {apiError && (
        <AlertBanner
          type="error"
          title="Upload Failed"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Static Pipeline Step Indicator for Initial Upload */}
      <PipelineTracker
        status="UPLOADED"
        currentStep="UPLOAD"
      />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Step 1: Document File Dropzone */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                1. Scanned Document File
              </h2>
              <p className="text-xs text-slate-500">
                Accepts high-resolution scanned land records in PDF, JPG, JPEG, PNG, or TIFF
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Max 50MB
            </span>
          </div>

          <UploadDropzone
            selectedFile={file}
            onFileSelect={(selected) => {
              setFile(selected);
              if (fieldErrors.file) {
                setFieldErrors((prev) => ({ ...prev, file: null }));
              }
            }}
            onFileRemove={() => setFile(null)}
            error={fieldErrors.file}
            disabled={isUploading}
          />

          {/* Real Upload Progress Bar */}
          {isUploading && (
            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 animate-bounce text-navy-700" />
                  Uploading document...
                </span>
                <span className="font-mono font-bold text-navy-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-navy-700 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Please do not close or navigate away from this tab during active upload.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Administrative Metadata Collection */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
          <div className="pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Document Administrative Index
            </h2>
            <p className="text-xs text-slate-500">
              Mandatory indexing attributes to associate the land record with the correct revenue hierarchy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Document Type */}
            <Select
              label="Document Type"
              id="documentType"
              name="documentType"
              required
              options={DOCUMENT_TYPES}
              placeholder="Select land record type..."
              value={documentType}
              onChange={(e) => {
                setDocumentType(e.target.value);
                if (fieldErrors.documentType) {
                  setFieldErrors((prev) => ({ ...prev, documentType: null }));
                }
              }}
              error={fieldErrors.documentType}
              disabled={isUploading}
            />

            {/* 2. State */}
            <Select
              label="State / Union Territory"
              id="state"
              name="state"
              required
              options={INDIAN_STATES}
              placeholder="Select State / UT..."
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                if (fieldErrors.state) {
                  setFieldErrors((prev) => ({ ...prev, state: null }));
                }
              }}
              error={fieldErrors.state}
              disabled={isUploading}
            />

            {/* 3. District */}
            <Input
              label="District"
              id="district"
              name="district"
              required
              placeholder="e.g. Pune, Patna, Jaipur"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                if (fieldErrors.district) {
                  setFieldErrors((prev) => ({ ...prev, district: null }));
                }
              }}
              error={fieldErrors.district}
              icon={Building}
              disabled={isUploading}
            />

            {/* 4. Tehsil */}
            <Input
              label="Tehsil / Taluk / Sub-Division"
              id="tehsil"
              name="tehsil"
              required
              placeholder="e.g. Haveli, Sadar"
              value={tehsil}
              onChange={(e) => {
                setTehsil(e.target.value);
                if (fieldErrors.tehsil) {
                  setFieldErrors((prev) => ({ ...prev, tehsil: null }));
                }
              }}
              error={fieldErrors.tehsil}
              icon={MapPin}
              disabled={isUploading}
            />

            {/* 5. Village */}
            <Input
              label="Village / Mauza"
              id="village"
              name="village"
              required
              placeholder="e.g. Wagholi, Rampur"
              value={village}
              onChange={(e) => {
                setVillage(e.target.value);
                if (fieldErrors.village) {
                  setFieldErrors((prev) => ({ ...prev, village: null }));
                }
              }}
              error={fieldErrors.village}
              icon={MapPin}
              disabled={isUploading}
            />

            {/* 6. Record Year */}
            <Input
              label="Record Year"
              id="recordYear"
              name="recordYear"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              required
              placeholder="e.g. 1974, 2012"
              value={recordYear}
              onChange={(e) => {
                setRecordYear(e.target.value);
                if (fieldErrors.recordYear) {
                  setFieldErrors((prev) => ({ ...prev, recordYear: null }));
                }
              }}
              error={fieldErrors.recordYear}
              helperText="Year of survey, settlement, or registration"
              icon={Calendar}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={RotateCcw}
            onClick={handleReset}
            disabled={isUploading}
          >
            Clear Form
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isUploading}
            icon={UploadCloud}
            className="w-full sm:w-auto"
          >
            {isUploading ? `Uploading (${uploadProgress}%)...` : 'Upload & Process'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UploadPage;
