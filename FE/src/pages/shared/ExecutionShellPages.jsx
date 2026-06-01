import {
  FileDoneOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Upload } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { fileApi } from '../../services/fileApi.js';
import { paymentApi } from '../../services/paymentApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatFileSize, getFileExtension } from '../../utils/format.js';
import { FeatureShellPage } from './MvpShellPage.jsx';
import {
  SmeReviewWorkspace,
  StudentSubmissionWorkspace,
  WorkspaceActivityTimeline,
  WorkspaceDeadlinePanel,
  WorkspaceProgressTimeline,
  WorkspaceSummaryPanel
} from './WorkspaceUi.jsx';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const allowedExtensions = new Set(['jpg', 'png', 'pdf']);
const reviewableStatuses = new Set(['SUBMITTED', 'VALID']);

const invalidReasons = [
  'EMPTY_FILE',
  'CANNOT_OPEN',
  'WRONG_FORMAT',
  'UNRELATED',
  'BROKEN_LINK',
  'OTHER'
];

function newestFirst(items = [], dateField = 'submittedAt') {
  return [...items].sort((left, right) => new Date(right[dateField]) - new Date(left[dateField]));
}

function getSubmissionMilestone(workspace, submissions) {
  if (workspace.nextAction === 'SUBMIT_SKETCH') return 'SKETCH';
  if (workspace.nextAction === 'SUBMIT_FINAL') return 'FINAL';
  return submissions.find((item) => ['REVISION_REQUESTED', 'INVALID_REPORTED'].includes(item.status))?.milestoneType;
}

