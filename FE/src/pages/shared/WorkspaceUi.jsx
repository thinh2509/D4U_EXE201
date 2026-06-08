import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InboxOutlined,
  StopOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Empty, Form, Input, Tag, Upload } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatCurrency, formatFileSize, getFileExtension } from '../../utils/format.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const approvedActions = new Set(['APPROVE_SKETCH', 'APPROVE_FINAL', 'AUTO_APPROVE_SKETCH', 'AUTO_APPROVE_FINAL']);

export function formatWorkspaceDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIME_ZONE
  }).format(new Date(value)).replace(',', ' ·');
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
  const isOverdue = countdown?.startsWith('Quá hạn');

  return (
    <div className={`workspace-deadline-value ${align === 'left' ? 'align-left' : 'align-right'}`}>
      <strong className="workspace-date-value">{formatWorkspaceDate(value)}</strong>
      {countdown ? (
        <span className={`workspace-countdown ${isOverdue ? 'is-overdue' : 'is-active'}`}>
          <ClockCircleOutlined />
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

function WorkspaceStatusAlert({ tone = 'info', icon, title, description, actions = null }) {
  return (
    <div className={`workspace-status-alert is-${tone}`}>
      <div className="workspace-status-alert-icon">{icon}</div>
      <div className="workspace-status-alert-copy">
        <strong>{title}</strong>
        <p>{description}</p>
        {actions ? <div className="workspace-status-alert-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

function EmptyReviewState() {
  return (
    <div className="workspace-empty-review">
      <div className="workspace-empty-review-icon">
        <InboxOutlined />
      </div>
      <div className="workspace-empty-review-copy">
        <strong>Chưa có bản mới cần xử lý</strong>
        <p>Workspace tự cập nhật mỗi 5 giây.</p>
      </div>
    </div>
  );
}

export function WorkspaceDeadlinePanel({ workspace, now }) {
  const deadlines = [
    ['Sketch', workspace.sketchDeadlineAt],
    ['Final', workspace.finalDeadlineAt],
    ['Hoàn tất review', workspace.totalDeadlineAt]
  ];

  return (
    <Card className="workspace-side-card workspace-summary-card" title="Mốc thời gian">
      <div className="workspace-deadline-timeline">
        {deadlines.map(([label, value], index) => {
          const countdown = formatCountdown(value, now);
          const isOverdue = countdown?.startsWith('Quá hạn');
          return (
            <div className={`workspace-deadline-track ${isOverdue ? 'is-overdue' : 'is-active'}`} key={label}>
              {index < deadlines.length - 1 ? <span className="workspace-deadline-track-line" /> : null}
              <span className="workspace-deadline-track-dot">
                {isOverdue ? <WarningOutlined /> : <ClockCircleOutlined />}
              </span>
              <div className="workspace-deadline-track-copy">
                <span className="workspace-summary-label">{label}</span>
                <DeadlineValue value={value} now={now} align="left" />
              </div>
            </div>
          );
        })}
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
    [
      'Hoàn thành',
      CheckCircleOutlined,
      workspace.projectStatus === 'COMPLETED'
        ? { tone: 'complete', label: 'Đã hoàn thành' }
        : workspace.projectStatus === 'CANCELLED'
          ? { tone: 'pending', label: 'Dự án đã hủy' }
          : { tone: 'pending', label: 'Chờ bàn giao' }
    ]
  ];

  return (
    <section className="workspace-timeline">
      <div className="workspace-progress-grid">
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

function getAttachmentMeta(file) {
  const size = file.size ?? file.sizeBytes ?? file.fileSize;
  const extension = getFileExtension(file.originalFilename || file.fileName || '');
  return {
    extension,
    sizeLabel: size ? formatFileSize(size) : extension ? extension.toUpperCase() : 'Tệp đính kèm'
  };
}

function AttachmentCard({ file, onDownload }) {
  const meta = getAttachmentMeta(file);

  return (
    <div className="workspace-attachment-card">
      <span className="workspace-attachment-icon" aria-hidden="true">
        {meta.extension === 'pdf' ? <FilePdfOutlined /> : <FileTextOutlined />}
      </span>
      <div className="workspace-attachment-copy">
        <strong title={file.originalFilename}>{file.originalFilename}</strong>
        <span>{meta.sizeLabel}</span>
      </div>
      <Button type="default" icon={<DownloadOutlined />} onClick={() => onDownload(file)}>
        Tải xuống
      </Button>
    </div>
  );
}

function SubmissionFiles({ files, onDownload }) {
  if (!files.length) return <span className="workspace-muted">Không có file đính kèm</span>;
  return (
    <div className="workspace-attachment-list">
      {files.map((file) => (
        <AttachmentCard key={file.id} file={file} onDownload={onDownload} />
      ))}
    </div>
  );
}

function SubmissionRecord({ submission, reviewActions, onDownload, isLatestWaiting }) {
  const feedback = getSubmissionFeedback(submission, reviewActions);
  const title = submission.submissionType === 'REVISION'
    ? `Bản chỉnh sửa #${submission.revisionRound}`
    : `Bản ${submission.milestoneType}`;
  const approvedAt = submission.approvedAt || submission.autoApprovedAt;

  return (
    <article className={`workspace-submission-record ${isLatestWaiting ? 'is-waiting' : ''}`}>
      <div className="workspace-submission-top">
        <div className="workspace-submission-heading">
          <div className="workspace-submission-title-row">
            <h4 className="workspace-submission-title">{title}</h4>
            <StatusBadge status={submission.status} />
            {isLatestWaiting ? <Tag color="processing">Đang chờ SME duyệt</Tag> : null}
          </div>
          <div className="workspace-submission-meta-grid">
            <div>
              <span>Student nộp</span>
              <strong>{formatWorkspaceDate(submission.submittedAt)}</strong>
            </div>
            <div>
              <span>SME duyệt</span>
              <strong>{approvedAt ? formatWorkspaceDate(approvedAt) : 'Chưa duyệt'}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{submission.status}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="workspace-submission-body">
        <div className="workspace-submission-content">
          <span className="workspace-summary-label">Mô tả</span>
          <p className="workspace-submission-description">{submission.description || 'Không có mô tả.'}</p>
        </div>

        <div className="workspace-submission-content">
          <span className="workspace-summary-label">File đính kèm</span>
          <SubmissionFiles files={submission.files} onDownload={onDownload} />
        </div>

        {feedback.length ? (
          <div className="workspace-feedback-list">
            {feedback.map((item) => (
              <div className="workspace-feedback-item" key={item.id}>
                <div className="workspace-feedback-head">
                  <strong className={approvedActions.has(item.action) ? 'text-emerald-700' : 'text-amber-700'}>
                    {approvedActions.has(item.action)
                      ? 'SME đã duyệt bài'
                      : item.action === 'REPORT_INVALID_FILE'
                        ? 'SME báo file lỗi'
                        : 'SME yêu cầu chỉnh sửa'}
                  </strong>
                  <span>{formatWorkspaceDate(item.createdAt)}</span>
                </div>
                {item.requestedChanges || item.comment || item.invalidFileReason ? (
                  <p>{item.requestedChanges || item.comment || item.invalidFileReason}</p>
                ) : null}
                {item.reuploadDueAt || item.dueAt ? (
                  <p className="workspace-feedback-deadline">Hạn nộp lại: {formatWorkspaceDate(item.reuploadDueAt || item.dueAt)}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="workspace-submission-footer">
        {approvedAt ? (
          <span className="workspace-submission-footer-state is-approved">
            <CheckCircleOutlined />
            SME đã duyệt bài · {formatWorkspaceDate(approvedAt)}
          </span>
        ) : isLatestWaiting ? (
          <span className="workspace-submission-footer-state is-waiting">
            <ClockCircleOutlined />
            Đang chờ SME duyệt
          </span>
        ) : (
          <span className="workspace-submission-footer-state">
            <FileDoneOutlined />
            Theo dõi trong workflow hiện tại
          </span>
        )}
      </div>
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
        <p>Sketch, các lần chỉnh sửa và Final được nhóm theo milestone để SME review nhanh hơn.</p>
      </div>
      <div className="workspace-milestone-grid">
        {['SKETCH', 'FINAL'].map((milestoneType) => {
          const milestoneSubmissions = submissions
            .filter((item) => item.milestoneType === milestoneType)
            .sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt));

          return (
            <section className="workspace-milestone-column" key={milestoneType}>
              <div className="workspace-milestone-header">
                <div>
                  <h3 className="workspace-milestone-title">{milestoneType}</h3>
                  <p>{milestoneSubmissions.length ? 'Toàn bộ lượt nộp của milestone này' : 'Chưa có file được gửi lên'}</p>
                </div>
                <span className="workspace-milestone-count">{milestoneSubmissions.length} lần nộp</span>
              </div>
              {milestoneSubmissions.length ? (
                <div className="workspace-milestone-records">
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
                <div className="workspace-empty-column">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`Student chưa nộp ${milestoneType}`} />
                </div>
              )}
            </section>
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
      <div className="workspace-action-head">
        <div>
          <Tag color={canSubmit ? 'processing' : 'success'}>{canSubmit ? milestoneType : 'ĐANG THEO DÕI'}</Tag>
          <h2 className="workspace-action-title">
            {canSubmit ? `Nộp ${milestoneType === 'SKETCH' ? 'Sketch' : milestoneType === 'FINAL' ? 'Final' : 'bản chỉnh sửa'}` : 'Đang chờ SME duyệt bài'}
          </h2>
        </div>
        <div className="workspace-action-deadline">
          <span className="workspace-summary-label">{deadline.label}</span>
          <DeadlineValue value={deadline.value} now={now} align="left" />
        </div>
      </div>

      {workspace.projectStatus === 'CANCELLED' ? (
        <WorkspaceStatusAlert
          tone="warning"
          icon={<WarningOutlined />}
          title="Dự án đã hủy"
          description="Xem phần tổng quan để biết tỷ lệ chia escrow và trạng thái hoàn SME thủ công."
        />
      ) : !canSubmit ? (
        <WorkspaceStatusAlert
          tone="info"
          icon={<ClockCircleOutlined />}
          title="Bạn đang chờ duyệt"
          description={latestSubmission ? `SME sẽ review trước ${formatWorkspaceDate(latestSubmission.reviewDueAt)}.` : 'Workspace tự cập nhật mỗi 5 giây.'}
          actions={canAbandon ? (
            <Button danger icon={<StopOutlined />} loading={acting} onClick={onAbandon}>
              Bỏ dự án
            </Button>
          ) : null}
        />
      ) : (
        <Form form={form} layout="vertical" className="workspace-submit-form">
          <Form.Item label="Mô tả bản nộp" name="description">
            <Input.TextArea rows={4} placeholder="Tóm tắt nội dung để SME review nhanh hơn" />
          </Form.Item>
          <Upload beforeUpload={onAddFile} fileList={[]} accept=".jpg,.png,.pdf" multiple>
            <Button icon={<UploadOutlined />}>Chọn file nộp bài</Button>
          </Upload>
          <div className="workspace-upload-drafts">
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
          <div className="workspace-action-buttons">
            <Button type="primary" icon={<UploadOutlined />} loading={acting} onClick={onSubmit}>
              Xác nhận nộp bài
            </Button>
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
        <WorkspaceStatusAlert
          tone={paymentReturnTimedOut ? 'warning' : 'info'}
          icon={paymentReturnTimedOut ? <WarningOutlined /> : <CreditCardOutlined />}
          title={paymentReturnTimedOut ? 'PayOS chưa xác nhận giao dịch' : paymentPending ? 'Đang chờ PayOS xác nhận' : 'Thanh toán escrow qua PayOS'}
          description={paymentReturnTimedOut
            ? 'Bạn có thể bấm kiểm tra lại. D4U chỉ bắt đầu dự án khi backend xác nhận trạng thái thanh toán.'
            : 'Escrow cần được funding trước khi Student bắt đầu nộp bài.'}
          actions={(
            <>
              <Button type="primary" icon={<CreditCardOutlined />} loading={acting} onClick={onPayment}>
                {paymentPending && hasCheckoutUrl ? 'Mở lại PayOS' : paymentPending ? 'Tạo link PayOS mới' : 'Mở thanh toán PayOS'}
              </Button>
              {paymentPending ? (
                <Button loading={checkingPayment} onClick={onCheckPayment}>
                  Kiểm tra lại thanh toán
                </Button>
              ) : null}
            </>
          )}
        />
      </Card>
    );
  }

  if (!canReview) {
    return (
      <Card className="workspace-action-card" title="Bản đang chờ duyệt">
        <EmptyReviewState />
      </Card>
    );
  }

  return (
    <Card className="workspace-action-card" title="Bản đang chờ duyệt">
      <div className="workspace-action-head">
        <div>
          <Tag color="processing">{latestSubmission.milestoneType}</Tag>
          <h2 className="workspace-action-title">
            {latestSubmission.submissionType === 'REVISION' ? 'Bản chỉnh sửa mới nhất' : `Bản ${latestSubmission.milestoneType} mới nhất`}
          </h2>
        </div>
        <div className="workspace-action-deadline">
          <span className="workspace-summary-label">Hạn SME duyệt bài</span>
          <DeadlineValue value={latestSubmission.reviewDueAt} now={now} />
        </div>
      </div>

      <div className="workspace-summary-grid compact">
        <div className="workspace-summary-item">
          <span className="workspace-summary-label">Nộp lúc</span>
          <strong>{formatWorkspaceDate(latestSubmission.submittedAt)}</strong>
        </div>
        <div className="workspace-summary-item">
          <span className="workspace-summary-label">Vòng audit</span>
          <strong>{latestSubmission.revisionRound}</strong>
        </div>
        <div className="workspace-summary-item span-full">
          <span className="workspace-summary-label">Mô tả</span>
          <strong>{latestSubmission.description || 'Không có mô tả'}</strong>
        </div>
      </div>

      <div className="workspace-submission-content">
        <span className="workspace-summary-label">File đính kèm</span>
        <SubmissionFiles files={latestSubmission.files} onDownload={onDownload} />
      </div>

      <div className="workspace-action-buttons">
        <Button type="primary" icon={<CheckCircleOutlined />} loading={acting} onClick={onApprove}>
          Duyệt bài
        </Button>
        <Button icon={<FileDoneOutlined />} onClick={onRevision}>
          Yêu cầu chỉnh sửa
        </Button>
        <Button danger icon={<WarningOutlined />} onClick={onInvalid}>
          Báo file lỗi
        </Button>
      </div>
    </Card>
  );
}

function SummaryGroup({ title, rows }) {
  return (
    <section className="workspace-summary-group">
      <div className="workspace-summary-group-head">
        <span>{title}</span>
      </div>
      <div className="workspace-summary-group-rows">
        {rows.map(([label, value]) => (
          <div className="workspace-summary-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WorkspaceSummaryPanel({ workspace }) {
  return (
    <Card className="workspace-side-card workspace-summary-card" title="Tổng quan dự án">
      <div className="workspace-summary-groups">
        <SummaryGroup
          title="Vai trò & thành viên"
          rows={[
            ['Project', <StatusBadge status={workspace.projectStatus} />],
            ['Vai trò', workspace.viewerRole],
            ...(workspace.offer?.studentFullName ? [['Student', workspace.offer.studentFullName]] : [])
          ]}
        />
        <SummaryGroup
          title="Ngân sách & feedback"
          rows={[
            ['Ngân sách', formatCurrency(workspace.budgetAmount, workspace.currency)],
            ['Feedback đã ghi nhận', workspace.currentRevisionRound]
          ]}
        />
        <SummaryGroup
          title="Offer / Payment / Escrow"
          rows={[
            ['Offer', workspace.offer ? <StatusBadge status={workspace.offer.status} /> : 'Chưa có'],
            ['Payment', workspace.payment ? <StatusBadge status={workspace.payment.status} /> : 'Chưa có'],
            ['Escrow', workspace.escrow ? <StatusBadge status={workspace.escrow.status} /> : 'Chưa có'],
            ...(workspace.refund
              ? [
                  ['Refund', <StatusBadge status={workspace.refund.status} />],
                  ['Hoàn SME', formatCurrency(workspace.refund.amount, workspace.refund.currency)]
                ]
              : [])
          ]}
        />
      </div>
    </Card>
  );
}
