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
  if (data?.title) return data.title;

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    return Array.isArray(firstError) ? firstError[0] : String(firstError);
  }

  return fallback;
}

export function isApiMissing(error) {
  return error?.response?.status === 404 || error?.response?.status === 501;
}
