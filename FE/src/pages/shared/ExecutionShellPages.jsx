import {
  FileDoneOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Upload } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { fileApi } from '../../services/fileApi.js';
import { paymentApi } from '../../services/paymentApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatFileSize, getFileExtension } from '../../utils/format.js';
import {
  getReviewDeadlineError,
  getReviewDeadlineMinimum,
  toReviewDeadlineIso
} from '../../utils/reviewDeadlineValidation.js';
import { FeatureShellPage } from './MvpShellPage.jsx';
import {
  SmeReviewWorkspace,
  SubmissionMilestoneBoard,
  StudentSubmissionWorkspace,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [paymentReturnTimedOut, setPaymentReturnTimedOut] = useState(false);
  const [checkingPaymentReturn, setCheckingPaymentReturn] = useState(false);

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
  const isPaymentReturn = searchParams.get('paymentReturn') === '1';
  const paymentReturnPaymentId = searchParams.get('paymentId');

  const canSubmit = workspace
    && ['SUBMIT_SKETCH', 'SUBMIT_FINAL', 'SUBMIT_REVISION'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'STUDENT'
    && workspace.viewerRole === 'STUDENT';
  const canReview = workspace
    && ['REVIEW_SKETCH', 'REVIEW_FINAL'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'SME'
    && workspace.viewerRole === 'SME'
    && latestSubmission;
  const hasFinalSubmitted = submissions.some((item) => item.milestoneType === 'FINAL');
  const canAbandon = workspace
    && workspace.viewerRole === 'STUDENT'
    && ['IN_PROGRESS', 'SKETCH_REVIEW', 'REVISION_REQUESTED'].includes(workspace.projectStatus)
    && !hasFinalSubmitted;
  const minimumReviewDeadline = useMemo(
    () => getReviewDeadlineMinimum(workspace, latestSubmission, latestReviewAction),
    [latestReviewAction, latestSubmission, workspace]
  );

  const getDeadlineValidationMessage = (value, options) => getReviewDeadlineError(value, {
    minimumDate: minimumReviewDeadline,
    ...options
  });

  const validateRevisionDueAt = async (_, value) => {
    const errorMessage = getDeadlineValidationMessage(value, {
      requiredMessage: 'Chọn hạn nộp lại.',
      invalidMessage: 'Hạn nộp lại không hợp lệ.',
      futureMessage: 'Hạn nộp lại phải sau thời điểm hiện tại.',
      minimumMessage: 'Hạn nộp lại phải sau hạn nộp trước đó.'
    });

    if (errorMessage) {
      throw new Error(errorMessage);
    }
  };

  const validateReuploadDueAt = async (_, value) => {
    const errorMessage = getDeadlineValidationMessage(value, {
      requiredMessage: 'Chọn hạn upload lại.',
      invalidMessage: 'Hạn upload lại không hợp lệ.',
      futureMessage: 'Hạn upload lại phải sau thời điểm hiện tại.',
      minimumMessage: 'Hạn upload lại phải sau hạn nộp trước đó.'
    });

    if (errorMessage) {
      throw new Error(errorMessage);
    }
  };

  const closeReviewModal = () => {
    reviewForm.resetFields();
    setReviewMode(null);
  };

  const openReviewModal = (mode) => {
    reviewForm.resetFields();
    setReviewMode(mode);
  };

  useEffect(() => {
    if (!isPaymentReturn || workspace?.viewerRole !== 'SME' || !paymentReturnPaymentId) return;

    let stopped = false;
    let attempts = 0;
    let pollingId = null;
    const toastKey = 'payos-workspace-return';
    const fundedStatuses = ['FUNDED', 'RELEASE_PENDING', 'RELEASED'];
    const failedStatuses = ['FAILED', 'CANCELLED', 'EXPIRED'];

    setPaymentReturnTimedOut(false);
    message.loading({
      key: toastKey,
      content: 'Đang xác nhận thanh toán PayOS...',
      duration: 0
    });

    const stopPolling = () => {
      stopped = true;
      if (pollingId) window.clearInterval(pollingId);
    };

    const pollReturnStatus = async () => {
      attempts += 1;
      try {
        const status = await paymentApi.getReturnStatus(paymentReturnPaymentId);
        await loadWorkspace({ silent: true });
        if (stopped) return;

        const succeeded = status.status === 'SUCCESS' || fundedStatuses.includes(status.escrowStatus);
        const failed = failedStatuses.includes(status.status);

        if (succeeded) {
          message.success({
            key: toastKey,
            content: 'Thanh toán thành công. Escrow đã được ghi nhận và dự án đã bắt đầu.',
            duration: 4
          });
          stopPolling();
          navigate(`/projects/${projectId}/execution`, { replace: true });
          return;
        }

        if (failed) {
          message.warning({
            key: toastKey,
            content: 'Thanh toán chưa hoàn tất. Bạn có thể mở lại PayOS từ workspace.',
            duration: 4
          });
          stopPolling();
          navigate(`/projects/${projectId}/execution`, { replace: true });
          return;
        }
      } catch (requestError) {
        if (attempts >= 30 && !stopped) {
          message.warning({
            key: toastKey,
            content: getApiErrorMessage(requestError, 'PayOS chưa xác nhận giao dịch.'),
            duration: 5
          });
        }
      }

      if (attempts >= 30 && !stopped) {
        setPaymentReturnTimedOut(true);
        message.warning({
          key: toastKey,
          content: 'PayOS chưa xác nhận giao dịch. Bạn có thể bấm Kiểm tra lại thanh toán.',
          duration: 5
        });
        stopPolling();
      }
    };

    pollReturnStatus();
    pollingId = window.setInterval(pollReturnStatus, 2000);

    return stopPolling;
  }, [isPaymentReturn, message, navigate, paymentReturnPaymentId, projectId, workspace?.viewerRole]);

  const checkPaymentReturnNow = async () => {
    const paymentId = paymentReturnPaymentId || workspace?.payment?.id;
    if (!paymentId) {
      message.warning('Không tìm thấy mã payment để kiểm tra.');
      return;
    }

    setCheckingPaymentReturn(true);
    try {
      const status = await paymentApi.getReturnStatus(paymentId);
      await loadWorkspace({ silent: true });

      if (status.status === 'SUCCESS' || ['FUNDED', 'RELEASE_PENDING', 'RELEASED'].includes(status.escrowStatus)) {
        message.success('Thanh toán thành công. Escrow đã được ghi nhận và dự án đã bắt đầu.');
        setPaymentReturnTimedOut(false);
        navigate(`/projects/${projectId}/execution`, { replace: true });
        return;
      }

      if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(status.status)) {
        message.warning('Thanh toán chưa hoàn tất. Bạn có thể mở lại PayOS từ workspace.');
        navigate(`/projects/${projectId}/execution`, { replace: true });
        return;
      }

      message.info('PayOS vẫn chưa xác nhận giao dịch này.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể kiểm tra trạng thái PayOS.'));
    } finally {
      setCheckingPaymentReturn(false);
    }
  };

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

  const abandonProject = () => {
    let reason = '';
    Modal.confirm({
      title: 'Bỏ dự án?',
      content: (
        <div>
          <p>D4U sẽ xử lý chia escrow theo tiến trình nộp bài hiện tại. Sau khi đã nộp Final, Student không thể bỏ dự án.</p>
          <Input.TextArea rows={3} placeholder="Lý do bỏ dự án..." onChange={(event) => { reason = event.target.value; }} />
        </div>
      ),
      okText: 'Bỏ dự án',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setActing(true);
        try {
          await projectApi.abandonProject(projectId, reason || 'Abandoned by Student.');
          message.success('Đã ghi nhận bỏ dự án và xử lý chia escrow.');
          setDraftFiles([]);
          submissionForm.resetFields();
          await loadWorkspace();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể bỏ dự án.'));
        } finally {
          setActing(false);
        }
      }
    });
  };

  const submitReviewDecision = async () => {
    const values = await reviewForm.validateFields();
    setActing(true);
    try {
      if (reviewMode === 'revision') {
        const dueAtIso = toReviewDeadlineIso(values.dueAt);
        if (!dueAtIso) {
          reviewForm.setFields([{ name: 'dueAt', errors: ['Hạn nộp lại không hợp lệ.'] }]);
          return;
        }
        await projectApi.requestRevision(projectId, latestSubmission.id, {
          requestedChanges: values.requestedChanges,
          dueAt: dueAtIso
        });
      } else {
        const reuploadDueAtIso = toReviewDeadlineIso(values.reuploadDueAt);
        if (!reuploadDueAtIso) {
          reviewForm.setFields([{ name: 'reuploadDueAt', errors: ['Hạn upload lại không hợp lệ.'] }]);
          return;
        }
        await projectApi.reportInvalidFile(projectId, latestSubmission.id, {
          reason: values.reason,
          description: values.description,
          reuploadDueAt: reuploadDueAtIso
        });
      }
      closeReviewModal();
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="grid gap-4">
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
              canAbandon={canAbandon}
              onAddFile={addDraftFile}
              onRemoveFile={(uid) => setDraftFiles((current) => current.filter((item) => item.uid !== uid))}
              onSubmit={openSubmitConfirmation}
              onAbandon={abandonProject}
            />
          ) : (
            <SmeReviewWorkspace
              workspace={workspace}
              canReview={canReview}
              latestSubmission={latestSubmission}
              now={now}
              acting={acting}
              paymentReturnTimedOut={paymentReturnTimedOut}
              checkingPayment={checkingPaymentReturn}
              onPayment={openPayment}
              onCheckPayment={checkPaymentReturnNow}
              onDownload={downloadSubmissionFile}
              onApprove={approveSubmission}
              onRevision={() => openReviewModal('revision')}
              onInvalid={() => openReviewModal('invalid')}
            />
          )}
          <SubmissionMilestoneBoard
            submissions={submissions}
            reviewActions={reviewActions}
            onDownload={downloadSubmissionFile}
          />
        </div>

        <aside className="order-first grid gap-4 lg:order-none lg:sticky lg:top-[88px]">
          <WorkspaceDeadlinePanel workspace={workspace} now={now} />
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
        <div className="mt-3 grid gap-2">
          {draftFiles.map((file) => (
            <div className="workspace-file-row" key={file.uid}>
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
        onCancel={closeReviewModal}
      >
        <Form form={reviewForm} layout="vertical">
          {reviewMode === 'revision' ? (
            <>
              <Form.Item label="Nội dung cần sửa" name="requestedChanges" rules={[{ required: true, message: 'Nhập nội dung cần sửa.' }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item label={"H\u1ea1n n\u1ed9p l\u1ea1i"} name="dueAt" validateTrigger={['onChange', 'onBlur']} extra={"Th\u1eddi gian nh\u1eadp theo m\u00fai gi\u1edd Vi\u1ec7t Nam."} rules={[{ validator: validateRevisionDueAt }]}>
                <Input type="datetime-local" onChange={() => reviewForm.validateFields(['dueAt']).catch(() => {})} />
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
              <Form.Item label={"H\u1ea1n upload l\u1ea1i"} name="reuploadDueAt" validateTrigger={['onChange', 'onBlur']} extra={"Th\u1eddi gian nh\u1eadp theo m\u00fai gi\u1edd Vi\u1ec7t Nam."} rules={[{ validator: validateReuploadDueAt }]}>
                <Input type="datetime-local" onChange={() => reviewForm.validateFields(['reuploadDueAt']).catch(() => {})} />
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
