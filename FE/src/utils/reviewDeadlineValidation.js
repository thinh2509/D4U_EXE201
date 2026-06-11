const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const US_12_HOUR_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)$/i;

function buildLocalDate(year, month, day, hours, minutes, seconds = 0) {
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseReviewDateTime(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'object' && typeof value?.toDate === 'function') {
    const nextValue = value.toDate();
    return Number.isNaN(nextValue?.getTime?.()) ? null : nextValue;
  }

  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!normalized) return null;

  const datetimeLocalMatch = normalized.match(DATETIME_LOCAL_PATTERN);
  if (datetimeLocalMatch) {
    const [, year, month, day, hour, minute, second] = datetimeLocalMatch;
    return buildLocalDate(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second || 0)
    );
  }

  const us12HourMatch = normalized.match(US_12_HOUR_PATTERN);
  if (us12HourMatch) {
    const [, month, day, year, rawHour, minute, meridiem] = us12HourMatch;
    const hourNumber = Number(rawHour) % 12;
    const hours = meridiem.toUpperCase() === 'PM' ? hourNumber + 12 : hourNumber;
    return buildLocalDate(Number(year), Number(month), Number(day), hours, Number(minute));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toReviewDeadlineIso(value) {
  const parsed = parseReviewDateTime(value);
  return parsed ? parsed.toISOString() : null;
}

export function getReviewDeadlineMinimum(workspace, latestSubmission, latestReviewAction) {
  const previousReviewDeadline = parseReviewDateTime(latestReviewAction?.reuploadDueAt || latestReviewAction?.dueAt);
  if (previousReviewDeadline) return previousReviewDeadline;

  if (latestSubmission?.milestoneType === 'SKETCH') {
    return parseReviewDateTime(workspace?.sketchDeadlineAt);
  }

  if (latestSubmission?.milestoneType === 'FINAL') {
    return parseReviewDateTime(workspace?.finalDeadlineAt);
  }

  return null;
}

export function getReviewDeadlineError(
  value,
  {
    requiredMessage,
    invalidMessage,
    futureMessage,
    minimumMessage,
    minimumDate,
    now = new Date()
  }
) {
  if (!value) return requiredMessage;

  const parsed = parseReviewDateTime(value);
  if (!parsed) return invalidMessage;
  if (parsed.getTime() <= now.getTime()) return futureMessage;
  if (minimumDate && parsed.getTime() <= minimumDate.getTime()) return minimumMessage;

  return null;
}
