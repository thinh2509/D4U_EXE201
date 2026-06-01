import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Space, Tag, Upload } from 'antd';
import { formatCurrency, formatFileSize, getFileExtension } from '../../utils/format.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const activityLabels = {
  APPROVE_SKETCH: 'SME đã duyệt Sketch',
  APPROVE_FINAL: 'SME đã duyệt Final',
  REQUEST_REVISION: 'SME yêu cầu chỉnh sửa',
  REPORT_INVALID_FILE: 'SME báo file lỗi',
  AUTO_APPROVE_SKETCH: 'Hệ thống tự duyệt Sketch',
  AUTO_APPROVE_FINAL: 'Hệ thống tự duyệt Final',
  ADMIN_FORCE_COMPLETE: 'Admin hoàn tất dự án',
  ADMIN_CANCEL: 'Admin hủy dự án'
};

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

function DeadlineValue({ value, now }) {
  const countdown = formatCountdown(value, now);
  return (
    <div className="workspace-deadline-value">
      <strong>{formatWorkspaceDate(value)}</strong>
      {countdown ? <span className={countdown.startsWith('Quá hạn') ? 'is-overdue' : ''}>{countdown}</span> : null}
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
  return { label: 'Deadline tổng', value: workspace.totalDeadlineAt };
}

export function WorkspaceDeadlinePanel({ workspace, latestSubmission, latestReviewAction, now }) {
  const active = resolveActiveDeadline(workspace, latestSubmission, latestReviewAction);
  const revisionDueAt = latestReviewAction?.reuploadDueAt || latestReviewAction?.dueAt;
  return (
    <Card className="workspace-panel workspace-deadline-panel" title="Mốc thời gian">
      <div className="workspace-deadline-highlight">
        <span>{active.label}</span>
        <DeadlineValue value={active.value} now={now} />
      </div>
      <div className="workspace-deadline-list">
        <div><span>Sketch</span><DeadlineValue value={workspace.sketchDeadlineAt} now={now} /></div>
        <div><span>Final</span><DeadlineValue value={workspace.finalDeadlineAt} now={now} /></div>
        <div><span>Toàn dự án</span><DeadlineValue value={workspace.totalDeadlineAt} now={now} /></div>
        {revisionDueAt ? <div><span>Nộp lại</span><DeadlineValue value={revisionDueAt} now={now} /></div> : null}
      </div>
    </Card>
  );
}

function getProgressState(workspace, submissions) {
  const hasSketch = submissions.some((item) => item.milestoneType === 'SKETCH');
  const sketchApproved = submissions.some((item) => item.milestoneType === 'SKETCH' && item.status === 'APPROVED');
  const hasRevision = submissions.some((item) => item.submissionType === 'REVISION');
  const hasFinal = submissions.some((item) => item.milestoneType === 'FINAL');
  const finalApproved = submissions.some((item) => item.milestoneType === 'FINAL' && item.status === 'APPROVED');
  return [
    Boolean(workspace.offer),
    workspace.escrow?.status === 'FUNDED' || workspace.escrow?.status === 'RELEASE_PENDING' || workspace.escrow?.status === 'RELEASED',
    hasSketch || sketchApproved,
    hasRevision,
    hasFinal || finalApproved,
    workspace.projectStatus === 'COMPLETED'
  ];
}

export function WorkspaceProgressTimeline({ workspace, submissions }) {
  const states = getProgressState(workspace, submissions);
  const steps = [
    ['Offer', 'Hai bên xác nhận'],
    ['Escrow', 'PayOS funded'],
    ['Sketch', 'Bản phác thảo'],
    ['Revision', 'Nếu có feedback'],
    ['Final', 'Bàn giao cuối'],
    ['Hoàn thành', 'Release escrow']
  ];
  return (
    <Card className="workspace-panel workspace-progress-card">
      <div className="workspace-progress-list">
        {steps.map(([title, description], index) => (
          <div className={`workspace-progress-step ${states[index] ? 'is-complete' : ''}`} key={title}>
            <span className="workspace-progress-dot">{states[index] ? <CheckCircleOutlined /> : index + 1}</span>
            <div><strong>{title}</strong><small>{description}</small></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function buildActivities(workspace) {
  const items = [];
  if (workspace.offer) {
    items.push({ id: `offer-${workspace.offer.id}`, at: workspace.offer.createdAt, tone: 'payment', title: 'SME đã gửi offer', copy: `Giá trị ${formatCurrency(workspace.offer.offeredAmount, workspace.currency)}` });
    if (workspace.offer.acceptedAt) items.push({ id: `offer-accepted-${workspace.offer.id}`, at: workspace.offer.acceptedAt, tone: 'success', title: 'Student đã xác nhận offer' });
  }
  if (workspace.escrow?.fundedAt) items.push({ id: `escrow-funded-${workspace.escrow.id}`, at: workspace.escrow.fundedAt, tone: 'payment', title: 'Escrow đã được PayOS xác nhận', copy: formatCurrency(workspace.escrow.amount, workspace.currency) });
  workspace.submissions.forEach((item) => items.push({
    id: `submission-${item.id}`,
    at: item.submittedAt,
    tone: 'submission',
    title: `Student đã nộp ${item.submissionType === 'REVISION' ? 'bản chỉnh sửa' : item.milestoneType}`,
    copy: item.description || `${item.files.length} file đính kèm`
  }));
  workspace.reviewActions.forEach((item) => items.push({
    id: `review-${item.id}`,
    at: item.createdAt,
    tone: item.action === 'REPORT_INVALID_FILE' ? 'error' : item.action.includes('APPROVE') ? 'success' : 'review',
    title: activityLabels[item.action] || item.action,
    copy: item.requestedChanges || item.comment || item.invalidFileReason,
    deadline: item.reuploadDueAt || item.dueAt
  }));
  if (workspace.escrow?.releasedAt) items.push({ id: `escrow-released-${workspace.escrow.id}`, at: workspace.escrow.releasedAt, tone: 'success', title: 'Escrow đã release vào ví Student' });
  if (workspace.completedAt) items.push({ id: `completed-${workspace.projectId}`, at: workspace.completedAt, tone: 'success', title: 'Dự án đã hoàn thành' });
  return items.filter((item) => item.at).sort((left, right) => new Date(right.at) - new Date(left.at));
}

export function WorkspaceActivityTimeline({ workspace, now }) {
  const items = buildActivities(workspace);
  return (
    <Card className="workspace-panel" title="Dòng thời gian tương tác">
      {items.length ? (
        <div className="workspace-activity-list">
          {items.map((item) => (
            <article className="workspace-activity-item" key={item.id}>
              <span className={`workspace-activity-icon is-${item.tone}`}>{item.tone === 'success' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}</span>
              <div>
                <div className="workspace-activity-heading">
                  <strong>{item.title}</strong>
                  <time>{formatWorkspaceDate(item.at)}</time>
                </div>
                {item.copy ? <p>{item.copy}</p> : null}
                {item.deadline ? <Tag color="warning">Hạn xử lý: {formatWorkspaceDate(item.deadline)} · {formatCountdown(item.deadline, now)}</Tag> : null}
              </div>
            </article>
          ))}
        </div>
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hoạt động trong workspace" />}
    </Card>
  );
}

export function StudentSubmissionWorkspace({
  workspace, canSubmit, milestoneType, latestSubmission, latestReviewAction, now, form, draftFiles, acting,
  onAddFile, onRemoveFile, onSubmit
}) {
  const deadline = resolveActiveDeadline(workspace, latestSubmission, latestReviewAction);
  return (
    <Card className="workspace-panel workspace-focus-card" title="Việc cần làm tiếp theo">
      <div className="workspace-focus-header">
        <div>
          <Tag color={canSubmit ? 'processing' : 'success'}>{canSubmit ? milestoneType : 'ĐANG THEO DÕI'}</Tag>
          <h2>{canSubmit ? `Nộp ${milestoneType === 'SKETCH' ? 'Sketch' : milestoneType === 'FINAL' ? 'Final' : 'bản chỉnh sửa'}` : 'Đang chờ SME duyệt bài'}</h2>
        </div>
        <DeadlineValue value={deadline.value} now={now} />
      </div>
      {!canSubmit ? (
        <Alert type="info" showIcon message={latestSubmission ? `SME sẽ review trước ${formatWorkspaceDate(latestSubmission.reviewDueAt)}.` : 'Workspace tự cập nhật sau mỗi 5 giây.'} />
      ) : (
        <Form form={form} layout="vertical" className="workspace-action-form">
          <Form.Item label="Mô tả bản nộp" name="description">
            <Input.TextArea rows={4} placeholder="Tóm tắt nội dung để SME review nhanh hơn" />
          </Form.Item>
          <Upload beforeUpload={onAddFile} fileList={[]} accept=".jpg,.png,.pdf" multiple>
            <Button icon={<UploadOutlined />}>Chọn file nộp bài</Button>
          </Upload>
          <div className="workspace-draft-list">
            {draftFiles.map((file) => (
              <div className="workspace-draft-item" key={file.uid}>
                <FileTextOutlined />
                <div><strong>{file.name}</strong><span>{getFileExtension(file.name).toUpperCase()} · {formatFileSize(file.size)}</span></div>
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${file.name}`} onClick={() => onRemoveFile(file.uid)} />
              </div>
            ))}
          </div>
          <Button type="primary" icon={<UploadOutlined />} loading={acting} onClick={onSubmit}>Xác nhận nộp bài</Button>
        </Form>
      )}
    </Card>
  );
}

export function SmeReviewWorkspace({ workspace, canReview, latestSubmission, now, acting, onPayment, onDownload, onApprove, onRevision, onInvalid }) {
  if (workspace.nextAction === 'PAY_ESCROW' && workspace.nextActionRole === 'SME') {
    return (
      <Card className="workspace-panel workspace-focus-card" title="Việc cần làm tiếp theo">
        <Alert type="info" showIcon message="Thanh toán escrow qua PayOS" description="Escrow cần được funding trước khi Student bắt đầu nộp bài." />
        <Button className="workspace-primary-action" type="primary" icon={<CreditCardOutlined />} loading={acting} onClick={onPayment}>Mở thanh toán PayOS</Button>
      </Card>
    );
  }
  if (!canReview) {
    return <Card className="workspace-panel workspace-focus-card" title="Bản đang chờ duyệt"><Alert type="info" showIcon message="Chưa có bản mới cần xử lý" description="Workspace tự cập nhật sau mỗi 5 giây." /></Card>;
  }
  return (
    <Card className="workspace-panel workspace-focus-card" title="Bản đang chờ duyệt">
      <div className="workspace-focus-header">
        <div><Tag color="processing">{latestSubmission.milestoneType}</Tag><h2>{latestSubmission.submissionType === 'REVISION' ? 'Bản chỉnh sửa mới nhất' : `Bản ${latestSubmission.milestoneType} mới nhất`}</h2></div>
        <DeadlineValue value={latestSubmission.reviewDueAt} now={now} />
      </div>
      <Descriptions className="workspace-review-meta" column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label="Nộp lúc">{formatWorkspaceDate(latestSubmission.submittedAt)}</Descriptions.Item>
        <Descriptions.Item label="Vòng audit">{latestSubmission.revisionRound}</Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>{latestSubmission.description || 'Không có mô tả'}</Descriptions.Item>
      </Descriptions>
      <div className="workspace-file-list">
        {latestSubmission.files.map((file) => (
          <Button key={file.id} icon={<DownloadOutlined />} onClick={() => onDownload(file)}>{file.originalFilename}</Button>
        ))}
      </div>
      <div className="workspace-review-actions">
        <Button type="primary" icon={<CheckCircleOutlined />} loading={acting} onClick={onApprove}>Duyệt bài</Button>
        <Button icon={<FileDoneOutlined />} onClick={onRevision}>Yêu cầu chỉnh sửa</Button>
        <Button danger icon={<WarningOutlined />} onClick={onInvalid}>Báo file lỗi</Button>
      </div>
    </Card>
  );
}

export function WorkspaceSummaryPanel({ workspace }) {
  return (
    <Card className="workspace-panel" title="Tổng quan dự án">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Project"><StatusBadge status={workspace.projectStatus} /></Descriptions.Item>
        <Descriptions.Item label="Vai trò">{workspace.viewerRole}</Descriptions.Item>
        {workspace.offer?.studentFullName ? <Descriptions.Item label="Student">{workspace.offer.studentFullName}</Descriptions.Item> : null}
        <Descriptions.Item label="Ngân sách">{formatCurrency(workspace.budgetAmount, workspace.currency)}</Descriptions.Item>
        <Descriptions.Item label="Feedback đã ghi nhận">{workspace.currentRevisionRound}</Descriptions.Item>
        <Descriptions.Item label="Offer">{workspace.offer ? <StatusBadge status={workspace.offer.status} /> : 'Chưa có'}</Descriptions.Item>
        <Descriptions.Item label="Payment">{workspace.payment ? <StatusBadge status={workspace.payment.status} /> : 'Chưa có'}</Descriptions.Item>
        <Descriptions.Item label="Escrow">{workspace.escrow ? <StatusBadge status={workspace.escrow.status} /> : 'Chưa có'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
