import {
  CheckOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  ReloadOutlined,
  StarOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, App, Button, Card, Descriptions, Form, Input, Modal, Select, Space, Steps, Table, Tag, Upload } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { fileApi } from '../../services/fileApi.js';
import { paymentApi } from '../../services/paymentApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate, formatFileSize, getFileExtension } from '../../utils/format.js';
import { FeatureShellPage } from './MvpShellPage.jsx';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const allowedExtensions = new Set(['jpg', 'png', 'pdf']);
const reviewableStatuses = new Set(['SUBMITTED', 'VALID']);

const nextActionLabels = {
  WAIT_STUDENT_APPLICATION: 'Chờ Student ứng tuyển',
  CREATE_OFFER: 'Tạo offer cho Student',
  WAIT_STUDENT_ACCEPT: 'Chờ Student chấp nhận offer',
  PAY_ESCROW: 'Thanh toán escrow qua PayOS',
  SUBMIT_SKETCH: 'Nộp Sketch',
  REVIEW_SKETCH: 'Duyệt Sketch',
  SUBMIT_FINAL: 'Nộp Final',
  REVIEW_FINAL: 'Duyệt Final',
  SUBMIT_REVISION: 'Nộp bản chỉnh sửa',
  ADMIN_REVIEW: 'Chờ Admin xử lý',
  COMPLETED: 'Dự án đã hoàn thành'
};

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

function getTimelineCurrent(workspace) {
  if (workspace.projectStatus === 'COMPLETED') return 4;
  if (workspace.projectStatus === 'FINAL_REVIEW') return 3;
  if (workspace.projectStatus === 'SKETCH_REVIEW' || workspace.projectStatus === 'REVISION_REQUESTED') return 2;
  if (workspace.escrow?.status === 'FUNDED') return 2;
  if (workspace.offer) return 1;
  return 0;
}

function getSubmissionMilestone(workspace, submissions) {
  if (workspace.nextAction === 'SUBMIT_SKETCH') return 'SKETCH';
  if (workspace.nextAction === 'SUBMIT_FINAL') return 'FINAL';
  return submissions.find((item) => ['REVISION_REQUESTED', 'INVALID_REPORTED'].includes(item.status))?.milestoneType;
}

