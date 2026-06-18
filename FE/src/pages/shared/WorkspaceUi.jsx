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
import { Button, Card, Empty, Form, Input, Tag, Upload } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatCurrency, formatFileSize, getFileExtension } from '../../utils/format.js';
import { getRatingStateMeta } from '../../utils/ratingState.js';

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

function getMilestoneSummary(submissions, milestoneType) {
  const milestoneSubmissions = submissions.filter((item) => item.milestoneType === milestoneType);
  const approved = milestoneSubmissions.some((item) => item.status === 'APPROVED');
  const waiting = milestoneSubmissions.some((item) => ['SUBMITTED', 'VALID'].includes(item.status));
  const needsRevision = milestoneSubmissions.some((item) => ['REVISION_REQUESTED', 'INVALID_REPORTED'].includes(item.status));

  if (approved) return { tone: 'success', label: 'Đã duyệt' };
  if (waiting) return { tone: 'processing', label: 'Đang chờ duyệt' };
  if (needsRevision) return { tone: 'warning', label: 'Cần nộp lại' };
  return { tone: 'default', label: 'Chưa có bài nộp' };
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

function DeadlinePill({ value, now }) {
  const countdown = formatCountdown(value, now);
  const isOverdue = countdown?.startsWith('Quá hạn');

  return (
    <div className="workspace-v3-deadline-pill">
      <strong>{formatWorkspaceDate(value)}</strong>
      {countdown ? (
        <span className={`workspace-v3-countdown ${isOverdue ? 'is-overdue' : 'is-active'}`}>
          <ClockCircleOutlined />
          {countdown}
        </span>
      ) : null}
    </div>
  );
}

function StatusBlock({ eyebrow, title, description, actions, tone = 'info', icon }) {
  return (
    <div className={`workspace-v3-status-block is-${tone}`}>
      <div className="workspace-v3-status-block-icon">{icon}</div>
      <div className="workspace-v3-status-block-copy">
        <span className="workspace-v3-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <p>{description}</p>
        {actions ? <div className="workspace-v3-action-row">{actions}</div> : null}
      </div>
    </div>
  );
}

function EmptyReviewState() {
  return (
    <div className="workspace-v3-empty-state">
      <div className="workspace-v3-empty-state-icon">
        <InboxOutlined />
      </div>
      <div className="workspace-v3-empty-state-copy">
        <strong>Chưa có bản mới cần xử lý</strong>
        <p>Workspace tự cập nhật mỗi 5 giây.</p>
      </div>
    </div>
  );
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
    <section className="workspace-v3-stepper">
      <div className="workspace-v3-stepper-head">
        <div>
          <span className="workspace-v3-eyebrow">Milestone hiện tại</span>
          <h2>Tiến trình review theo milestone</h2>
        </div>
        <p>Từ Sketch đến Final và hoàn tất, từng bước đều phản ánh đúng trạng thái hiện tại của dự án.</p>
      </div>

      <div className="workspace-v3-stepper-grid">
        {steps.map(([title, Icon, state], index) => (
          <div className={`workspace-v3-step ${state.tone === 'active' ? 'is-active' : ''}`} key={title}>
            {index < steps.length - 1 ? (
              <span className={`workspace-v3-step-line ${state.tone === 'complete' ? 'is-complete' : ''}`} />
            ) : null}
            <span className={`workspace-v3-step-node is-${state.tone}`}>
              {state.tone === 'complete' ? <CheckCircleOutlined /> : <Icon />}
            </span>
            <div className="workspace-v3-step-copy">
              <strong>{title}</strong>
              <span>{state.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NextActionFrame({ tag, title, description, deadlineLabel, deadlineValue, children }) {
  return (
    <section className="workspace-v3-next-action">
      <div className="workspace-v3-next-action-head">
        <div className="workspace-v3-next-action-copy">
          <span className="workspace-v3-eyebrow">Việc cần làm tiếp theo</span>
          <div className="workspace-v3-next-action-title-row">
            {tag}
            <h2>{title}</h2>
          </div>
          {description ? <p>{description}</p> : null}
        </div>

        {deadlineLabel && deadlineValue ? (
          <div className="workspace-v3-next-action-side">
            <span className="workspace-v3-label">{deadlineLabel}</span>
            {deadlineValue}
          </div>
        ) : null}
      </div>
      <div className="workspace-v3-next-action-body">
        <div className="workspace-v3-next-action-surface">{children}</div>
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
    <div className="workspace-v3-attachment-card">
      <span className="workspace-v3-attachment-icon" aria-hidden="true">
        {meta.extension === 'pdf' ? <FilePdfOutlined /> : <FileTextOutlined />}
      </span>
      <div className="workspace-v3-attachment-copy">
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
  if (!files.length) return <span className="workspace-v3-muted">Không có file đính kèm</span>;

  return (
    <div className="workspace-v3-attachment-list">
      {files.map((file) => (
        <AttachmentCard key={file.id} file={file} onDownload={onDownload} />
      ))}
    </div>
  );
}

function FeedbackCard({ item }) {
  return (
    <div className="workspace-v3-feedback-card">
      <div className="workspace-v3-feedback-head">
        <strong className={approvedActions.has(item.action) ? 'is-success' : 'is-warning'}>
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
        <p className="workspace-v3-feedback-deadline">
          Hạn nộp lại: {formatWorkspaceDate(item.reuploadDueAt || item.dueAt)}
        </p>
      ) : null}
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
    <article className={`workspace-v3-submission-card ${isLatestWaiting ? 'is-waiting' : ''}`}>
      <div className="workspace-v3-submission-accent" />
      <div className="workspace-v3-submission-head">
        <div className="workspace-v3-submission-head-main">
          <div className="workspace-v3-submission-title-row">
            <h4>{title}</h4>
            <StatusBadge status={submission.status} />
            {isLatestWaiting ? <Tag color="processing">Đang chờ SME duyệt</Tag> : null}
          </div>
          <span className="workspace-v3-caption">
            {submission.submissionType === 'REVISION' ? 'Revision submission' : 'Milestone submission'}
          </span>
        </div>
        <span className="workspace-v3-submission-side-state">
          {approvedAt ? 'Đã duyệt' : isLatestWaiting ? 'Chờ duyệt' : submission.status}
        </span>
      </div>

      <div className="workspace-v3-meta-strip">
        <div className="workspace-v3-meta-item">
          <span>Student nộp</span>
          <strong>{formatWorkspaceDate(submission.submittedAt)}</strong>
        </div>
        <div className="workspace-v3-meta-item">
          <span>SME duyệt</span>
          <strong>{approvedAt ? formatWorkspaceDate(approvedAt) : 'Chưa duyệt'}</strong>
        </div>
        <div className="workspace-v3-meta-item">
          <span>Trạng thái</span>
          <strong>{submission.status}</strong>
        </div>
      </div>

      <div className="workspace-v3-content-block">
        <span className="workspace-v3-label">Mô tả</span>
        <p>{submission.description || 'Không có mô tả.'}</p>
      </div>

      <div className="workspace-v3-content-block">
        <span className="workspace-v3-label">File đính kèm</span>
        <SubmissionFiles files={submission.files} onDownload={onDownload} />
      </div>

      {feedback.length ? (
        <div className="workspace-v3-feedback-list">
          {feedback.map((item) => (
            <FeedbackCard item={item} key={item.id} />
          ))}
        </div>
      ) : null}

      <div className="workspace-v3-submission-footer">
        {approvedAt ? (
          <span className="workspace-v3-footer-state is-success">
            <CheckCircleOutlined />
            SME đã duyệt bài · {formatWorkspaceDate(approvedAt)}
          </span>
        ) : isLatestWaiting ? (
          <span className="workspace-v3-footer-state is-info">
            <ClockCircleOutlined />
            Đang chờ SME duyệt
          </span>
        ) : (
          <span className="workspace-v3-footer-state">
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
    <section className="workspace-v3-submission-section">
      <div className="workspace-v3-section-head">
        <div>
          <span className="workspace-v3-eyebrow">Submission review</span>
          <h2>Bài Student đã nộp</h2>
        </div>
        <p>Sketch, các lần chỉnh sửa và Final được nhóm theo milestone để SME review theo đúng trình tự công việc.</p>
      </div>

      <div className="workspace-v3-milestone-grid">
        {['SKETCH', 'FINAL'].map((milestoneType) => {
          const milestoneSubmissions = submissions
            .filter((item) => item.milestoneType === milestoneType)
            .sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt));
          const summary = getMilestoneSummary(submissions, milestoneType);

          return (
            <section className="workspace-v3-milestone-column" key={milestoneType}>
              <div className="workspace-v3-milestone-head">
                <div>
                  <h3>{milestoneType === 'SKETCH' ? 'Sketch review' : 'Final review'}</h3>
                  <p>{milestoneSubmissions.length ? 'Tất cả lượt nộp của milestone này được gom lại để kiểm tra tuần tự.' : 'Milestone này chưa có bài nộp nào được gửi lên.'}</p>
                </div>
                <div className="workspace-v3-milestone-meta">
                  <Tag color={summary.tone}>{summary.label}</Tag>
                  <span>{milestoneSubmissions.length} lần nộp</span>
                </div>
              </div>

              {milestoneSubmissions.length ? (
                <div className="workspace-v3-milestone-records">
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
                <div className="workspace-v3-empty-column">
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
  workspace,
  canSubmit,
  milestoneType,
  latestSubmission,
  latestReviewAction,
  now,
  form,
  draftFiles,
  acting,
  canAbandon,
  onAddFile,
  onRemoveFile,
  onSubmit,
  onAbandon
}) {
  const deadline = resolveActiveDeadline(workspace, latestSubmission, latestReviewAction);

  return (
    <NextActionFrame
      tag={<Tag color={canSubmit ? 'processing' : 'success'}>{canSubmit ? milestoneType : 'ĐANG THEO DÕI'}</Tag>}
      title={canSubmit ? `Nộp ${milestoneType === 'SKETCH' ? 'Sketch' : milestoneType === 'FINAL' ? 'Final' : 'bản chỉnh sửa'}` : 'Đang chờ SME duyệt bài'}
      description={canSubmit
        ? 'Chuẩn bị mô tả ngắn, đính kèm file đúng định dạng và xác nhận gửi để SME review.'
        : 'Bạn không cần thao tác thêm lúc này. Workspace sẽ cập nhật khi SME phản hồi hoặc đến hạn tiếp theo.'}
      deadlineLabel={deadline.label}
      deadlineValue={<DeadlinePill value={deadline.value} now={now} />}
    >
      {workspace.projectStatus === 'CANCELLED' ? (
        <StatusBlock
          tone="warning"
          icon={<WarningOutlined />}
          eyebrow="Dự án đã dừng"
          title="Dự án đã hủy"
          description="Xem phần tổng quan để biết tỷ lệ chia escrow và trạng thái hoàn SME thủ công."
        />
      ) : !canSubmit ? (
        <StatusBlock
          tone="info"
          icon={<ClockCircleOutlined />}
          eyebrow="Chờ phản hồi"
          title="Bạn đang chờ duyệt"
          description={latestSubmission ? `SME sẽ review trước ${formatWorkspaceDate(latestSubmission.reviewDueAt)}.` : 'Workspace tự cập nhật mỗi 5 giây.'}
          actions={canAbandon ? (
            <Button danger icon={<StopOutlined />} loading={acting} onClick={onAbandon}>
              Bỏ dự án
            </Button>
          ) : null}
        />
      ) : (
        <Form form={form} layout="vertical" className="workspace-v3-submit-form">
          <Form.Item label="Mô tả bản nộp" name="description">
            <Input.TextArea rows={4} placeholder="Tóm tắt ngắn nội dung để SME review nhanh hơn" />
          </Form.Item>
          <div className="workspace-v3-submit-controls">
            <Upload beforeUpload={onAddFile} fileList={[]} accept=".jpg,.png,.pdf" multiple>
              <Button icon={<UploadOutlined />}>Chọn file nộp bài</Button>
            </Upload>
            <span className="workspace-v3-muted">Chấp nhận JPG, PNG hoặc PDF, tối đa 20 MB mỗi file.</span>
          </div>
          <div className="workspace-v3-draft-list">
            {draftFiles.map((file) => (
              <div className="workspace-v3-draft-file" key={file.uid}>
                <FileTextOutlined />
                <div className="workspace-v3-draft-file-copy">
                  <strong>{file.name}</strong>
                  <span>{getFileExtension(file.name).toUpperCase()} · {formatFileSize(file.size)}</span>
                </div>
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${file.name}`} onClick={() => onRemoveFile(file.uid)} />
              </div>
            ))}
          </div>
          <div className="workspace-v3-action-row">
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
    </NextActionFrame>
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
      <NextActionFrame
        tag={<Tag color={paymentReturnTimedOut ? 'warning' : 'processing'}>{paymentReturnTimedOut ? 'CẦN KIỂM TRA' : 'PAYOS'}</Tag>}
        title={paymentReturnTimedOut ? 'Cần kiểm tra lại trạng thái thanh toán' : paymentPending ? 'Escrow đang chờ PayOS xác nhận' : 'Thanh toán escrow qua PayOS'}
        description="Escrow phải được funding và backend xác nhận thành công trước khi Student bắt đầu nộp bài."
      >
        <StatusBlock
          tone={paymentReturnTimedOut ? 'warning' : 'info'}
          icon={paymentReturnTimedOut ? <WarningOutlined /> : <CreditCardOutlined />}
          eyebrow="Thanh toán & escrow"
          title={paymentReturnTimedOut ? 'PayOS chưa xác nhận giao dịch' : paymentPending ? 'Đang chờ PayOS xác nhận' : 'Thanh toán escrow qua PayOS'}
          description={paymentReturnTimedOut
            ? 'Bạn có thể bấm kiểm tra lại. D4U chỉ bắt đầu dự án khi backend xác nhận trạng thái thanh toán.'
            : 'Nếu giao dịch bị gián đoạn, hãy tạo lại link hoặc mở lại phiên thanh toán hiện có.'}
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
      </NextActionFrame>
    );
  }

  if (!canReview) {
    return (
      <NextActionFrame
        tag={<Tag color="default">IDLE</Tag>}
        title="Chưa có việc mới cần xử lý"
        description="Khi Student gửi bài mới hoặc đến mốc cần xác nhận, khu vực này sẽ tự cập nhật."
      >
        <EmptyReviewState />
      </NextActionFrame>
    );
  }

  return (
    <NextActionFrame
      tag={<Tag color="processing">{latestSubmission.milestoneType}</Tag>}
      title="Có bài nộp đang chờ SME kiểm tra"
      description="Xem mô tả, tải file, rồi chọn duyệt, yêu cầu chỉnh sửa hoặc báo file lỗi theo đúng tình trạng thực tế."
      deadlineLabel="Hạn SME duyệt bài"
      deadlineValue={<DeadlinePill value={latestSubmission.reviewDueAt} now={now} />}
    >
      <div className="workspace-v3-next-summary">
        <div className="workspace-v3-next-summary-item">
          <span className="workspace-v3-label">Nộp lúc</span>
          <strong>{formatWorkspaceDate(latestSubmission.submittedAt)}</strong>
        </div>
        <div className="workspace-v3-next-summary-item">
          <span className="workspace-v3-label">Vòng audit</span>
          <strong>{latestSubmission.revisionRound}</strong>
        </div>
        <div className="workspace-v3-next-summary-item is-wide">
          <span className="workspace-v3-label">Mô tả bản nộp</span>
          <strong>{latestSubmission.description || 'Không có mô tả'}</strong>
        </div>
      </div>

      <div className="workspace-v3-content-block">
        <span className="workspace-v3-label">File đính kèm</span>
        <SubmissionFiles files={latestSubmission.files} onDownload={onDownload} />
      </div>

      <div className="workspace-v3-action-row">
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
    </NextActionFrame>
  );
}

export function WorkspaceDeadlinePanel({ workspace, now }) {
  const deadlines = [
    ['Sketch', workspace.sketchDeadlineAt],
    ['Final', workspace.finalDeadlineAt],
    ['Hoàn tất review', workspace.totalDeadlineAt]
  ];

  return (
    <Card className="workspace-v3-sidebar-card workspace-v3-timeline-panel" title="Mốc thời gian">
      <div className="workspace-v3-timeline-list">
        {deadlines.map(([label, value], index) => {
          const countdown = formatCountdown(value, now);
          const isOverdue = countdown?.startsWith('Quá hạn');

          return (
            <div className={`workspace-v3-timeline-row ${isOverdue ? 'is-overdue' : 'is-active'}`} key={label}>
              {index < deadlines.length - 1 ? <span className="workspace-v3-timeline-line" /> : null}
              <span className="workspace-v3-timeline-dot">
                {isOverdue ? <WarningOutlined /> : <ClockCircleOutlined />}
              </span>
              <div className="workspace-v3-timeline-copy">
                <span className="workspace-v3-label">{label}</span>
                <DeadlinePill value={value} now={now} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SummaryGroup({ title, rows }) {
  return (
    <section className="workspace-v3-summary-group">
      <div className="workspace-v3-summary-group-head">
        <span>{title}</span>
      </div>
      <div className="workspace-v3-summary-group-rows">
        {rows.map(([label, value]) => (
          <div className="workspace-v3-summary-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CompletedWorkspaceRatingPanel({ workspace, onOpenRating }) {
  const ratingState = getRatingStateMeta({
    projectStatus: workspace.projectStatus,
    ratingDueAt: workspace.ratingDueAt,
    canCurrentUserRate: workspace.canCurrentUserRate,
    hasCurrentUserRated: workspace.hasCurrentUserRated,
    currentUserRatedAt: workspace.currentUserRatedAt
  });

  const tone = ratingState.key === 'AVAILABLE'
    ? 'warning'
    : ratingState.key === 'RATED'
      ? 'success'
      : 'info';

  const actionLabel = ratingState.key === 'AVAILABLE'
    ? 'Đánh giá dự án'
    : 'Xem trạng thái đánh giá';

  return (
    <section className="workspace-v3-rating-panel">
      <StatusBlock
        tone={tone}
        icon={<CheckCircleOutlined />}
        eyebrow="Đánh giá sau hoàn thành"
        title={ratingState.label}
        description={ratingState.helper}
        actions={(
          <Button type="primary" onClick={onOpenRating}>
            {actionLabel}
          </Button>
        )}
      />
    </section>
  );
}

export function WorkspaceSummaryPanel({ workspace }) {
  const ratingState = getRatingStateMeta({
    projectStatus: workspace.projectStatus,
    ratingDueAt: workspace.ratingDueAt,
    canCurrentUserRate: workspace.canCurrentUserRate,
    hasCurrentUserRated: workspace.hasCurrentUserRated,
    currentUserRatedAt: workspace.currentUserRatedAt
  });

  return (
    <Card className="workspace-v3-sidebar-card workspace-v3-summary-panel" title="Tổng quan dự án">
      <div className="workspace-v3-summary-groups">
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