export function ProjectExecutionPage() {
  const { message } = App.useApp();
  const { projectId } = useParams();
  const [submissionForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [draftFiles, setDraftFiles] = useState([]);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(null);
  const [now, setNow] = useState(Date.now());

  const loadWorkspace = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      setWorkspace(await projectApi.getWorkspace(projectId));
    } catch (requestError) {
      if (!silent) setError(getApiErrorMessage(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    const pollingId = window.setInterval(() => loadWorkspace({ silent: true }), 5000);
    return () => window.clearInterval(pollingId);
  }, [projectId]);

  useEffect(() => {
    const countdownId = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(countdownId);
  }, []);

  const submissions = useMemo(() => newestFirst(workspace?.submissions), [workspace]);
  const reviewActions = useMemo(() => newestFirst(workspace?.reviewActions, 'createdAt'), [workspace]);
  const latestSubmission = useMemo(
    () => submissions.find((item) => reviewableStatuses.has(item.status)),
    [submissions]
  );
  const milestoneType = useMemo(
    () => workspace ? getSubmissionMilestone(workspace, submissions) : null,
    [workspace, submissions]
  );
  const latestReviewAction = reviewActions[0];

  const canSubmit = workspace
    && ['SUBMIT_SKETCH', 'SUBMIT_FINAL', 'SUBMIT_REVISION'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'STUDENT'
    && workspace.viewerRole === 'STUDENT';
  const canReview = workspace
    && ['REVIEW_SKETCH', 'REVIEW_FINAL'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'SME'
    && workspace.viewerRole === 'SME'
    && latestSubmission;

  const addDraftFile = (file) => {
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.has(extension)) {
      message.error(`${file.name}: chỉ nhận jpg, png hoặc pdf.`);
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error(`${file.name}: vượt quá giới hạn 20 MB.`);
      return Upload.LIST_IGNORE;
    }
    setDraftFiles((current) => current.some((item) => item.uid === file.uid) ? current : [...current, file]);
    return Upload.LIST_IGNORE;
  };

  const openSubmitConfirmation = async () => {
    await submissionForm.validateFields();
    if (!draftFiles.length) {
      message.warning('Chọn ít nhất một file jpg, png hoặc pdf.');
      return;
    }
    if (!milestoneType) {
      message.error('Không xác định được milestone cần nộp lại.');
      return;
    }
    setConfirmSubmitOpen(true);
  };

  const submitMilestone = async () => {
    const values = submissionForm.getFieldsValue();
    setActing(true);
    try {
      const uploadedFiles = [];
      for (const file of draftFiles) {
        try {
          uploadedFiles.push(await fileApi.uploadSubmission(file));
        } catch (requestError) {
          throw new Error(`${file.name}: ${getApiErrorMessage(requestError, 'upload thất bại.')}`);
        }
      }

      await projectApi.submitSubmission(projectId, {
        milestoneType,
        description: values.description,
        files: uploadedFiles.map((file) => ({
          fileId: file.id,
          watermarkedFileId: null,
          isOriginalDownloadable: milestoneType === 'FINAL'
        }))
      });
      setDraftFiles([]);
      setConfirmSubmitOpen(false);
      submissionForm.resetFields();
      message.success('Đã nộp bài. SME sẽ thấy bản mới trong tối đa 5 giây.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(requestError.message || getApiErrorMessage(requestError, 'Không thể nộp bài.'));
    } finally {
      setActing(false);
    }
  };

  const openPayment = async () => {
    if (workspace.payment?.checkoutUrl) {
      window.open(workspace.payment.checkoutUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setActing(true);
    try {
      const payment = await paymentApi.createOfferPayment(workspace.offer.id);
      if (payment.checkoutUrl) window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tạo link PayOS.'));
    } finally {
      setActing(false);
    }
  };

  const downloadSubmissionFile = async (file) => {
    try {
      await fileApi.downloadSubmission(file.fileId, file.originalFilename);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, `Không thể tải ${file.originalFilename}.`));
    }
  };

  const approveSubmission = async () => {
    setActing(true);
    try {
      await projectApi.approveSubmission(projectId, latestSubmission.id, { comment: null });
      message.success('Đã duyệt submission.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể duyệt submission.'));
    } finally {
      setActing(false);
    }
  };

  const submitReviewDecision = async () => {
    const values = await reviewForm.validateFields();
    setActing(true);
    try {
      if (reviewMode === 'revision') {
        await projectApi.requestRevision(projectId, latestSubmission.id, {
          requestedChanges: values.requestedChanges,
          dueAt: new Date(values.dueAt).toISOString()
        });
      } else {
        await projectApi.reportInvalidFile(projectId, latestSubmission.id, {
          reason: values.reason,
          description: values.description,
          reuploadDueAt: new Date(values.reuploadDueAt).toISOString()
        });
      }
      setReviewMode(null);
      reviewForm.resetFields();
      message.success('Đã gửi phản hồi cho Student.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể ghi nhận phản hồi.'));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadWorkspace} />;

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title={workspace.projectTitle}
        description={workspace.viewerRole === 'STUDENT' ? 'Nộp bài và theo dõi phản hồi từ SME' : 'Theo dõi tiến trình và duyệt bài Student'}
        extra={<Button icon={<ReloadOutlined />} onClick={() => loadWorkspace()}>Làm mới</Button>}
      />

      <WorkspaceProgressTimeline workspace={workspace} submissions={submissions} />

      <div className="workspace-layout">
        <div className="workspace-main">
          {workspace.viewerRole === 'STUDENT' ? (
            <StudentSubmissionWorkspace
              workspace={workspace}
              canSubmit={canSubmit}
              milestoneType={milestoneType}
              latestSubmission={latestSubmission}
              latestReviewAction={latestReviewAction}
              now={now}
              form={submissionForm}
              draftFiles={draftFiles}
              acting={acting}
              onAddFile={addDraftFile}
              onRemoveFile={(uid) => setDraftFiles((current) => current.filter((item) => item.uid !== uid))}
              onSubmit={openSubmitConfirmation}
            />
          ) : (
            <SmeReviewWorkspace
              workspace={workspace}
              canReview={canReview}
              latestSubmission={latestSubmission}
              now={now}
              acting={acting}
              onPayment={openPayment}
              onDownload={downloadSubmissionFile}
              onApprove={approveSubmission}
              onRevision={() => { reviewForm.resetFields(); setReviewMode('revision'); }}
              onInvalid={() => { reviewForm.resetFields(); setReviewMode('invalid'); }}
            />
          )}
          <WorkspaceActivityTimeline workspace={workspace} now={now} />
        </div>

        <aside className="workspace-sidebar">
          <WorkspaceDeadlinePanel workspace={workspace} latestSubmission={latestSubmission} latestReviewAction={latestReviewAction} now={now} />
          <WorkspaceSummaryPanel workspace={workspace} />
        </aside>
      </div>

      <Modal
        title={`Xác nhận nộp ${milestoneType || ''}`}
        open={confirmSubmitOpen}
        confirmLoading={acting}
        okText="Xác nhận nộp"
        cancelText="Quay lại"
        onOk={submitMilestone}
        onCancel={() => setConfirmSubmitOpen(false)}
      >
        <p>{submissionForm.getFieldValue('description') || 'Không có mô tả.'}</p>
        <div className="workspace-draft-list">
          {draftFiles.map((file) => (
            <div className="workspace-draft-item" key={file.uid}>
              <strong>{file.name}</strong>
              <span className="muted-text">{formatFileSize(file.size)}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={reviewMode === 'revision' ? 'Yêu cầu chỉnh sửa' : 'Báo file lỗi'}
        open={Boolean(reviewMode)}
        confirmLoading={acting}
        okText="Gửi phản hồi"
        cancelText="Hủy"
        onOk={submitReviewDecision}
        onCancel={() => setReviewMode(null)}
      >
        <Form form={reviewForm} layout="vertical">
          {reviewMode === 'revision' ? (
            <>
              <Form.Item label="Nội dung cần sửa" name="requestedChanges" rules={[{ required: true, message: 'Nhập nội dung cần sửa.' }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item label="Hạn nộp lại" name="dueAt" rules={[{ required: true, message: 'Chọn hạn nộp lại.' }]}>
                <Input type="datetime-local" />
                <div className="workspace-field-help">Thời gian nhập theo múi giờ Việt Nam.</div>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="Loại lỗi" name="reason" rules={[{ required: true, message: 'Chọn loại lỗi.' }]}>
                <Select options={invalidReasons.map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item label="Mô tả" name="description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Hạn upload lại" name="reuploadDueAt" rules={[{ required: true, message: 'Chọn hạn upload lại.' }]}>
                <Input type="datetime-local" />
                <div className="workspace-field-help">Thời gian nhập theo múi giờ Việt Nam.</div>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}

export function ProjectSubmissionsPage() {
  return <ProjectExecutionPage />;
}

export function ProjectRatingPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Rating"
      description="Đánh giá sau khi dự án hoàn thành."
      endpoint="POST /api/v1/projects/{id}/ratings"
      backTo="/"
    />
  );
}
