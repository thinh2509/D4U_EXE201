import { CalendarOutlined, FolderOpenOutlined, SendOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Space, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { StudentReadinessNotice, useStudentReadiness } from '../../components/StudentReadinessGate.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { extractApiFieldErrors, getApiErrorMessage } from '../../utils/apiError.js';
import { buildLocalizedDesignCategoryLabel, localizeDesignCategoryName } from '../../utils/designCategoryLocalization.js';
import { formatCurrency } from '../../utils/format.js';
import {
  ActionButton,
  ProjectBriefSection,
  ProjectDetailHeader,
  ProjectExecutionInfoGrid,
  ProjectMetadataStrip
} from '../shared/ProjectDetailUi.jsx';

function ConfirmItem({ children, label, wide = false }) {
  return (
    <div className={`grid gap-2 rounded-2xl border border-d4u-border bg-d4u-soft/70 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-d4u-text-3">{label}</span>
      <strong className="text-sm font-semibold leading-6 text-d4u-text-1">{children}</strong>
    </div>
  );
}

const QUICK_APPLY_NOTE = 'Student xác nhận thực hiện theo ngân sách và deadline đã công bố.';

const proposalFieldMap = {
  proposedprice: 'proposedPrice',
  coverletter: 'coverLetter',
  estimateddurationdays: 'estimatedDurationDays'
};

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

function getCategoryLabel(project) {
  return buildLocalizedDesignCategoryLabel({
    name: project.designCategoryName,
    description: project.designCategoryDescription
  }) || localizeDesignCategoryName(project.designCategoryName) || 'Chưa có';
}

function buildHeaderMetadata(project) {
  const categoryLabel = getCategoryLabel(project);

  return [
    { label: 'Loại dự án', value: project.projectType || 'Chưa có' },
    { label: 'Danh mục', value: categoryLabel || 'Chưa có' },
    { label: 'Hạn review', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : 'Chưa có', muted: !project.totalDeadlineAt },
    { label: 'Publish', value: project.publishedAt ? formatDetailDate(project.publishedAt) : 'Chưa có', muted: !project.publishedAt }
  ];
}

function buildHeaderStats(project) {
  const categoryLabel = getCategoryLabel(project);

  return [
    { icon: <FolderOpenOutlined className="h-5 w-5" />, label: 'Danh mục', value: categoryLabel || 'Chưa có', muted: !categoryLabel },
    { icon: <WalletOutlined className="h-5 w-5" />, label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { icon: <CalendarOutlined className="h-5 w-5" />, label: 'Review deadline', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : 'Chưa có', muted: !project.totalDeadlineAt }
  ];
}

function buildExecutionItems(project) {
  return [
    { label: 'Trạng thái', value: <StatusBadge status={project.status} /> },
    { label: 'Loại dự án', value: project.projectType || <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { label: 'Publish lúc', value: project.publishedAt ? formatDetailDate(project.publishedAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn nộp Sketch', value: project.sketchDeadlineAt ? formatDetailDate(project.sketchDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn nộp Final', value: project.finalDeadlineAt ? formatDetailDate(project.finalDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn hoàn tất review', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Mục đích sử dụng', value: project.usagePurpose || <span className="text-d4u-text-3">Chưa có</span>, fullWidth: true }
  ];
}

function ProjectActionSidebar({
  project,
  applying,
  canApply,
  applyButtonLabel,
  canAccessMarketplaceActions,
  readiness,
  onQuickApply,
  onCustomProposal
}) {
  const sidebarStats = [
    { icon: <WalletOutlined className="h-5 w-5" />, label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { icon: <CalendarOutlined className="h-5 w-5" />, label: 'Hạn review', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : 'Chưa có', muted: !project.totalDeadlineAt }
  ];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <h2 className="text-base font-semibold text-d4u-text-1">Thao tác</h2>
        <div className="mt-4 flex flex-col gap-3">
          <ActionButton
            disabled={!canApply}
            icon={<SendOutlined />}
            loading={applying}
            onClick={onQuickApply}
            title={!canApply && canAccessMarketplaceActions ? 'Bạn đã ứng tuyển hoặc dự án không còn mở để ứng tuyển.' : undefined}
            variant="primary"
          >
            {applyButtonLabel}
          </ActionButton>
          <ActionButton
            disabled={!canApply || applying}
            onClick={onCustomProposal}
            variant="secondary"
          >
            Đề xuất khác
          </ActionButton>
        </div>
      </section>

      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <h2 className="text-base font-semibold text-d4u-text-1">Tóm tắt nhanh</h2>
        <div className="mt-4">
          <ProjectMetadataStrip items={sidebarStats} />
        </div>
      </section>

      {!canAccessMarketplaceActions ? (
        <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Tag color="warning">{readiness.needsProfile ? 'Cần hồ sơ' : 'Cần xác thực'}</Tag>
            <p className="mt-3 text-sm leading-6 text-d4u-text-2">
              {readiness.needsProfile
                ? 'Tạo hồ sơ sinh viên trước để D4U mở tính năng ứng tuyển.'
                : 'Hoàn tất xác thực để gửi proposal và phản hồi offer.'}
            </p>
          </div>
        </section>
      ) : null}
    </aside>
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

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProject(await projectApi.getProject(projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

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
      const fieldErrors = extractApiFieldErrors(requestError, proposalFieldMap);
      if (fieldErrors.length > 0) {
        setCustomConfirmationOpen(false);
        setCustomProposalOpen(true);
        customProposalForm.setFields(fieldErrors);
      }

      const errorMessage = getApiErrorMessage(requestError, 'Không thể gửi ứng tuyển.');
      if (fieldErrors.length === 0) {
        message.error(errorMessage.toLowerCase().includes('already applied')
          ? 'Bạn đã ứng tuyển dự án này rồi.'
          : errorMessage);
      }
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
    <div className="min-h-screen bg-d4u-bg text-d4u-text-1">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ProjectDetailHeader
          metadataItems={buildHeaderMetadata(project)}
          railDescription="Các chỉ số chính trước khi bạn quyết định ứng tuyển dự án này."
          status={project.status}
          statItems={buildHeaderStats(project)}
          title={project.title}
        />

        {readinessNotice}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="flex min-w-0 flex-col gap-6">
            <ProjectBriefSection
              description="Những gì SME cần bạn thực hiện trong workspace này"
              title="Những gì SME cần bạn thực hiện trong workspace này"
              usagePurpose={project.brief}
            />
            <ProjectExecutionInfoGrid
              description="Mốc thời gian và metadata quan trọng trước khi bạn gửi ứng tuyển"
              items={buildExecutionItems(project)}
              title="Mốc thời gian và metadata quan trọng trước khi bạn gửi ứng tuyển"
            />
          </main>

          <ProjectActionSidebar
            applyButtonLabel={applyButtonLabel}
            applying={applying}
            canAccessMarketplaceActions={canAccessMarketplaceActions}
            canApply={canApply}
            onCustomProposal={openCustomProposal}
            onQuickApply={() => setQuickConfirmationOpen(true)}
            project={project}
            readiness={readiness}
          />
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ConfirmItem label="Ngân sách">{formatCurrency(project.budgetAmount, project.currency)}</ConfirmItem>
            <ConfirmItem label="Hạn Sketch">{formatDetailDate(project.sketchDeadlineAt)}</ConfirmItem>
            <ConfirmItem label="Hạn Final">{formatDetailDate(project.finalDeadlineAt)}</ConfirmItem>
            <ConfirmItem label="Hoàn tất review">{formatDetailDate(project.totalDeadlineAt)}</ConfirmItem>
          </div>
        </Modal>

        <Modal title="Đề xuất khác" open={customProposalOpen} footer={null} onCancel={closeApplyFlow}>
          <Form
            form={customProposalForm}
            layout="vertical"
            requiredMark={false}
            validateTrigger={['onChange', 'onBlur']}
            onValuesChange={(changedValues) => {
              const nextFields = Object.keys(changedValues).map((name) => ({ name, errors: [] }));
              customProposalForm.setFields(nextFields);
            }}
          >
            <Form.Item
              name="proposedPrice"
              label="Giá đề xuất mới"
              rules={[
                { required: true, message: 'Vui lòng nhập giá đề xuất.' },
                {
                  validator: (_, value) => {
                    if (value == null || value === '') {
                      return Promise.resolve();
                    }

                    return Number(value) > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Giá đề xuất phải lớn hơn 0.'));
                  }
                }
              ]}
            >
              <InputNumber className="full-width" min={1} addonAfter="VND" />
            </Form.Item>
            <Form.Item
              name="coverLetter"
              label="Giải pháp đề xuất"
              rules={[
                { required: true, message: 'Vui lòng nhập giải pháp đề xuất.' },
                {
                  validator: (_, value) => {
                    const trimmed = value?.trim?.() ?? '';
                    if (!trimmed) return Promise.resolve();
                    if (trimmed.length < 20) {
                      return Promise.reject(new Error('Giải pháp đề xuất cần ít nhất 20 ký tự.'));
                    }
                    if (trimmed.length > 3000) {
                      return Promise.reject(new Error('Giải pháp đề xuất không được vượt quá 3000 ký tự.'));
                    }
                    return Promise.resolve();
                  }
                }
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ConfirmItem label="Giá đề xuất">{formatCurrency(customProposal?.proposedPrice, project.currency)}</ConfirmItem>
            <ConfirmItem label="Giải pháp" wide>{customProposal?.coverLetter}</ConfirmItem>
          </div>
        </Modal>
      </div>
    </div>
  );
}
