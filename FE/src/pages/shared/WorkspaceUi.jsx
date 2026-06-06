import {
  CheckCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  StopOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Tag, Upload } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatCurrency, formatFileSize, getFileExtension } from '../../utils/format.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const approvedActions = new Set(['APPROVE_SKETCH', 'APPROVE_FINAL', 'AUTO_APPROVE_SKETCH', 'AUTO_APPROVE_FINAL']);

export function formatWorkspaceDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TIME_ZONE
  }).format(new Date(value));
}

export function formatCountdown(value, now = Date.now()) {
  if (!value) return null;
  const difference = new Date(value).getTime() - now;
  const overdue = difference < 0;
  const totalMinutes = Math.max(1, Math.ceil(Math.abs(difference) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days} ngày`);
  if (hours && parts.length < 2) parts.push(`${hours} giờ`);
  if (!days && minutes && parts.length < 2) parts.push(`${minutes} phút`);
  return `${overdue ? 'Quá hạn' : 'Còn'} ${parts.join(' ')}`;
}

function DeadlineValue({ value, now, align = 'right' }) {
  const countdown = formatCountdown(value, now);
  return (
    <div className={`grid gap-0.5 ${align === 'left' ? 'justify-items-start text-left' : 'justify-items-end text-right'}`}>
      <strong className="workspace-date-value">{formatWorkspaceDate(value)}</strong>
      {countdown ? (
        <span className={`workspace-countdown ${countdown.startsWith('Quá hạn') ? 'is-overdue' : 'is-active'}`}>
          {countdown}
        </span>
      ) : null}
    </div>
  );
}

function resolveActiveDeadline(workspace, latestSubmission, latestReviewAction) {
  if (latestSubmission?.reviewDueAt && ['SUBMITTED', 'VALID'].includes(latestSubmission.status)) {
    return { label: 'Hạn SME duyệt bài', value: latestSubmission.reviewDueAt };
  }
  if (workspace.nextAction === 'SUBMIT_REVISION') {
    const value = latestReviewAction?.reuploadDueAt || latestReviewAction?.dueAt;
    if (value) return { label: 'Hạn Student nộp lại', value };
  }
  if (workspace.nextAction === 'PAY_ESCROW' && workspace.offer?.paymentDueAt) {
    return { label: 'Hạn thanh toán escrow', value: workspace.offer.paymentDueAt };
  }
  if (workspace.nextAction === 'WAIT_STUDENT_ACCEPT' && workspace.offer?.expiresAt) {
    return { label: 'Hạn Student xác nhận offer', value: workspace.offer.expiresAt };
  }
  if (workspace.nextAction === 'SUBMIT_SKETCH') return { label: 'Hạn nộp Sketch', value: workspace.sketchDeadlineAt };
  if (workspace.nextAction === 'SUBMIT_FINAL') return { label: 'Hạn nộp Final', value: workspace.finalDeadlineAt };
  return { label: 'Hạn hoàn tất review', value: workspace.totalDeadlineAt };
}

export function WorkspaceDeadlinePanel({ workspace, now }) {
  const deadlines = [
    ['Sketch', workspace.sketchDeadlineAt],
    ['Final', workspace.finalDeadlineAt],
    ['Hoàn tất review', workspace.totalDeadlineAt]
  ];
  return (
    <Card className="workspace-side-card" title="Mốc thời gian">
      <div className="grid gap-4">
        {deadlines.map(([label, value], index) => (
          <div className={`workspace-deadline-row ${index < deadlines.length - 1 ? 'has-divider' : ''}`} key={label}>
            <span className="workspace-label">{label}</span>
            <DeadlineValue value={value} now={now} align="left" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function getMilestoneState(workspace, submissions, milestoneType) {
  const milestoneSubmissions = submissions.filter((item) => item.milestoneType === milestoneType);
  const approved = milestoneSubmissions.some((item) => item.status === 'APPROVED');
  const waiting = milestoneSubmissions.some((item) => ['SUBMITTED', 'VALID'].includes(item.status));
  const needsRevision = milestoneSubmissions.some((item) => ['REVISION_REQUESTED', 'INVALID_REPORTED'].includes(item.status));
  const isStudent = workspace.viewerRole === 'STUDENT';
  const milestoneLabel = milestoneType === 'SKETCH' ? 'Sketch' : 'Final';
  if (approved) return { tone: 'complete', label: 'Đã duyệt' };
  if (waiting) return { tone: 'active', label: isStudent ? 'Chờ SME duyệt' : `Cần duyệt ${milestoneLabel}` };
  if (workspace.nextAction === 'SUBMIT_REVISION' && needsRevision) {
    return { tone: 'active', label: isStudent ? 'Cần nộp bản chỉnh sửa' : 'Chờ Student nộp lại' };
  }
  if (workspace.nextAction === `SUBMIT_${milestoneType}`) {
    return { tone: 'active', label: isStudent ? `Cần nộp ${milestoneLabel}` : 'Chờ Student nộp' };
  }
  return { tone: 'pending', label: 'Chưa bắt đầu' };
}

export function WorkspaceProgressTimeline({ workspace, submissions }) {
  const steps = [
    ['Sketch', FileTextOutlined, getMilestoneState(workspace, submissions, 'SKETCH')],
    ['Final', FileDoneOutlined, getMilestoneState(workspace, submissions, 'FINAL')],
    ['Hoàn thành', CheckCircleOutlined, workspace.projectStatus === 'COMPLETED'
      ? { tone: 'complete', label: 'Đã hoàn thành' }
      : workspace.projectStatus === 'CANCELLED'
        ? { tone: 'pending', label: 'Dự án đã hủy' }
      : { tone: 'pending', label: 'Chờ bàn giao' }]
  ];
  return (
    <section className="workspace-timeline">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0">
        {steps.map(([title, Icon, state], index) => (
          <div className={`workspace-timeline-step ${state.tone === 'active' ? 'is-active' : ''}`} key={title}>
            {index < steps.length - 1 ? (
              <span className={`workspace-timeline-line ${state.tone === 'complete' ? 'is-complete' : ''}`} />
            ) : null}
            <span className={`workspace-timeline-icon is-${state.tone}`}>
              {state.tone === 'complete' ? <CheckCircleOutlined /> : <Icon />}
            </span>
            <div className="workspace-timeline-copy">
              <strong>{title}</strong>
              <span className={state.tone === 'active' ? 'is-active' : ''}>{state.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getSubmissionFeedback(submission, reviewActions) {
  return reviewActions
    .filter((item) => item.submissionId === submission.id)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function SubmissionFiles({ files, onDownload }) {
  if (!files.length) return <span className="workspace-muted">Không có file đính kèm</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => (
        <Button key={file.id} icon={<DownloadOutlined />} onClick={() => onDownload(file)}>
          {file.originalFilename}
        </Button>
      ))}
    </div>
  );
}

function SubmissionRecord({ submission, reviewActions, onDownload, isLatestWaiting }) {
  const feedback = getSubmissionFeedback(submission, reviewActions);
  const title = submission.submissionType === 'REVISION'
    ? `Bản chỉnh sửa #${submission.revisionRound}`
    : `Bản ${submission.milestoneType}`;
  return (
    <article className={`workspace-submission-record ${isLatestWaiting ? 'is-waiting' : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="workspace-submission-title">{title}</h4>
            <StatusBadge status={submission.status} />
            {isLatestWaiting ? <Tag color="processing">Đang chờ SME duyệt</Tag> : null}
          </div>
          <p className="workspace-submission-meta">Student nộp lúc {formatWorkspaceDate(submission.submittedAt)}</p>
          {submission.approvedAt || submission.autoApprovedAt ? (
            <p className="mb-0 mt-1 text-xs text-emerald-700">Duyệt lúc {formatWorkspaceDate(submission.approvedAt || submission.autoApprovedAt)}</p>
          ) : null}
        </div>
      </div>
      <p className="workspace-submission-description">{submission.description || 'Không có mô tả.'}</p>
      <SubmissionFiles files={submission.files} onDownload={onDownload} />
      {feedback.length ? (
        <div className="workspace-feedback-list">
          {feedback.map((item) => (
            <div className="workspace-feedback-item" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className={approvedActions.has(item.action) ? 'text-emerald-700' : 'text-amber-700'}>
                  {approvedActions.has(item.action) ? 'SME đã duyệt bài' : item.action === 'REPORT_INVALID_FILE' ? 'SME báo file lỗi' : 'SME yêu cầu chỉnh sửa'}
                </strong>
                <span>{formatWorkspaceDate(item.createdAt)}</span>
              </div>
              {item.requestedChanges || item.comment || item.invalidFileReason ? (
                <p className="mb-0 mt-1">{item.requestedChanges || item.comment || item.invalidFileReason}</p>
              ) : null}
              {item.reuploadDueAt || item.dueAt ? (
                <p className="mb-0 mt-1 font-bold text-amber-700">Hạn nộp lại: {formatWorkspaceDate(item.reuploadDueAt || item.dueAt)}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function SubmissionMilestoneBoard({ submissions, reviewActions, onDownload }) {
  const latestWaitingId = [...submissions]
    .sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt))
    .find((item) => ['SUBMITTED', 'VALID'].includes(item.status))?.id;
  return (
    <section className="workspace-submission-board">
      <div className="workspace-board-header">
        <h2>Bài Student đã nộp</h2>
        <p>Sketch, các lần chỉnh sửa và Final được nhóm theo milestone để dễ kiểm tra file.</p>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {['SKETCH', 'FINAL'].map((milestoneType) => {
          const milestoneSubmissions = submissions
            .filter((item) => item.milestoneType === milestoneType)
            .sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt));
          return (
            <div className="workspace-milestone-column" key={milestoneType}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="workspace-milestone-title">{milestoneType}</h3>
                <span className="workspace-muted">{milestoneSubmissions.length} lần nộp</span>
              </div>
              {milestoneSubmissions.length ? (
                <div className="grid gap-3">
                  {milestoneSubmissions.map((submission) => (
                    <SubmissionRecord
                      isLatestWaiting={submission.id === latestWaitingId}
                      key={submission.id}
                      onDownload={onDownload}
                      reviewActions={reviewActions}
                      submission={submission}
                    />
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Student chưa nộp ${milestoneType}`} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function StudentSubmissionWorkspace({
  workspace, canSubmit, milestoneType, latestSubmission, latestReviewAction, now, form, draftFiles, acting,
  canAbandon, onAddFile, onRemoveFile, onSubmit, onAbandon
}) {
  const deadline = resolveActiveDeadline(workspace, latestSubmission, latestReviewAction);
  return (
    <Card className="workspace-action-card" title="Việc cần làm tiếp theo">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Tag color={canSubmit ? 'processing' : 'success'}>{canSubmit ? milestoneType : 'ĐANG THEO DÕI'}</Tag>
          <h2 className="workspace-action-title">
            {canSubmit ? `Nộp ${milestoneType === 'SKETCH' ? 'Sketch' : milestoneType === 'FINAL' ? 'Final' : 'bản chỉnh sửa'}` : 'Đang chờ SME duyệt bài'}
          </h2>
        </div>
        <div>
          <span className="workspace-label">{deadline.label}</span>
          <DeadlineValue value={deadline.value} now={now} align="left" />
        </div>
      </div>
      {workspace.projectStatus === 'CANCELLED' ? (
        <Alert type="warning" showIcon message="Dự án đã hủy" description="Xem phần tổng quan để biết tỷ lệ chia escrow và trạng thái hoàn SME thủ công." />
      ) : !canSubmit ? (
        <div className="grid gap-3">
          <Alert type="info" showIcon message={latestSubmission ? `SME sẽ review trước ${formatWorkspaceDate(latestSubmission.reviewDueAt)}.` : 'Workspace tự cập nhật sau mỗi 5 giây.'} />
          {canAbandon ? (
            <Button danger icon={<StopOutlined />} loading={acting} onClick={onAbandon}>
              Bỏ dự án
            </Button>
          ) : null}
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item label="Mô tả bản nộp" name="description">
            <Input.TextArea rows={4} placeholder="Tóm tắt nội dung để SME review nhanh hơn" />
          </Form.Item>
          <Upload beforeUpload={onAddFile} fileList={[]} accept=".jpg,.png,.pdf" multiple>
            <Button icon={<UploadOutlined />}>Chọn file nộp bài</Button>
          </Upload>
          <div className="my-3 grid gap-2">
            {draftFiles.map((file) => (
              <div className="workspace-file-row" key={file.uid}>
                <FileTextOutlined />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <strong>{file.name}</strong>
                  <span>{getFileExtension(file.name).toUpperCase()} · {formatFileSize(file.size)}</span>
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${file.name}`} onClick={() => onRemoveFile(file.uid)} />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="primary" icon={<UploadOutlined />} loading={acting} onClick={onSubmit}>Xác nhận nộp bài</Button>
            {canAbandon ? (
              <Button danger icon={<StopOutlined />} loading={acting} onClick={onAbandon}>
                Bỏ dự án
              </Button>
            ) : null}
          </div>
        </Form>
      )}
    </Card>
  );
}

export function SmeReviewWorkspace({
  workspace,
  canReview,
  latestSubmission,
  now,
  acting,
  paymentReturnTimedOut,
  checkingPayment,
  onPayment,
  onCheckPayment,
  onDownload,
  onApprove,
  onRevision,
  onInvalid
}) {
  if (workspace.nextAction === 'PAY_ESCROW' && workspace.nextActionRole === 'SME') {
    const paymentPending = workspace.payment?.status === 'PENDING';
    const hasCheckoutUrl = Boolean(workspace.payment?.checkoutUrl);

    return (
      <Card className="workspace-action-card" title="Việc cần làm tiếp theo">
        <Alert
          type={paymentReturnTimedOut ? 'warning' : 'info'}
          showIcon
          message={paymentReturnTimedOut ? 'PayOS chưa xác nhận giao dịch' : paymentPending ? 'Đang chờ PayOS xác nhận' : 'Thanh toán escrow qua PayOS'}
          description={paymentReturnTimedOut ? 'Bạn có thể bấm kiểm tra lại. D4U chỉ bắt đầu dự án khi backend xác nhận trạng thái thanh toán.' : 'Escrow cần được funding trước khi Student bắt đầu nộp bài.'}
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="primary" icon={<CreditCardOutlined />} loading={acting} onClick={onPayment}>
            {paymentPending && hasCheckoutUrl ? 'Mở lại PayOS' : paymentPending ? 'Tạo link PayOS mới' : 'Mở thanh toán PayOS'}
          </Button>
          {paymentPending ? (
            <Button loading={checkingPayment} onClick={onCheckPayment}>
              Kiểm tra lại thanh toán
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }
  if (!canReview) {
    return <Card className="workspace-action-card" title="Bản đang chờ duyệt"><Alert type="info" showIcon message="Chưa có bản mới cần xử lý" description="Workspace tự cập nhật sau mỗi 5 giây." /></Card>;
  }
  return (
    <Card className="workspace-action-card" title="Bản đang chờ duyệt">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><Tag color="processing">{latestSubmission.milestoneType}</Tag><h2 className="workspace-action-title">{latestSubmission.submissionType === 'REVISION' ? 'Bản chỉnh sửa mới nhất' : `Bản ${latestSubmission.milestoneType} mới nhất`}</h2></div>
        <DeadlineValue value={latestSubmission.reviewDueAt} now={now} />
      </div>
      <Descriptions column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label="Nộp lúc">{formatWorkspaceDate(latestSubmission.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="Vòng audit">{latestSubmission.revisionRound}</Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>{latestSubmission.description || 'Không có mô tả'}</Descriptions.Item>
      </Descriptions>
      <div className="my-4"><SubmissionFiles files={latestSubmission.files} onDownload={onDownload} /></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="primary" icon={<CheckCircleOutlined />} loading={acting} onClick={onApprove}>Duyệt bài</Button>
        <Button icon={<FileDoneOutlined />} onClick={onRevision}>Yêu cầu chỉnh sửa</Button>
        <Button danger icon={<WarningOutlined />} onClick={onInvalid}>Báo file lỗi</Button>
      </div>
    </Card>
  );
}

export function WorkspaceSummaryPanel({ workspace }) {
  return (
    <Card className="workspace-side-card" title="Tổng quan dự án">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Project"><StatusBadge status={workspace.projectStatus} /></Descriptions.Item>
        <Descriptions.Item label="Vai trò">{workspace.viewerRole}</Descriptions.Item>
        {workspace.offer?.studentFullName ? <Descriptions.Item label="Student">{workspace.offer.studentFullName}</Descriptions.Item> : null}
        <Descriptions.Item label="Ngân sách">{formatCurrency(workspace.budgetAmount, workspace.currency)}</Descriptions.Item>
        <Descriptions.Item label="Feedback đã ghi nhận">{workspace.currentRevisionRound}</Descriptions.Item>
        <Descriptions.Item label="Offer">{workspace.offer ? <StatusBadge status={workspace.offer.status} /> : 'Chưa có'}</Descriptions.Item>
        <Descriptions.Item label="Payment">{workspace.payment ? <StatusBadge status={workspace.payment.status} /> : 'Chưa có'}</Descriptions.Item>
        <Descriptions.Item label="Escrow">{workspace.escrow ? <StatusBadge status={workspace.escrow.status} /> : 'Chưa có'}</Descriptions.Item>
        {workspace.refund ? (
          <>
            <Descriptions.Item label="Refund"><StatusBadge status={workspace.refund.status} /></Descriptions.Item>
            <Descriptions.Item label="Hoàn SME">{formatCurrency(workspace.refund.amount, workspace.refund.currency)}</Descriptions.Item>
          </>
        ) : null}
      </Descriptions>
    </Card>
  );
}
