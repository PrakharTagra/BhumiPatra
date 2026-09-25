// Constants for BhumiPatra Digitization Portal

export const USER_ROLES = {
  DIGITIZATION_OPERATOR: 'DIGITIZATION_OPERATOR',
};

export const PIPELINE_STEPS = [
  { id: 'UPLOAD', label: 'Document Received', description: 'Document scan received and stored in repository' },
  { id: 'PREPROCESSING', label: 'Preparing Document', description: 'Contrast enhancement, deskewing, and boundary alignment' },
  { id: 'OCR', label: 'Reading Document', description: 'Text line and character extraction from scanned pages' },
  { id: 'EXTRACTION', label: 'Structuring Record', description: 'Parsing land parcels, cadastral numbers, and tenure holders' },
  { id: 'VALIDATION', label: 'Validating Record', description: 'Cross-verifying boundaries, numbers, and consistency checks' },
  { id: 'CONFIDENCE_ANALYSIS', label: 'Final Review', description: 'Calculating extraction confidence across all fields' },
  { id: 'COMPLETED', label: 'Completed', description: 'Record structured and prepared for official verification' },
];

export const DOCUMENT_TYPES = [
  'Jamabandi / Record of Rights (RoR)',
  'Khasra / Girdawari (Harvest Inspection Register)',
  'Khatauni (Landholding Record)',
  'Mutation Register (Inteqal)',
  'Cadastral Map (Naksha / Aks Shajra)',
  'Sale Deed / Registered Conveyance',
  'Encumbrance Certificate (Bar-Mukammal)',
  'Land Allotment Order / Patta',
  'Field Book / Measurement Sheet',
  'Other Land Record'
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/tiff'
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_MB = 50;

export const PROCESSING_STATUSES = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  PREPROCESSING: 'PREPROCESSING',
  OCR: 'OCR',
  EXTRACTION: 'EXTRACTION',
  VALIDATION: 'VALIDATION',
  CONFIDENCE_ANALYSIS: 'CONFIDENCE_ANALYSIS',
  COMPLETED: 'COMPLETED',
  PROCESSED: 'PROCESSED',
  NEEDS_VERIFICATION: 'NEEDS_VERIFICATION',
  FAILED: 'FAILED'
};

export const VERIFICATION_STATUSES = {
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  PENDING: 'PENDING',
  AUTO_VERIFIED: 'AUTO_VERIFIED',
  NEEDS_VERIFICATION: 'NEEDS_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};
