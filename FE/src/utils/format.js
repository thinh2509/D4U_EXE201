export function formatDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatCurrency(value, currency = 'VND') {
  if (value === null || value === undefined) return 'Chưa có';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return 'Không rõ';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getFileExtension(fileName = '') {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function getMimeType(file) {
  if (file.type) return file.type;
  const extension = getFileExtension(file.name);
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  return 'application/octet-stream';
}

export function normalizeDateInput(value) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function toDateTimeLocalValue(value) {
  if (!value) return undefined;
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
