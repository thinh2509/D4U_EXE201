import { CalendarOutlined, FolderOpenOutlined, SendOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, InputNumber, Modal, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StudentReadinessNotice, useStudentReadiness } from '../../components/StudentReadinessGate.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency } from '../../utils/format.js';

const QUICK_APPLY_NOTE = 'Student xác nhận thực hiện theo ngân sách và deadline đã công bố.';

function formatDetailDate(value) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value)).replace(',', ' ·');
}

function ProjectDetailHeader({ project }) {
  const summaryItems = [
    { label: 'Loại dự án', value: project.projectType || 'Chưa có' },
    { label: 'Danh mục', value: project.designCategoryName || 'Chưa có' },
    { label: 'Hạn review', value: formatDetailDate(project.totalDeadlineAt), muted: !project.totalDeadlineAt },
    { label: 'Publish', value: project.publishedAt ? formatDetailDate(project.publishedAt) : 'Chưa có', muted: !project.publishedAt }
  ];
  const metaItems = [
    { icon: <FolderOpenOutlined />, label: 'Danh mục', value: project.designCategoryName || 'Chưa có', muted: !project.designCategoryName },
    { icon: <WalletOutlined />, label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { icon: <CalendarOutlined />, label: 'Review deadline', value: formatDetailDate(project.totalDeadlineAt), muted: !project.totalDeadlineAt }
  ];

  return (
    <section className="project-hero-card">
      <div className="project-hero-main project-detail-hero-main">
        <div className="project-hero-copy project-detail-hero-copy">
          <div className="project-hero-eyebrow">
            <span>Project detail</span>
          </div>
          <div className="project-hero-heading-row project-detail-hero-heading">
            <h1>{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="project-detail-summary-row">
            {summaryItems.map((item) => (
              <div className={`project-detail-summary-item ${item.muted ? 'is-muted' : ''}`} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="project-detail-hero-rail">
          <div className="project-detail-hero-rail-head">
            <strong>Tổng quan nhanh</strong>
            <span>Các chỉ số chính trước khi bạn quyết định ứng tuyển dự án này.</span>
          </div>
          <div className="project-hero-meta project-detail-hero-stats">
            {metaItems.map((item) => (
              <div className={`project-meta-chip project-detail-stat-card ${item.muted ? 'is-muted' : ''}`} key={item.label}>
                <span className="project-meta-icon">{item.icon}</span>
                <div className="project-meta-copy">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectBriefCard({ brief }) {
  return (
    <Card className="project-brief-card">
      <div className="project-section-head">
        <span>Brief dự án</span>
        <strong>Những gì SME cần bạn thực hiện trong workspace này</strong>
      </div>
      <div className="rich-text-block project-brief-copy">{brief}</div>
    </Card>
  );
}

function ProjectInfoGrid({ project }) {
  const items = [
    { label: 'Trạng thái', value: <StatusBadge status={project.status} /> },
    { label: 'Loại dự án', value: project.projectType },
    { label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { label: 'Publish lúc', value: formatDetailDate(project.publishedAt) },
    { label: 'Hạn nộp Sketch', value: formatDetailDate(project.sketchDeadlineAt) },
    { label: 'Hạn nộp Final', value: formatDetailDate(project.finalDeadlineAt) },
    { label: 'Hạn hoàn tất review', value: formatDetailDate(project.totalDeadlineAt) },
    { label: 'Mục đích sử dụng', value: project.usagePurpose || 'Chưa có', wide: true }
  ];

  return (
    <Card className="project-info-card">
      <div className="project-section-head">
        <span>Thông tin thực hiện</span>
        <strong>Mốc thời gian và metadata quan trọng trước khi bạn gửi ứng tuyển</strong>
      </div>
      <div className="project-info-grid">
        {items.map((item) => (
          <div className={`project-info-item ${item.wide ? 'is-wide' : ''}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProjectActionPanel({
  project,
  applying,
  canApply,
  applyButtonLabel,
  canAccessMarketplaceActions,
  readiness,
  onQuickApply,
  onCustomProposal
}) {
  return (
    <Card className="project-action-panel" title="Thao tác">
      <div className="project-action-stack">
        <Button type="primary" size="large" block icon={<SendOutlined />} loading={applying} disabled={!canApply} onClick={onQuickApply}>
          {applyButtonLabel}
        </Button>
        <Button size="large" block disabled={!canApply || applying} onClick={onCustomProposal}>
          Đề xuất khác
        </Button>
      </div>

      <div className="project-side-summary">
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
            <span>Hoàn tất review</span>
            <strong>{formatDetailDate(project.totalDeadlineAt)}</strong>
          </div>
        </div>
        <div className="deadline-list modern">
          <div><span>Sketch</span><strong>{formatDetailDate(project.sketchDeadlineAt)}</strong></div>
          <div><span>Final</span><strong>{formatDetailDate(project.finalDeadlineAt)}</strong></div>
        </div>
      </div>

      {!canAccessMarketplaceActions ? (
        <div className="project-action-notes">
          <Tag color="warning">{readiness.needsProfile ? 'Cần hồ sơ' : 'Cần xác thực'}</Tag>
          <p>
            {readiness.needsProfile
              ? 'Tạo hồ sơ sinh viên trước để D4U mở tính năng ứng tuyển.'
              : 'Hoàn tất xác thực để gửi proposal và phản hồi offer.'}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

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
      <ProjectDetailHeader project={project} />

      {readinessNotice}

      <div className="project-detail-layout modern-project-detail">
        <div className="project-detail-main">
          <ProjectBriefCard brief={project.brief} />
          <ProjectInfoGrid project={project} />
        </div>

        <aside className="project-side-panel">
          <ProjectActionPanel
            project={project}
            applying={applying}
            canApply={canApply}
            applyButtonLabel={applyButtonLabel}
            canAccessMarketplaceActions={canAccessMarketplaceActions}
            readiness={readiness}
            onQuickApply={() => setQuickConfirmationOpen(true)}
            onCustomProposal={openCustomProposal}
          />
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
        <div className="project-confirm-grid">
          <div className="project-confirm-item">
            <span>Ngân sách</span>
            <strong>{formatCurrency(project.budgetAmount, project.currency)}</strong>
          </div>
          <div className="project-confirm-item">
            <span>Hạn Sketch</span>
            <strong>{formatDetailDate(project.sketchDeadlineAt)}</strong>
          </div>
          <div className="project-confirm-item">
            <span>Hạn Final</span>
            <strong>{formatDetailDate(project.finalDeadlineAt)}</strong>
          </div>
          <div className="project-confirm-item">
            <span>Hoàn tất review</span>
            <strong>{formatDetailDate(project.totalDeadlineAt)}</strong>
          </div>
        </div>
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
        <div className="project-confirm-grid single-column">
          <div className="project-confirm-item">
            <span>Giá đề xuất</span>
            <strong>{formatCurrency(customProposal?.proposedPrice, project.currency)}</strong>
          </div>
          <div className="project-confirm-item is-wide">
            <span>Giải pháp</span>
            <strong>{customProposal?.coverLetter}</strong>
          </div>
        </div>
      </Modal>
    </>
  );
}
