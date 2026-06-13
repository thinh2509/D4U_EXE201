import {
  CalendarOutlined,
  FolderOpenOutlined,
  SendOutlined,
  ThunderboltOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Alert, App, Button, Form, Input, InputNumber, Modal, Space, Tag } from 'antd';
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

function AiSuggestionCard({ proposalMeta }) {
  if (!proposalMeta) {
    return (
      <Alert
        type="info"
        showIcon
        message="AI sẽ dựa trên brief dự án và hồ sơ năng lực của bạn để gợi ý proposal nháp."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert
        type="success"
        showIcon
        message={`Đã tạo proposal bằng ${proposalMeta.provider}. Còn ${proposalMeta.remainingUsage} lượt trong gói hiện tại.`}
      />
      {proposalMeta.strengths?.length ? (
        <div className="rounded-2xl border border-d4u-border bg-d4u-soft/60 p-4">
          <div className="text-sm font-semibold text-d4u-text-1">Điểm mạnh được AI nhấn mạnh</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-d4u-text-2">
            {proposalMeta.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {proposalMeta.warnings?.length ? (
        <Alert
          type="warning"
          showIcon
          message="Lưu ý từ AI"
          description={
            <ul className="mb-0 list-disc pl-5">
              {proposalMeta.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          }
        />
      ) : null}
    </div>
  );
}

function ProjectActionSidebar({
  project,
  applying,
  canApply,
  applyButtonLabel,
  canAccessMarketplaceActions,
  readiness,
  onApply
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
            onClick={onApply}
            title={!canApply && canAccessMarketplaceActions ? 'Bạn đã ứng tuyển hoặc dự án không còn mở để ứng tuyển.' : undefined}
            variant="primary"
          >
            {applyButtonLabel}
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
  const [applicationForm] = Form.useForm();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [proposalMeta, setProposalMeta] = useState(null);
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

  const resetApplicationFlow = useCallback(() => {
    setApplicationModalOpen(false);
    setProposalMeta(null);
    applicationForm.resetFields();
  }, [applicationForm]);

  const openApplicationModal = useCallback(() => {
    applicationForm.setFieldsValue({
      proposedPrice: project?.budgetAmount ?? null,
      coverLetter: ''
    });
    setProposalMeta(null);
    setApplicationModalOpen(true);
  }, [applicationForm, project]);

  const submitApplication = async (payload) => {
    setApplying(true);
    try {
      await projectApi.submitApplication(projectId, payload);
      message.success('Đã gửi ứng tuyển.');
      resetApplicationFlow();
      await loadProject();
    } catch (requestError) {
      const fieldErrors = extractApiFieldErrors(requestError, proposalFieldMap);
      if (fieldErrors.length > 0) {
        applicationForm.setFields(fieldErrors);
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

  const submitApplicationFromForm = async () => {
    const values = await applicationForm.validateFields();
    await submitApplication({
      proposedPrice: Number(values.proposedPrice),
      coverLetter: values.coverLetter.trim(),
      estimatedDurationDays: null
    });
  };

  const generateProposalWithAi = async () => {
    setGeneratingProposal(true);
    try {
      const response = await projectApi.generateAiProposal(projectId);
      applicationForm.setFieldValue('coverLetter', response.proposalText);
      applicationForm.setFields([{ name: 'coverLetter', errors: [] }]);
      setProposalMeta(response);
      message.success('Đã tạo proposal bằng AI. Bạn có thể chỉnh sửa trước khi gửi.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tạo proposal bằng AI.'));
    } finally {
      setGeneratingProposal(false);
    }
  };

  if (loading || readiness.loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;
  if (readiness.error) return <ErrorState description={readiness.error} onRetry={readiness.reload} />;

  const hasApplied = Boolean(project.hasApplied);
  const canAccessMarketplaceActions = readiness.hasProfile && readiness.isApproved;
  const canApply = project.status === 'OPEN' && !hasApplied && canAccessMarketplaceActions;
  const applyButtonLabel = hasApplied ? 'Đã ứng tuyển' : 'Gửi ứng tuyển';
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
      description="SME chỉ nên nhận proposal từ Student đã xác thực. Hãy hoàn tất xác thực để gửi ứng tuyển."
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
            onApply={openApplicationModal}
            project={project}
            readiness={readiness}
          />
        </div>

        <Modal
          title="Gửi ứng tuyển"
          open={applicationModalOpen}
          footer={null}
          onCancel={resetApplicationFlow}
          destroyOnClose
        >
          <Form
            form={applicationForm}
            layout="vertical"
            requiredMark={false}
            validateTrigger={['onChange', 'onBlur']}
            onValuesChange={(changedValues) => {
              const nextFields = Object.keys(changedValues).map((name) => ({ name, errors: [] }));
              applicationForm.setFields(nextFields);
            }}
          >
            <Form.Item
              name="proposedPrice"
              label="Giá đề xuất"
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

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Button
                icon={<ThunderboltOutlined />}
                loading={generatingProposal}
                onClick={generateProposalWithAi}
              >
                Tạo proposal bằng AI
              </Button>
              {proposalMeta ? (
                <Tag color="processing">Còn {proposalMeta.remainingUsage} lượt AI</Tag>
              ) : null}
            </div>

            <div className="mb-4">
              <AiSuggestionCard proposalMeta={proposalMeta} />
            </div>

            <Form.Item
              name="coverLetter"
              label="Giải pháp đề xuất"
              extra="AI chỉ tạo bản nháp hỗ trợ. Bạn vẫn cần tự rà soát và chỉnh sửa trước khi gửi."
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
              <Input.TextArea rows={7} maxLength={3000} showCount />
            </Form.Item>

            <Space>
              <Button type="primary" loading={applying} onClick={submitApplicationFromForm}>
                Gửi ứng tuyển
              </Button>
              <Button onClick={resetApplicationFlow}>Hủy</Button>
            </Space>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
