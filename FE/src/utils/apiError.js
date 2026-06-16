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

function mapKnownApiErrorMessage(message, fallback) {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (normalized.includes('student profile must be created before purchasing feature packages')) {
    return 'Bạn cần tạo hồ sơ sinh viên trước khi mua gói AI.';
  }

  if (normalized.includes('student verification must be approved before purchasing feature packages')) {
    return 'Bạn cần được duyệt xác thực sinh viên trước khi mua gói AI.';
  }

  if (normalized.includes('sme profile must be created before purchasing feature packages')) {
    return 'Bạn cần tạo hồ sơ doanh nghiệp trước khi mua gói.';
  }

  if (normalized.includes('an active entitlement already exists for this package feature')) {
    return 'Bạn đang có gói còn hiệu lực nên chưa thể mua thêm gói cùng loại.';
  }

  if (normalized.includes('feature entitlement is already active for this purchase')) {
    return 'Gói này đã được kích hoạt, không cần tạo thanh toán lại.';
  }

  if (normalized.includes('feature package purchase was not found')) {
    return 'Không tìm thấy giao dịch mua gói. Vui lòng tải lại trang và thử lại.';
  }

  if (normalized.includes('only the purchase owner can create payment')) {
    return 'Bạn không có quyền mở thanh toán cho giao dịch gói này.';
  }

  if (normalized.includes('payos payment creation failed: description:')) {
    return 'Không thể tạo link thanh toán PayOS lúc này vì mô tả đơn hàng đang vượt giới hạn của PayOS.';
  }

  if (normalized.includes('payos payment creation failed')) {
    return 'Không thể tạo link thanh toán PayOS lúc này. Vui lòng thử lại sau.';
  }

  return message;
}

export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (error?.response?.status === 413) {
    return 'Dung lượng file quá lớn. Vui lòng chọn file tối đa 20MB.';
  }

  const data = error?.response?.data;
  if (typeof data === 'string') {
    const message = data.trim().startsWith('<') ? fallback : data;
    return mapKnownApiErrorMessage(message, fallback);
  }

  if (data?.detail) return mapKnownApiErrorMessage(data.detail, fallback);
  if (data?.message) return mapKnownApiErrorMessage(data.message, fallback);

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    const message = Array.isArray(firstError) ? firstError[0] : String(firstError);
    return mapKnownApiErrorMessage(message, fallback);
  }

  if (data?.title) return mapKnownApiErrorMessage(data.title, fallback);

  return fallback;
}

export function getPackageBillingErrorMessage(error, fallback = 'Không thể xử lý giao dịch gói AI.') {
  return getApiErrorMessage(error, fallback);
}

export function isApiMissing(error) {
  return error?.response?.status === 404 || error?.response?.status === 501;
}
