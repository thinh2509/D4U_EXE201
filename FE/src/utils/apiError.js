function normalizeFieldName(name, fieldMap = {}) {
  if (!name) return null;

  const normalized = String(name)
    .trim()
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/_/g, '')
    .replace(/\./g, '')
    .toLowerCase();

  return fieldMap[normalized] ?? null;
}

export function extractApiFieldErrors(error, fieldMap = {}) {
  const data = error?.response?.data;
  const result = [];

  if (!data?.errors || typeof data.errors !== 'object') {
    return result;
  }

  Object.entries(data.errors).forEach(([rawFieldName, messages]) => {
    const fieldName = normalizeFieldName(rawFieldName, fieldMap);
    if (!fieldName) return;

    const nextMessages = Array.isArray(messages)
      ? messages.filter(Boolean).map(String)
      : [String(messages)];

    if (nextMessages.length > 0) {
      result.push({
        name: fieldName,
        errors: nextMessages
      });
    }
  });

  return result;
}

export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (error?.response?.status === 413) {
    return 'Dung lượng file quá lớn. Vui lòng chọn file tối đa 20MB.';
  }

  const data = error?.response?.data;
  if (typeof data === 'string') {
    return data.trim().startsWith('<') ? fallback : data;
  }

  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    return Array.isArray(firstError) ? firstError[0] : String(firstError);
  }

  if (data?.title) return data.title;

  return fallback;
}

export function isApiMissing(error) {
  return error?.response?.status === 404 || error?.response?.status === 501;
}
