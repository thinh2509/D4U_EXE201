export const roleLabels = {
  STUDENT: 'Sinh viên thiết kế',
  SME: 'Doanh nghiệp',
  ADMIN: 'Quản trị viên'
};

export const verificationStatusLabels = {
  NOT_SUBMITTED: 'Chưa gửi',
  PENDING: 'Đang chờ duyệt',
  UNDER_REVIEW: 'Đang xem xét',
  APPROVED: 'Đã xác thực',
  VERIFIED: 'Đã xác thực',
  REJECTED: 'Bị từ chối',
  EXPIRED: 'Hết hạn'
};

export const projectStatusLabels = {
  DRAFT: 'Bản nháp',
  OPEN: 'Đang mở',
  PRIVATE: 'Riêng tư',
  PRIVATE_INVITED: 'Đã mời riêng',
  OFFER_SELECTED: 'Đã chọn ứng viên',
  PAYMENT_SECURED: 'Đã giữ tiền',
  WAITING_FOR_ACCEPTANCE: 'Chờ sinh viên xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  SKETCH_SUBMITTED: 'Đã gửi sketch',
  SKETCH_APPROVED: 'Sketch đã duyệt',
  FINAL_SUBMITTED: 'Đã gửi final',
  REVISION_REQUESTED: 'Yêu cầu chỉnh sửa',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

export const offerStatusLabels = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  WAITING_ACCEPTANCE: 'Chờ sinh viên xác nhận',
  ACCEPTED: 'Sinh viên đã chấp nhận',
  REJECTED: 'Đã từ chối',
  REVOKED: 'Đã thu hồi',
  EXPIRED: 'Hết hạn'
};

export const applicationStatusLabels = {
  SUBMITTED: 'Đã gửi',
  SHORTLISTED: 'Được chọn',
  SELECTED: 'Đã chọn',
  REJECTED: 'Bị từ chối',
  OFFERED: 'Đã tạo đề nghị'
};

export const paymentStatusLabels = {
  PENDING: 'Đang chờ',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  FUNDED: 'Đã giữ tiền',
  RELEASE_PENDING: 'Chờ giải ngân',
  RELEASED: 'Đã giải ngân',
  REFUNDED: 'Đã hoàn tiền'
};

export const portfolioStatusLabels = {
  DRAFT: 'Bản nháp',
  PUBLIC: 'Công khai',
  PRIVATE: 'Riêng tư',
  HIDDEN: 'Đã ẩn'
};

export const statusColors = {
  NOT_SUBMITTED: 'default',
  PENDING: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  VERIFIED: 'success',
  ACTIVE: 'success',
  REJECTED: 'error',
  FAILED: 'error',
  INVALID_REPORTED: 'error',
  BANNED: 'error',
  SUSPENDED: 'error',
  EXPIRED: 'warning',
  DRAFT: 'default',
  PRIVATE: 'default',
  CANCELLED: 'default',
  DELETED: 'default',
  REFUNDED: 'processing',
  HIDDEN: 'default',
  OPEN: 'success',
  PUBLIC: 'success',
  PRIVATE_INVITED: 'processing',
  OFFER_SELECTED: 'processing',
  PAYMENT_SECURED: 'cyan',
  WAITING_FOR_ACCEPTANCE: 'warning',
  WAITING_ACCEPTANCE: 'warning',
  IN_PROGRESS: 'processing',
  SKETCH_SUBMITTED: 'warning',
  SKETCH_APPROVED: 'success',
  FINAL_SUBMITTED: 'warning',
  REVISION_REQUESTED: 'warning',
  COMPLETED: 'success',
  PENDING_PAYMENT: 'warning',
  ACCEPTED: 'success',
  REVOKED: 'default',
  SUBMITTED: 'processing',
  SHORTLISTED: 'processing',
  SELECTED: 'cyan',
  OFFERED: 'cyan',
  SUCCESS: 'success',
  FUNDED: 'success',
  RELEASE_PENDING: 'warning',
  RELEASED: 'success',
  AI_MATCHED: 'cyan'
};
