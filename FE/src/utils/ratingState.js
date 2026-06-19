import { formatDate } from "./format.js";

export function getRatingStateMeta({
  projectStatus,
  ratingDueAt,
  canCurrentUserRate,
  hasCurrentUserRated,
  currentUserRatedAt,
}) {
  if (hasCurrentUserRated) {
    return {
      key: "RATED",
      label: "Đã đánh giá",
      tone: "success",
      helper: currentUserRatedAt
        ? `Bạn đã gửi đánh giá vào ${formatDate(currentUserRatedAt)}.`
        : "Bạn đã gửi đánh giá cho dự án này.",
    };
  }

  if (canCurrentUserRate) {
    return {
      key: "AVAILABLE",
      label: "Có thể đánh giá",
      tone: "warning",
      helper: ratingDueAt
        ? `Bạn có thể gửi đánh giá đến ${formatDate(ratingDueAt)}.`
        : "Bạn có thể gửi đánh giá cho đối tác ngay bây giờ.",
    };
  }

  if (projectStatus !== "COMPLETED") {
    return {
      key: "NOT_READY",
      label: "Chưa đến bước đánh giá",
      tone: "neutral",
      helper: "Chỉ có thể đánh giá sau khi dự án hoàn thành.",
    };
  }

  if (ratingDueAt && new Date(ratingDueAt).getTime() <= Date.now()) {
    return {
      key: "EXPIRED",
      label: "Hết hạn đánh giá",
      tone: "neutral",
      helper: `Cửa sổ đánh giá đã hết hạn vào ${formatDate(ratingDueAt)}.`,
    };
  }

  return {
    key: "LOCKED",
    label: "Chưa thể đánh giá",
    tone: "neutral",
    helper: ratingDueAt
      ? `Cửa sổ đánh giá kéo dài đến ${formatDate(ratingDueAt)}.`
      : "Trạng thái đánh giá của dự án này hiện chưa khả dụng.",
  };
}
