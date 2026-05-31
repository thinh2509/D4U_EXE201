import {
  CheckOutlined,
  CreditCardOutlined,
  FileDoneOutlined,
  ReloadOutlined,
  StarOutlined,
  UploadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, App, Button, Card, Descriptions, Form, Input, Modal, Select, Space, Steps, Table, Upload } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { fileApi } from '../../services/fileApi.js';
import { paymentApi } from '../../services/paymentApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { FeatureShellPage } from './MvpShellPage.jsx';

const nextActionLabels = {
  WAIT_STUDENT_APPLICATION: 'Cho ung vien nop ho so',
  CREATE_OFFER: 'Tao offer cho ung vien',
  WAIT_STUDENT_ACCEPT: 'Cho Student chap nhan offer',
  PAY_ESCROW: 'Thanh toan escrow qua PayOS',
  SUBMIT_SKETCH: 'Nop Sketch',
  REVIEW_SKETCH: 'Duyet Sketch',
  SUBMIT_FINAL: 'Nop Final',
  REVIEW_FINAL: 'Duyet Final',
  SUBMIT_REVISION: 'Nop ban chinh sua',
  ADMIN_REVIEW: 'Cho Admin xu ly',
  COMPLETED: 'Du an da hoan thanh'
};

const invalidReasons = [
  'EMPTY_FILE',
  'CANNOT_OPEN',
  'WRONG_FORMAT',
  'UNRELATED',
  'BROKEN_LINK',
  'OTHER'
];

