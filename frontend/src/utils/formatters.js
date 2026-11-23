export function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  try {
    // MySQL DATE strings ("YYYY-MM-DD") must be parsed as local midnight to avoid
    // timezone off-by-one shifts. Append T00:00:00 to force local interpretation.
    const str = String(dateValue);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
    const date = isDateOnly ? new Date(`${str}T00:00:00`) : new Date(str);
    if (isNaN(date.getTime())) return str;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return String(dateValue);
  }
}

export function formatDateTime(dateValue) {
  if (!dateValue) return 'N/A';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return String(dateValue);
  }
}

export function toInputDate(dateValue) {
  if (!dateValue) return '';
  try {
    const str = String(dateValue);
    // Already in YYYY-MM-DD format — return as-is to avoid timezone shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const date = new Date(str);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
}

export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}
