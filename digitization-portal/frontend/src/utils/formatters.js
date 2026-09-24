// Formatting utility functions for BhumiPatra

/**
 * Format ISO date string into readable date-time
 */
export function formatDate(dateString, includeTime = true) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true } : {})
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format bytes into human-readable size
 */
export function formatFileSize(bytes) {
  if (bytes === 0 || bytes === '0') return '0 Bytes';
  if (!bytes || isNaN(Number(bytes))) return '—';
  
  const b = Number(bytes);
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  
  return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format confidence value (0-1 or 0-100) to percentage
 */
export function formatConfidence(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return '—';
  
  // If value is between 0 and 1, convert to 0-100
  const normalized = num <= 1 && num > 0 ? num * 100 : num;
  return `${Math.round(normalized)}%`;
}

/**
 * Determine confidence category
 */
export function getConfidenceTier(val) {
  if (val === null || val === undefined || val === '') return 'UNKNOWN';
  const num = Number(val);
  if (isNaN(num)) return 'UNKNOWN';
  const normalized = num <= 1 && num > 0 ? num * 100 : num;
  
  if (normalized >= 85) return 'HIGH';
  if (normalized >= 60) return 'MEDIUM';
  return 'LOW';
}

/**
 * Clean and truncate string with ellipsis
 */
export function truncate(text, maxLen = 30) {
  if (!text) return '—';
  const str = String(text);
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}...`;
}

/**
 * Normalize status strings from API
 */
export function normalizeStatus(status) {
  if (!status) return 'PENDING';
  return String(status).toUpperCase().trim();
}