function getTimelineCurrent(workspace) {
  if (workspace.projectStatus === 'COMPLETED') return 4;
  if (workspace.projectStatus === 'FINAL_REVIEW') return 3;
  if (workspace.projectStatus === 'SKETCH_REVIEW' || workspace.projectStatus === 'REVISION_REQUESTED') return 2;
  if (workspace.escrow?.status === 'FUNDED') return 2;
  if (workspace.offer) return 1;
  return 0;
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reviewMode, setReviewMode] = useState(null);

  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkspace(await projectApi.getWorkspace(projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [projectId]);

  const latestSubmission = useMemo(
    () => workspace?.submissions?.find((item) => item.status === 'SUBMITTED' || item.status === 'VALID'),
    [workspace]
  );

  const revisedMilestone = useMemo(
    () => workspace?.submissions?.find((item) => item.status === 'REVISION_REQUESTED')?.milestoneType,
    [workspace]
  );

  const uploadFile = async ({ file, onError, onSuccess }) => {
    try {
      const uploaded = await fileApi.uploadSubmission(file);
      setUploadedFiles((current) => [...current, uploaded]);
      onSuccess(uploaded);
    } catch (requestError) {
      const detail = getApiErrorMessage(requestError, 'Khong the upload file.');
      message.error(detail);
      onError(requestError);
    }
  };

  const submitMilestone = async () => {
    if (!uploadedFiles.length) {
      message.warning('Can upload it nhat mot file jpg, png hoac pdf.');
      return;
    }

    const values = await submissionForm.validateFields();
    const milestoneType = workspace.nextAction === 'SUBMIT_SKETCH' ? 'SKETCH'
      : workspace.nextAction === 'SUBMIT_FINAL' ? 'FINAL'
        : revisedMilestone;

    setActing(true);
    try {
      await projectApi.submitSubmission(projectId, {
        milestoneType,
        description: values.description,
        files: uploadedFiles.map((file) => ({
          fileId: file.id,
          watermarkedFileId: null,
          isOriginalDownloadable: milestoneType === 'FINAL'
        }))
      });
      setUploadedFiles([]);
      submissionForm.resetFields();
      message.success('Da nop bai.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the nop bai.'));
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
      message.error(getApiErrorMessage(requestError, 'Khong the tao link PayOS.'));
    } finally {
      setActing(false);
    }
  };

  const approveSubmission = async () => {
    setActing(true);
    try {
      const values = reviewForm.getFieldsValue();
      await projectApi.approveSubmission(projectId, latestSubmission.id, { comment: values.comment });
      reviewForm.resetFields();
      message.success('Da duyet submission.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the duyet submission.'));
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
      message.success('Da ghi nhan review.');
      await loadWorkspace();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the ghi nhan review.'));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadWorkspace} />;

  const canSubmit = ['SUBMIT_SKETCH', 'SUBMIT_FINAL', 'SUBMIT_REVISION'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'STUDENT';
  const canReview = ['REVIEW_SKETCH', 'REVIEW_FINAL'].includes(workspace.nextAction)
    && workspace.nextActionRole === 'SME'
    && latestSubmission;

  const submissionColumns = [
    { title: 'Milestone', dataIndex: 'milestoneType' },
    { title: 'Loai', dataIndex: 'submissionType' },
    { title: 'Vong sua', dataIndex: 'revisionRound' },
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Nop luc', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'File',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          {row.files.map((file) => (
            <a key={file.id} href={file.downloadUrl} target="_blank" rel="noreferrer">{file.originalFilename}</a>
          ))}
        </Space>
      )
    }
  ];
  const reviewColumns = [
    { title: 'Action', dataIndex: 'action' },
    { title: 'Feedback', render: (_, row) => row.requestedChanges || row.comment || row.invalidFileReason || 'Khong co' },
    { title: 'Deadline', render: (_, row) => formatDate(row.dueAt || row.reuploadDueAt) },
    { title: 'Tao luc', dataIndex: 'createdAt', render: formatDate }
  ];

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title={workspace.projectTitle}
        description="Project workspace"
        extra={<Button icon={<ReloadOutlined />} onClick={loadWorkspace}>Lam moi</Button>}
      />

      <Card className="table-card">
        <Steps
          current={getTimelineCurrent(workspace)}
          items={[
            { title: 'Offer' },
            { title: 'Thanh toan' },
            { title: 'Sketch' },
            { title: 'Final' },
            { title: 'Hoan thanh' }
          ]}
        />
      </Card>

      <div className="project-detail-layout">
        <div className="project-detail-main">
          <Card title="Viec can lam tiep theo">
            <Alert
              type={workspace.nextAction === 'ADMIN_REVIEW' ? 'warning' : 'info'}
              showIcon
              message={nextActionLabels[workspace.nextAction] || workspace.nextAction}
              description={`Role xu ly: ${workspace.nextActionRole}`}
            />
            {workspace.nextAction === 'PAY_ESCROW' && workspace.nextActionRole === 'SME' ? (
              <Button className="workspace-primary-action" type="primary" icon={<CreditCardOutlined />} loading={acting} onClick={openPayment}>
                Mo thanh toan PayOS
              </Button>
            ) : null}
            {canSubmit ? (
              <Form form={submissionForm} layout="vertical" className="workspace-action-form">
                <Form.Item label="Mo ta submission" name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Upload customRequest={uploadFile} fileList={[]} accept=".jpg,.jpeg,.png,.pdf" multiple>
                  <Button icon={<UploadOutlined />}>Upload file</Button>
                </Upload>
                <div className="workspace-upload-list">
                  {uploadedFiles.map((file) => <div key={file.id}>{file.originalFilename}</div>)}
                </div>
                <Button type="primary" loading={acting} onClick={submitMilestone}>Nop bai</Button>
              </Form>
            ) : null}
            {canReview ? (
              <Space wrap className="workspace-primary-action">
                <Button type="primary" icon={<CheckOutlined />} loading={acting} onClick={approveSubmission}>Duyet</Button>
                <Button onClick={() => { reviewForm.resetFields(); setReviewMode('revision'); }}>Yeu cau chinh sua</Button>
                <Button danger icon={<WarningOutlined />} onClick={() => { reviewForm.resetFields(); setReviewMode('invalid'); }}>Bao file loi</Button>
              </Space>
            ) : null}
          </Card>

          <Card title="Submission">
            <Table rowKey="id" columns={submissionColumns} dataSource={workspace.submissions} pagination={false} scroll={{ x: 760 }} />
          </Card>
          <Card title="Lich su review">
            <Table rowKey="id" columns={reviewColumns} dataSource={workspace.reviewActions} pagination={false} scroll={{ x: 680 }} />
          </Card>
        </div>

        <aside className="project-side-panel">
          <Card title="Trang thai">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Project"><StatusBadge status={workspace.projectStatus} /></Descriptions.Item>
              <Descriptions.Item label="Nguoi xem">{workspace.viewerRole}</Descriptions.Item>
              <Descriptions.Item label="Ngan sach">{formatCurrency(workspace.budgetAmount, workspace.currency)}</Descriptions.Item>
              <Descriptions.Item label="Deadline">{formatDate(workspace.totalDeadlineAt)}</Descriptions.Item>
              <Descriptions.Item label="Revision">{workspace.currentRevisionRound}/{workspace.maxRevisionRounds}</Descriptions.Item>
              <Descriptions.Item label="Offer">{workspace.offer ? <StatusBadge status={workspace.offer.status} /> : 'Chua co'}</Descriptions.Item>
              <Descriptions.Item label="Payment">{workspace.payment ? <StatusBadge status={workspace.payment.status} /> : 'Chua co'}</Descriptions.Item>
              <Descriptions.Item label="Escrow">{workspace.escrow ? <StatusBadge status={workspace.escrow.status} /> : 'Chua co'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </aside>
      </div>

      <Modal
        title={reviewMode === 'revision' ? 'Yeu cau chinh sua' : 'Bao file loi'}
        open={Boolean(reviewMode)}
        confirmLoading={acting}
        onOk={submitReviewDecision}
        onCancel={() => setReviewMode(null)}
      >
        <Form form={reviewForm} layout="vertical">
          {reviewMode === 'revision' ? (
            <>
              <Form.Item label="Noi dung can sua" name="requestedChanges" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item label="Han nop lai" name="dueAt" rules={[{ required: true }]}>
                <Input type="datetime-local" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="Loai loi" name="reason" rules={[{ required: true }]}>
                <Select options={invalidReasons.map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Form.Item label="Mo ta" name="description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Han upload lai" name="reuploadDueAt" rules={[{ required: true }]}>
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
      description="Danh gia sau khi du an hoan thanh."
      endpoint="POST /api/v1/projects/{id}/ratings"
      backTo="/"
    />
  );
}
