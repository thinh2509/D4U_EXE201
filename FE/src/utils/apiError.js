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

function extractRawApiMessage(error) {
  if (!error) return '';

  if (typeof error === 'string') return error;

  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);

  if (data?.errors && typeof data.errors === 'object') {
    const firstKey = Object.keys(data.errors)[0];
    const firstError = data.errors[firstKey];
    return Array.isArray(firstError) ? String(firstError[0] ?? '') : String(firstError ?? '');
  }

  if (data?.title) return String(data.title);
  return '';
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
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

export function isPlanLimitError(error) {
  const lowered = normalizeText(extractRawApiMessage(error));

  return (
    lowered.includes('project budget exceeds the current subscription plan limit') ||
    lowered.includes('active open project limit has been reached for the current subscription plan') ||
    lowered.includes('ban da dat gioi han 2 du an dang mo cua goi free')
  );
}

export function getPlanLimitErrorMessage(error) {
  const lowered = normalizeText(extractRawApiMessage(error));

  if (lowered.includes('project budget exceeds the current subscription plan limit')) {
    return 'Ng\u00e2n s\u00e1ch d\u1ef1 \u00e1n \u0111ang v\u01b0\u1ee3t m\u1ee9c t\u1ed1i \u0111a c\u1ee7a g\u00f3i hi\u1ec7n t\u1ea1i. G\u00f3i Free hi\u1ec7n ch\u1ec9 h\u1ed7 tr\u1ee3 t\u1ed1i \u0111a 5.000.000\u0111 cho m\u1ed7i d\u1ef1 \u00e1n.';
  }

  if (
    lowered.includes('active open project limit has been reached for the current subscription plan') ||
    lowered.includes('ban da dat gioi han 2 du an dang mo cua goi free')
  ) {
    return 'B\u1ea1n \u0111\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n 2 d\u1ef1 \u00e1n \u0111ang m\u1edf c\u1ee7a g\u00f3i Free. H\u00e3y ho\u00e0n t\u1ea5t b\u1edbt d\u1ef1 \u00e1n hi\u1ec7n c\u00f3 ho\u1eb7c n\u00e2ng c\u1ea5p g\u00f3i \u0111\u1ec3 ti\u1ebfp t\u1ee5c.';
  }

  return 'D\u1ef1 \u00e1n n\u00e0y \u0111ang v\u01b0\u1ee3t gi\u1edbi h\u1ea1n c\u1ee7a g\u00f3i hi\u1ec7n t\u1ea1i.';
}

function mapProviderErrorMessage(message, fallback) {
  if (!message) return fallback;

  const normalized = String(message).trim();
  const lowered = normalized.toLowerCase();

  if (
    lowered.includes('sme profile must be created before purchasing feature packages') ||
    lowered.includes('báº¡n cáº§n táº¡o há»“ sÆ¡ doanh nghiá»‡p trÆ°á»›c khi mua gÃ³i tÃ­nh nÄƒng')
  ) {
    return 'Báº¡n cáº§n táº¡o há»“ sÆ¡ doanh nghiá»‡p trÆ°á»›c khi mua gÃ³i AI.';
  }

  if (
    lowered.includes('student profile must be created before purchasing feature packages') ||
    lowered.includes('báº¡n cáº§n táº¡o há»“ sÆ¡ sinh viÃªn trÆ°á»›c khi mua gÃ³i tÃ­nh nÄƒng')
  ) {
    return 'Báº¡n cáº§n táº¡o há»“ sÆ¡ sinh viÃªn trÆ°á»›c khi mua gÃ³i AI.';
  }

  if (
    lowered.includes('student verification must be approved before purchasing feature packages') ||
    lowered.includes('báº¡n cáº§n hoÃ n táº¥t xÃ¡c thá»±c sinh viÃªn trÆ°á»›c khi mua gÃ³i tÃ­nh nÄƒng')
  ) {
    return 'Báº¡n cáº§n hoÃ n táº¥t xÃ¡c thá»±c sinh viÃªn trÆ°á»›c khi mua gÃ³i AI.';
  }

  if (isPlanLimitError(normalized)) {
    return getPlanLimitErrorMessage(normalized);
  }

  if (lowered.includes('payos payment creation failed')) {
    if (
      lowered.includes('mÃ´ táº£ tá»‘i Ä‘a 25 kÃ½ tá»±') ||
      lowered.includes('mo ta toi da 25 ky tu') ||
      lowered.includes('description')
    ) {
      return 'KhÃ´ng thá»ƒ táº¡o thanh toÃ¡n cho gÃ³i AI lÃºc nÃ y. Há»‡ thá»‘ng Ä‘ang Ä‘iá»u chá»‰nh thÃ´ng tin giao dá»‹ch Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch vá»›i cá»•ng thanh toÃ¡n.';
    }

    return 'KhÃ´ng thá»ƒ táº¡o phiÃªn thanh toÃ¡n vá»›i PayOS lÃºc nÃ y. Vui lÃ²ng thá»­ láº¡i sau Ã­t phÃºt.';
  }

  if (lowered.includes('405 not allowed')) {
    return 'KhÃ´ng thá»ƒ káº¿t ná»‘i tá»›i cá»•ng thanh toÃ¡n lÃºc nÃ y. Vui lÃ²ng kiá»ƒm tra cáº¥u hÃ¬nh mÃ´i trÆ°á»ng hoáº·c thá»­ láº¡i sau.';
  }

  return normalized;
}

export function getApiErrorMessage(error, fallback = 'ÄÃ£ cÃ³ lá»—i xáº£y ra. Vui lÃ²ng thá»­ láº¡i.') {
  if (error?.response?.status === 413) {
    return 'Dung lÆ°á»£ng file quÃ¡ lá»›n. Vui lÃ²ng chá»n file tá»‘i Ä‘a 20MB.';
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