function WorkspaceTimeline({ workspace }) {
  return (
    <Card className="table-card">
      <Steps
        current={getTimelineCurrent(workspace)}
        items={[
          { title: 'Offer' },
          { title: 'PayOS escrow' },
          { title: 'Sketch' },
          { title: workspace.currentRevisionRound ? `Revision ${workspace.currentRevisionRound}` : 'Final' },
          { title: 'Hoàn thành' }
        ]}
      />
    </Card>
  );
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

  const submissionColumns = [
    { title: 'Milestone', dataIndex: 'milestoneType' },
    { title: 'Loại', dataIndex: 'submissionType' },
    { title: 'Vòng sửa', dataIndex: 'revisionRound' },
    { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Nộp lúc', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'File',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          {row.files.map((file) => (
            <Button key={file.id} type="link" icon={<DownloadOutlined />} onClick={() => downloadSubmissionFile(file)}>
              {file.originalFilename}
            </Button>
          ))}
        </Space>
      )
    }
  ];
  const reviewColumns = [
    { title: 'Phản hồi', dataIndex: 'action' },
    { title: 'Nội dung', render: (_, row) => row.requestedChanges || row.comment || row.invalidFileReason || 'Không có' },
    { title: 'Hạn xử lý', render: (_, row) => formatDate(row.dueAt || row.reuploadDueAt) },
    { title: 'Tạo lúc', dataIndex: 'createdAt', render: formatDate }
  ];

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title={workspace.projectTitle}
        description={workspace.viewerRole === 'STUDENT' ? 'Nộp bài và theo dõi phản hồi từ SME' : 'Theo dõi tiến trình và duyệt bài Student'}
        extra={<Button icon={<ReloadOutlined />} onClick={() => loadWorkspace()}>Làm mới</Button>}
      />

      <WorkspaceTimeline workspace={workspace} />

      <div className="project-detail-layout">
        <div className="project-detail-main">
          {workspace.viewerRole === 'STUDENT' ? (
            <Card title="Việc cần làm tiếp theo">
              <Alert
                type={canSubmit ? 'info' : 'success'}
                showIcon
                message={nextActionLabels[workspace.nextAction] || workspace.nextAction}
                description={canSubmit ? `Milestone: ${milestoneType}` : latestSubmission ? `Đang chờ SME duyệt trước ${formatDate(latestSubmission.reviewDueAt)}.` : 'Workspace sẽ tự cập nhật sau mỗi 5 giây.'}
              />
              {canSubmit ? (
                <Form form={submissionForm} layout="vertical" className="workspace-action-form">
                  <Form.Item label="Mô tả bản nộp" name="description">
                    <Input.TextArea rows={3} placeholder="Ghi chú ngắn để SME hiểu nội dung bản nộp" />
                  </Form.Item>
                  <Upload beforeUpload={addDraftFile} fileList={[]} accept=".jpg,.png,.pdf" multiple>
                    <Button icon={<UploadOutlined />}>Chọn file</Button>
                  </Upload>
                  <div className="workspace-draft-list">
                    {draftFiles.map((file) => (
                      <div className="workspace-draft-item" key={file.uid}>
                        <div>
                          <strong>{file.name}</strong>
                          <div className="muted-text">{getFileExtension(file.name).toUpperCase()} · {formatFileSize(file.size)}</div>
                        </div>
                        <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Xóa ${file.name}`} onClick={() => setDraftFiles((current) => current.filter((item) => item.uid !== file.uid))} />
                      </div>
                    ))}
                  </div>
                  <Button type="primary" loading={acting} onClick={openSubmitConfirmation}>Nộp bài</Button>
                </Form>
              ) : null}
            </Card>
          ) : (
            <Card title="Bản đang chờ duyệt">
              {workspace.nextAction === 'PAY_ESCROW' && workspace.nextActionRole === 'SME' ? (
                <>
                  <Alert type="info" showIcon message="Thanh toán escrow qua PayOS" description="Mở QR PayOS để funding escrow và bắt đầu dự án." />
                  <Button className="workspace-primary-action" type="primary" icon={<CreditCardOutlined />} loading={acting} onClick={openPayment}>
                    Thanh toán PayOS
                  </Button>
                </>
              ) : canReview ? (
                <>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Milestone"><Tag color="blue">{latestSubmission.milestoneType}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Vòng sửa">{latestSubmission.revisionRound}</Descriptions.Item>
                    <Descriptions.Item label="Nộp lúc">{formatDate(latestSubmission.submittedAt)}</Descriptions.Item>
                    <Descriptions.Item label="Hạn duyệt">{formatDate(latestSubmission.reviewDueAt)}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>{latestSubmission.description || 'Không có'}</Descriptions.Item>
                    <Descriptions.Item label="File" span={2}>
                      <Space direction="vertical" size={2}>
                        {latestSubmission.files.map((file) => (
                          <Button key={file.id} type="link" icon={<DownloadOutlined />} onClick={() => downloadSubmissionFile(file)}>
                            {file.originalFilename}
                          </Button>
                        ))}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                  <Space wrap className="workspace-primary-action">
                    <Button type="primary" icon={<CheckOutlined />} loading={acting} onClick={approveSubmission}>Duyệt</Button>
                    <Button onClick={() => { reviewForm.resetFields(); setReviewMode('revision'); }}>Yêu cầu chỉnh sửa</Button>
                    <Button danger icon={<WarningOutlined />} onClick={() => { reviewForm.resetFields(); setReviewMode('invalid'); }}>Báo file lỗi</Button>
                  </Space>
                </>
              ) : (
                <Alert
                  type={workspace.nextAction === 'ADMIN_REVIEW' ? 'warning' : 'info'}
                  showIcon
                  message={nextActionLabels[workspace.nextAction] || workspace.nextAction}
                  description="Workspace tự cập nhật sau mỗi 5 giây."
                />
              )}
            </Card>
          )}

          <Card title="Lịch sử nộp bài">
            <Table rowKey="id" columns={submissionColumns} dataSource={submissions} pagination={false} scroll={{ x: 760 }} />
          </Card>
          <Card title="Lịch sử phản hồi">
            <Table rowKey="id" columns={reviewColumns} dataSource={reviewActions} pagination={false} scroll={{ x: 680 }} />
          </Card>
        </div>

        <aside className="project-side-panel">
          <Card title="Trạng thái dự án">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Project"><StatusBadge status={workspace.projectStatus} /></Descriptions.Item>
              <Descriptions.Item label="Vai trò">{workspace.viewerRole}</Descriptions.Item>
              <Descriptions.Item label="Ngân sách">{formatCurrency(workspace.budgetAmount, workspace.currency)}</Descriptions.Item>
              <Descriptions.Item label="Deadline">{formatDate(workspace.totalDeadlineAt)}</Descriptions.Item>
              <Descriptions.Item label="Số vòng feedback">{workspace.currentRevisionRound}</Descriptions.Item>
              <Descriptions.Item label="Offer">{workspace.offer ? <StatusBadge status={workspace.offer.status} /> : 'Chưa có'}</Descriptions.Item>
              <Descriptions.Item label="Payment">{workspace.payment ? <StatusBadge status={workspace.payment.status} /> : 'Chưa có'}</Descriptions.Item>
              <Descriptions.Item label="Escrow">{workspace.escrow ? <StatusBadge status={workspace.escrow.status} /> : 'Chưa có'}</Descriptions.Item>
            </Descriptions>
          </Card>
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
