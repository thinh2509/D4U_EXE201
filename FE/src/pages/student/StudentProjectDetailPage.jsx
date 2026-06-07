import { CalendarOutlined, SendOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Form, Input, InputNumber, Modal, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StudentReadinessNotice, useStudentReadiness } from '../../components/StudentReadinessGate.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const QUICK_APPLY_NOTE = 'Student xác nhận thực hiện theo ngân sách và deadline đã công bố.';

export function StudentProjectDetailPage() {
  const { message } = App.useApp();
  const { projectId } = useParams();
  const [customProposalForm] = Form.useForm();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [quickConfirmationOpen, setQuickConfirmationOpen] = useState(false);
  const [customProposalOpen, setCustomProposalOpen] = useState(false);
  const [customConfirmationOpen, setCustomConfirmationOpen] = useState(false);
  const [customProposal, setCustomProposal] = useState(null);
  const [error, setError] = useState(null);
  const readiness = useStudentReadiness();

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      setProject(await projectApi.getProject(projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const submitApplication = async (payload) => {
    setApplying(true);
    try {
      await projectApi.submitApplication(projectId, payload);
      message.success('Đã gửi ứng tuyển.');
      setQuickConfirmationOpen(false);
      setCustomProposalOpen(false);
      setCustomConfirmationOpen(false);
      setCustomProposal(null);
      customProposalForm.resetFields();
      await loadProject();
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError, 'Không thể gửi ứng tuyển.');
      message.error(errorMessage.toLowerCase().includes('already applied')
        ? 'Bạn đã ứng tuyển dự án này rồi.'
        : errorMessage);
    } finally {
      setApplying(false);
    }
  };

  const submitQuickApplication = () => submitApplication({
    proposedPrice: project.budgetAmount,
    coverLetter: QUICK_APPLY_NOTE,
    estimatedDurationDays: null
  });

  const reviewCustomProposal = async () => {
    const values = await customProposalForm.validateFields();
    setCustomProposal({
      proposedPrice: Number(values.proposedPrice),
      coverLetter: values.coverLetter.trim(),
      estimatedDurationDays: null
    });
    setCustomConfirmationOpen(true);
  };

  const closeApplyFlow = () => {
    setQuickConfirmationOpen(false);
    setCustomProposalOpen(false);
    setCustomConfirmationOpen(false);
    setCustomProposal(null);
    customProposalForm.resetFields();
  };

  if (loading || readiness.loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;
  if (readiness.error) return <ErrorState description={readiness.error} onRetry={readiness.reload} />;

  const hasApplied = Boolean(project.hasApplied);
  const canAccessMarketplaceActions = readiness.hasProfile && readiness.isApproved;
  const canApply = project.status === 'OPEN' && !hasApplied && canAccessMarketplaceActions;
  const applyButtonLabel = hasApplied ? 'Đã ứng tuyển' : 'Gửi ứng tuyển';
  const openCustomProposal = () => {
    setQuickConfirmationOpen(false);
    setCustomProposalOpen(true);
  };
  const readinessNotice = readiness.needsProfile ? (
    <StudentReadinessNotice
      compact
      mode="profile"
      title="Tạo hồ sơ sinh viên trước khi gửi ứng tuyển"
      description="Bạn đang xem được brief dự án, nhưng D4U chỉ mở bước ứng tuyển sau khi hồ sơ sinh viên được tạo."
      secondaryActionLabel="Tiếp tục đọc brief"
      secondaryActionPath={`/student/projects/${projectId}`}
    />
  ) : readiness.needsVerification ? (
    <StudentReadinessNotice
      compact
      mode="verification"
      title="Hoàn tất xác thực để ứng tuyển dự án này"
      description="SME chỉ nên nhận proposal từ Student đã xác thực. Hãy hoàn tất xác thực để gửi ứng tuyển hoặc đề xuất khác."
      secondaryActionLabel="Tiếp tục đọc brief"
      secondaryActionPath={`/student/projects/${projectId}`}
    />
  ) : null;

  return (
    <>
      <PageHeader
        title={project.title}
        description={project.designCategoryName}
        extra={<Button type="primary" icon={<SendOutlined />} loading={applying} disabled={!canApply} onClick={() => setQuickConfirmationOpen(true)}>{applyButtonLabel}</Button>}
      />

      {readinessNotice}

      <div className="project-detail-layout">
        <div className="project-detail-main">
          <Card title="Brief dự án">
            <div className="rich-text-block">{project.brief}</div>
          </Card>

          <Card title="Thông tin thực hiện">
            <Descriptions column={{ xs: 1, md: 2 }} bordered>
              <Descriptions.Item label="Trạng thái"><StatusBadge status={project.status} /></Descriptions.Item>
              <Descriptions.Item label="Loại dự án">{project.projectType}</Descriptions.Item>
              <Descriptions.Item label="Mục đích sử dụng" span={2}>{project.usagePurpose || 'Chưa có'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <aside className="project-side-panel">
          <Card>
            <Space direction="vertical" size={18} className="full-width">
              <div className="side-metric">
                <WalletOutlined />
                <div>
                  <span>Ngân sách</span>
                  <strong>{formatCurrency(project.budgetAmount, project.currency)}</strong>
                </div>
              </div>

              <div className="side-metric">
                <CalendarOutlined />
                <div>
                  <span>Hạn hoàn tất review</span>
                  <strong>{formatDate(project.totalDeadlineAt)}</strong>
                </div>
              </div>

              <div className="deadline-list">
                <div><span>Sketch</span><strong>{formatDate(project.sketchDeadlineAt)}</strong></div>
                <div><span>Final</span><strong>{formatDate(project.finalDeadlineAt)}</strong></div>
              </div>

              <Button type="primary" size="large" block icon={<SendOutlined />} loading={applying} disabled={!canApply} onClick={() => setQuickConfirmationOpen(true)}>
                {applyButtonLabel}
              </Button>
              <Button size="large" block disabled={!canApply || applying} onClick={openCustomProposal}>
                Đề xuất khác
              </Button>
              {!canAccessMarketplaceActions ? (
                <p className="project-action-note">
                  {readiness.needsProfile
                    ? 'Tạo hồ sơ sinh viên trước để D4U mở tính năng ứng tuyển.'
                    : 'Hoàn tất xác thực để gửi proposal và phản hồi offer.'}
                </p>
              ) : null}
            </Space>
          </Card>
        </aside>
      </div>

      <Modal
        title="Xác nhận ứng tuyển"
        open={quickConfirmationOpen}
        confirmLoading={applying}
        okText="Xác nhận gửi ứng tuyển"
        cancelText="Hủy"
        onOk={submitQuickApplication}
        onCancel={() => setQuickConfirmationOpen(false)}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <Button onClick={openCustomProposal}>Đề xuất khác</Button>
            <OkBtn />
          </>
        )}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Ngân sách">{formatCurrency(project.budgetAmount, project.currency)}</Descriptions.Item>
          <Descriptions.Item label="Hạn Sketch">{formatDate(project.sketchDeadlineAt)}</Descriptions.Item>
          <Descriptions.Item label="Hạn Final">{formatDate(project.finalDeadlineAt)}</Descriptions.Item>
          <Descriptions.Item label="Hạn hoàn tất review">{formatDate(project.totalDeadlineAt)}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal title="Đề xuất khác" open={customProposalOpen} footer={null} onCancel={closeApplyFlow}>
        <Form form={customProposalForm} layout="vertical" requiredMark={false}>
          <Form.Item name="proposedPrice" label="Giá đề xuất mới" rules={[{ required: true, message: 'Vui lòng nhập giá đề xuất.' }]}>
            <InputNumber className="full-width" min={1} addonAfter="VND" />
          </Form.Item>
          <Form.Item
            name="coverLetter"
            label="Giải pháp đề xuất"
            rules={[
              { required: true, message: 'Vui lòng nhập giải pháp đề xuất.' },
              { min: 20, message: 'Tối thiểu 20 ký tự.' }
            ]}
          >
            <Input.TextArea rows={5} maxLength={3000} showCount />
          </Form.Item>
          <Space>
            <Button type="primary" onClick={reviewCustomProposal}>Tiếp tục</Button>
            <Button onClick={closeApplyFlow}>Hủy</Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận đề xuất khác"
        open={customConfirmationOpen}
        confirmLoading={applying}
        okText="Gửi ứng tuyển"
        cancelText="Quay lại chỉnh sửa"
        onOk={() => submitApplication(customProposal)}
        onCancel={() => setCustomConfirmationOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Giá đề xuất">{formatCurrency(customProposal?.proposedPrice, project.currency)}</Descriptions.Item>
          <Descriptions.Item label="Giải pháp">{customProposal?.coverLetter}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
}
