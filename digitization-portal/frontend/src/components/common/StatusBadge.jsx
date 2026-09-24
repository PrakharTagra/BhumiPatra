import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Cpu,
  Eye,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import Badge from './Badge';
import { normalizeStatus } from '../../utils/formatters';

export const StatusBadge = ({ status, type = 'processing', size = 'sm' }) => {
  const norm = normalizeStatus(status);

  if (type === 'verification') {
    switch (norm) {
      case 'VERIFIED':
      case 'AUTO_VERIFIED':
        return (
          <Badge variant="success" size={size} icon={ShieldCheck}>
            {norm === 'AUTO_VERIFIED' ? 'Auto-Verified' : 'Verified'}
          </Badge>
        );
      case 'NEEDS_VERIFICATION':
      case 'VERIFICATION_REQUIRED':
      case 'FLAGGED':
        return (
          <Badge variant="warning" size={size} icon={AlertTriangle}>
            Needs Verification
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="danger" size={size} icon={XCircle}>
            Rejected
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge variant="neutral" size={size} icon={Clock}>
            Pending Review
          </Badge>
        );
    }
  }

  // Processing Status
  switch (norm) {
    case 'COMPLETED':
    case 'PROCESSED':
    case 'SUCCESS':
      return (
        <Badge variant="success" size={size} icon={CheckCircle2}>
          Processed
        </Badge>
      );
    case 'FAILED':
    case 'ERROR':
      return (
        <Badge variant="danger" size={size} icon={XCircle}>
          Failed
        </Badge>
      );
    case 'NEEDS_VERIFICATION':
      return (
        <Badge variant="warning" size={size} icon={AlertTriangle}>
          Needs Verification
        </Badge>
      );
    case 'PROCESSING':
    case 'PREPROCESSING':
      return (
        <Badge variant="info" size={size} icon={RotateCw} className="animate-pulse">
          Preprocessing
        </Badge>
      );
    case 'OCR':
    case 'OCR_IN_PROGRESS':
      return (
        <Badge variant="purple" size={size} icon={Eye} className="animate-pulse">
          Processing
        </Badge>
      );
    case 'EXTRACTION':
    case 'EXTRACTION_IN_PROGRESS':
      return (
        <Badge variant="info" size={size} icon={Cpu} className="animate-pulse">
          Extraction
        </Badge>
      );
    case 'VALIDATION':
    case 'VALIDATION_IN_PROGRESS':
      return (
        <Badge variant="primary" size={size} icon={FileCheck2} className="animate-pulse">
          Validation
        </Badge>
      );
    case 'CONFIDENCE_ANALYSIS':
      return (
        <Badge variant="purple" size={size} icon={Cpu} className="animate-pulse">
          Confidence
        </Badge>
      );
    case 'UPLOADED':
    case 'PENDING':
    case 'QUEUED':
    default:
      return (
        <Badge variant="neutral" size={size} icon={Clock}>
          {norm === 'UPLOADED' ? 'Uploaded' : norm === 'QUEUED' ? 'Queued' : 'Pending'}
        </Badge>
      );
  }
};

export default StatusBadge;
