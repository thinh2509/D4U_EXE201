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
        errors: nextMessages,
      });
    }
  });

  return result;
}

function mapProviderErrorMessage(message, fallback) {
  if (!message) return fallback;

  const normalized = String(message).trim();
  const lowered = normalized.toLowerCase();

  if (lowered.includes('payos payment creation failed')) {
    if (lowered.includes('mô tả tối đa 25 ký tự') || lowered.includes('mo ta toi da 25 ky tu') || lowered.includes('description')) {
      return 'Không thể tạo thanh toán cho gói AI lúc này. Hệ thống đang điều chỉnh thông tin giao dịch để tương thích với cổng thanh toán.';
    }

    return 'Không thể tạo phiên thanh toán với PayOS lúc này. Vui lòng thử lại sau ít phút.';
  }

  if (lowered.includes('405 not allowed')) {
    return 'Không thể kết nối tới cổng thanh toán lúc này. Vui lòng kiểm tra cấu hình môi trường hoặc thử lại sau.';
  }

  return normalized;
}

export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (error?.response?.status === 413) {
    return 'Dung lượng file quá lớn. Vui lòng chọn file tối đa 20MB.';
  }

  const data = error?.response?.data;
  if (typeof data === 'string') {
    return data.trim().startsWith('<') ? fallback : mapProviderErrorMessage(data, fallback);
  }

  if (data?.detail) return mapProviderErrorMessage(data.detail, fallback);
  if (data?.message) return mapProviderErrorMessage(data.message, fallback);

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    return mapProviderErrorMessage(Array.isArray(firstError) ? firstError[0] : String(firstError), fallback);
  }

  if (data?.title) return mapProviderErrorMessage(data.title, fallback);

  return fallback;
}

export function isApiMissing(error) {
  return error?.response?.status === 404 || error?.response?.status === 501;
}
