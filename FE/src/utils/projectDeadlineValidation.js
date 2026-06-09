function parseDeadlineValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getProjectDeadlineErrors(values, { requireAll = false } = {}) {
  const now = new Date();
  const errors = {};

  const sketchValue = values?.sketchDeadlineAt ?? null;
  const finalValue = values?.finalDeadlineAt ?? null;
  const reviewValue = values?.totalDeadlineAt ?? null;

  const sketchDate = parseDeadlineValue(sketchValue);
  const finalDate = parseDeadlineValue(finalValue);
  const reviewDate = parseDeadlineValue(reviewValue);

  if (requireAll && !sketchValue) {
    errors.sketchDeadlineAt = 'Vui lòng nhập hạn nộp Sketch trước khi publish.';
  } else if (sketchValue && !sketchDate) {
    errors.sketchDeadlineAt = 'Hạn nộp Sketch không hợp lệ.';
  } else if (sketchDate && sketchDate <= now) {
    errors.sketchDeadlineAt = 'Hạn nộp Sketch phải sau thời điểm hiện tại.';
  }

  if (requireAll && !finalValue) {
    errors.finalDeadlineAt = 'Vui lòng nhập hạn nộp Final trước khi publish.';
  } else if (finalValue && !finalDate) {
    errors.finalDeadlineAt = 'Hạn nộp Final không hợp lệ.';
  } else if (finalDate && finalDate <= now) {
    errors.finalDeadlineAt = 'Hạn nộp Final phải sau thời điểm hiện tại.';
  } else if (finalDate && sketchDate && finalDate <= sketchDate) {
    errors.finalDeadlineAt = 'Hạn nộp Final phải sau hạn nộp Sketch.';
  }

  if (requireAll && !reviewValue) {
    errors.totalDeadlineAt = 'Vui lòng nhập hạn hoàn tất review trước khi publish.';
  } else if (reviewValue && !reviewDate) {
    errors.totalDeadlineAt = 'Hạn hoàn tất review không hợp lệ.';
  } else if (reviewDate && reviewDate <= now) {
    errors.totalDeadlineAt = 'Hạn hoàn tất review phải sau thời điểm hiện tại.';
  } else if (reviewDate && finalDate && reviewDate <= finalDate) {
    errors.totalDeadlineAt = 'Hạn hoàn tất review phải sau hạn nộp Final.';
  }

  return errors;
}
