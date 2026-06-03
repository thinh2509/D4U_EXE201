import {
  CheckCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  FileTextOutlined,
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
      <strong className="text-[13px] font-bold text-[#1D2428]">{formatWorkspaceDate(value)}</strong>
      {countdown ? (
        <span className={`text-xs font-extrabold ${countdown.startsWith('Quá hạn') ? 'text-red-600' : 'text-[#0B9BD3]'}`}>
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
  return { label: 'Deadline cuối', value: workspace.totalDeadlineAt };
}

export function WorkspaceDeadlinePanel({ workspace, now }) {
  const deadlines = [
    ['Sketch', workspace.sketchDeadlineAt],
    ['Final', workspace.finalDeadlineAt],
    ['Deadline cuối', workspace.totalDeadlineAt]
  ];
  return (
    <Card className="rounded-lg border border-[#D7E5EC] shadow-none" title="Mốc thời gian">
      <div className="grid gap-4">
        {deadlines.map(([label, value], index) => (
          <div className={`grid gap-1 ${index < deadlines.length - 1 ? 'border-b border-[#EAF3F7] pb-4' : ''}`} key={label}>
            <span className="text-xs font-bold uppercase tracking-wide text-[#667985]">{label}</span>
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
      : { tone: 'pending', label: 'Chờ bàn giao' }]
  ];
  return (
    <section className="mb-5 rounded-lg border border-[#D7E5EC] bg-white px-5 py-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0">
        {steps.map(([title, Icon, state], index) => (
          <div className={`relative flex min-w-0 items-center gap-3 rounded-lg py-2 sm:rounded-none sm:py-0 sm:pr-4 ${
            state.tone === 'active' ? 'bg-[#F2FBFF] px-2 sm:bg-transparent sm:px-0' : ''
          }`} key={title}>
            {index < steps.length - 1 ? (
              <span className={`absolute left-9 right-0 top-4 hidden h-0.5 sm:block ${state.tone === 'complete' ? 'bg-emerald-500' : 'bg-[#D7E5EC]'}`} />
            ) : null}
            <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-white text-xs font-extrabold ${
              state.tone === 'complete'
                ? 'border-emerald-500 text-emerald-600'
                : state.tone === 'active'
                  ? 'border-[#12AEEA] text-[#0B9BD3]'
                  : 'border-[#D7E5EC] text-[#8EA0AA]'
            }`}>
              {state.tone === 'complete' ? <CheckCircleOutlined /> : <Icon />}
            </span>
            <div className={`relative z-10 min-w-0 pr-3 ${state.tone === 'active' ? 'bg-[#F2FBFF] sm:bg-white' : 'bg-white'}`}>
              <strong className="block text-sm font-extrabold text-[#1D2428]">{title}</strong>
              <span className={`block text-xs font-semibold ${state.tone === 'active' ? 'text-[#0B9BD3]' : 'text-[#667985]'}`}>{state.label}</span>
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
  if (!files.length) return <span className="text-xs text-[#8EA0AA]">Không có file đính kèm</span>;
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
    <article className={`rounded-lg border p-4 ${isLatestWaiting ? 'border-[#12AEEA] bg-[#F2FBFF]' : 'border-[#EAF3F7] bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="m-0 text-sm font-extrabold text-[#1D2428]">{title}</h4>
            <StatusBadge status={submission.status} />
            {isLatestWaiting ? <Tag color="processing">Đang chờ SME duyệt</Tag> : null}
          </div>
          <p className="mb-0 mt-1 text-xs text-[#667985]">Student nộp lúc {formatWorkspaceDate(submission.submittedAt)}</p>
          {submission.approvedAt || submission.autoApprovedAt ? (
            <p className="mb-0 mt-1 text-xs text-emerald-700">Duyệt lúc {formatWorkspaceDate(submission.approvedAt || submission.autoApprovedAt)}</p>
          ) : null}
        </div>
      </div>
      <p className="mb-3 mt-3 text-sm leading-6 text-[#425864]">{submission.description || 'Không có mô tả.'}</p>
      <SubmissionFiles files={submission.files} onDownload={onDownload} />
      {feedback.length ? (
        <div className="mt-4 grid gap-2 border-t border-[#D7E5EC] pt-3">
          {feedback.map((item) => (
            <div className="rounded-md bg-[#F8FBFE] px-3 py-2 text-xs text-[#425864]" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className={approvedActions.has(item.action) ? 'text-emerald-700' : 'text-amber-700'}>
                  {approvedActions.has(item.action) ? 'SME đã duyệt bài' : item.action === 'REPORT_INVALID_FILE' ? 'SME báo file lỗi' : 'SME yêu cầu chỉnh sửa'}
                </strong>
                <span className="text-[#8EA0AA]">{formatWorkspaceDate(item.createdAt)}</span>
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
    <section className="rounded-lg border border-[#D7E5EC] bg-white">
      <div className="border-b border-[#EAF3F7] px-5 py-4">
        <h2 className="m-0 text-base font-extrabold text-[#1D2428]">Bài Student đã nộp</h2>
        <p className="mb-0 mt-1 text-sm text-[#667985]">Sketch, các lần chỉnh sửa và Final được nhóm theo milestone để dễ kiểm tra file.</p>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {['SKETCH', 'FINAL'].map((milestoneType) => {
          const milestoneSubmissions = submissions
            .filter((item) => item.milestoneType === milestoneType)
            .sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt));
          return (
            <div className="min-w-0 rounded-lg border border-[#D7E5EC] bg-[#F8FBFE] p-4" key={milestoneType}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="m-0 text-sm font-extrabold text-[#075D78]">{milestoneType}</h3>
                <span className="text-xs font-bold text-[#667985]">{milestoneSubmissions.length} lần nộp</span>
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
  onAddFile, onRemoveFile, onSubmit
}) {
  const deadline = resolveActiveDeadline(workspace, latestSubmission, latestReviewAction);
  return (
    <Card className="rounded-lg border border-[#12AEEA]/50 shadow-none" title="Việc cần làm tiếp theo">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Tag color={canSubmit ? 'processing' : 'success'}>{canSubmit ? milestoneType : 'ĐANG THEO DÕI'}</Tag>
          <h2 className="mb-0 mt-2 text-xl font-extrabold text-[#1D2428]">
            {canSubmit ? `Nộp ${milestoneType === 'SKETCH' ? 'Sketch' : milestoneType === 'FINAL' ? 'Final' : 'bản chỉnh sửa'}` : 'Đang chờ SME duyệt bài'}
          </h2>
        </div>
        <div>
          <span className="block text-xs font-bold text-[#667985]">{deadline.label}</span>
          <DeadlineValue value={deadline.value} now={now} align="left" />
        </div>
      </div>
      {!canSubmit ? (
        <Alert type="info" showIcon message={latestSubmission ? `SME sẽ review trước ${formatWorkspaceDate(latestSubmission.reviewDueAt)}.` : 'Workspace tự cập nhật sau mỗi 5 giây.'} />
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
              <div className="flex items-center gap-3 rounded-md border border-[#EAF3F7] bg-[#F8FBFE] px-3 py-2" key={file.uid}>
                <FileTextOutlined className="text-[#0B9BD3]" />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <strong className="truncate text-sm text-[#1D2428]">{file.name}</strong>
                  <span className="text-xs text-[#667985]">{getFileExtension(file.name).toUpperCase()} · {formatFileSize(file.size)}</span>
                </div>
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
      <Card className="rounded-lg border border-[#12AEEA]/50 shadow-none" title="Việc cần làm tiếp theo">
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
    return <Card className="rounded-lg border border-[#12AEEA]/50 shadow-none" title="Bản đang chờ duyệt"><Alert type="info" showIcon message="Chưa có bản mới cần xử lý" description="Workspace tự cập nhật sau mỗi 5 giây." /></Card>;
  }
  return (
    <Card className="rounded-lg border border-[#12AEEA]/50 shadow-none" title="Bản đang chờ duyệt">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><Tag color="processing">{latestSubmission.milestoneType}</Tag><h2 className="mb-0 mt-2 text-xl font-extrabold text-[#1D2428]">{latestSubmission.submissionType === 'REVISION' ? 'Bản chỉnh sửa mới nhất' : `Bản ${latestSubmission.milestoneType} mới nhất`}</h2></div>
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
    <Card className="rounded-lg border border-[#D7E5EC] shadow-none" title="Tổng quan dự án">
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
