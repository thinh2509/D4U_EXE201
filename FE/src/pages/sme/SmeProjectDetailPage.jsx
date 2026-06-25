import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal
} from 'antd';
import {
  CalendarOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  RocketOutlined,
  StopOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { packageApi } from '../../services/packageApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage, getPlanLimitErrorMessage, isPlanLimitError } from '../../utils/apiError.js';
import { buildLocalizedDesignCategoryLabel, localizeDesignCategoryName } from '../../utils/designCategoryLocalization.js';
import { formatCurrency } from '../../utils/format.js';
import { getProjectDeadlineErrors } from '../../utils/projectDeadlineValidation.js';
import {
  ActionButton,
  ProjectBriefSection,
  ProjectDetailHeader,
  ProjectExecutionInfoGrid,
  ProjectFlowHintCard,
  ProjectMetadataStrip
} from '../shared/ProjectDetailUi.jsx';

const AI_MATCHING_ELIGIBLE_PROJECT_STATUSES = ['DRAFT', 'OPEN', 'PRIVATE_INVITED'];

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
  return [
    { label: 'Loại dự án', value: project.projectType || 'Chưa có', muted: !project.projectType },
    { label: 'Danh mục', value: getCategoryLabel(project), muted: !project.designCategoryName },
    { label: 'Hạn review', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : 'Chưa có', muted: !project.totalDeadlineAt },
    { label: 'Publish status', value: project.publishedAt ? formatDetailDate(project.publishedAt) : 'Chưa có', muted: !project.publishedAt }
  ];
}

function buildExecutionItems(project) {
  return [
    { label: 'Trạng thái', value: <StatusBadge status={project.status} /> },
    { label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { label: 'Loại dự án', value: project.projectType || <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Publish lúc', value: project.publishedAt ? formatDetailDate(project.publishedAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn nộp Sketch', value: project.sketchDeadlineAt ? formatDetailDate(project.sketchDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn nộp Final', value: project.finalDeadlineAt ? formatDetailDate(project.finalDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Hạn hoàn tất review', value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : <span className="text-d4u-text-3">Chưa có</span> },
    { label: 'Mục đích sử dụng', value: project.usagePurpose || <span className="text-d4u-text-3">Chưa có</span>, fullWidth: true }
  ];
}

function getPublishValidationMessage(project) {
  const errors = getProjectDeadlineErrors({
    sketchDeadlineAt: project.sketchDeadlineAt,
    finalDeadlineAt: project.finalDeadlineAt,
    totalDeadlineAt: project.totalDeadlineAt
  }, { requireAll: true });

  return errors.sketchDeadlineAt || errors.finalDeadlineAt || errors.totalDeadlineAt || null;
}

function ProjectActionSidebar({
  projectId,
  project,
  acting,
  canEditProject,
  canOpenWorkspace,
  canCancelProject,
  canDeleteProject,
  hasMatchingEntitlement,
  canUseAiMatching,
  onPublish,
  onOpenCancelModal,
  onDelete
}) {
  const sidebarStats = [
    {
      icon: <RocketOutlined className="h-5 w-5" />,
      label: 'Trạng thái',
      value: <StatusBadge status={project.status} />,
      muted: !project.status
    },
    {
      icon: <WalletOutlined className="h-5 w-5" />,
      label: 'Ngân sách',
      value: formatCurrency(project.budgetAmount, project.currency)
    },
    {
      icon: <FolderOpenOutlined className="h-5 w-5" />,
      label: 'Danh mục',
      value: getCategoryLabel(project),
      muted: !project.designCategoryName
    },
    {
      icon: <CalendarOutlined className="h-5 w-5" />,
      label: 'Hạn review',
      value: project.totalDeadlineAt ? formatDetailDate(project.totalDeadlineAt) : 'Chưa có',
      muted: !project.totalDeadlineAt
    }
  ];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-d4u-text-1">Thao tác</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-d4u-text-3">SME Console</span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <ActionButton
            disabled={project.status !== 'DRAFT'}
            icon={<RocketOutlined />}
            loading={acting}
            onClick={onPublish}
            title={project.status !== 'DRAFT' ? 'Chỉ publish được khi dự án ở trạng thái bản nháp.' : undefined}
            variant="primary"
          >
            Publish
          </ActionButton>
          <ActionButton
            icon={<FileSearchOutlined />}
            onClick={() => window.location.assign(`/sme/projects/${projectId}/applications`)}
            variant="secondary"
          >
            Xem ứng tuyển
          </ActionButton>
          <ActionButton
            disabled={hasMatchingEntitlement && !canUseAiMatching}
            icon={hasMatchingEntitlement ? <TeamOutlined /> : <CreditCardOutlined />}
            onClick={() => window.location.assign(hasMatchingEntitlement ? `/sme/ai-matching?projectId=${projectId}` : '/sme/billing')}
            title={hasMatchingEntitlement && !canUseAiMatching ? 'AI Matching chỉ dùng được khi dự án còn ở giai đoạn tuyển chọn.' : undefined}
            variant="soft"
          >
            {hasMatchingEntitlement ? 'AI Matching' : 'Mua gói AI Matching'}
          </ActionButton>
          <ActionButton
            disabled={!canEditProject}
            icon={<EditOutlined />}
            onClick={() => window.location.assign(`/sme/projects/${projectId}/edit`)}
            title={!canEditProject ? 'Trạng thái hiện tại không cho phép chỉnh sửa dự án.' : undefined}
            variant="secondary"
          >
            {project.status === 'DRAFT' ? 'Sửa dự án' : 'Điều chỉnh deadline'}
          </ActionButton>
          {canOpenWorkspace ? (
            <ActionButton
              icon={<FileDoneOutlined />}
              onClick={() => window.location.assign(`/projects/${projectId}/execution`)}
              variant="soft"
            >
              Workspace & escrow
            </ActionButton>
          ) : null}
          <ActionButton
            disabled={!canCancelProject}
            icon={<StopOutlined />}
            loading={acting}
            onClick={onOpenCancelModal}
            title={!canCancelProject ? 'Trạng thái hiện tại không cho phép hủy dự án.' : undefined}
            variant="neutral"
          >
            Hủy dự án
          </ActionButton>
          <ActionButton
            icon={<DeleteOutlined />}
            disabled={!canDeleteProject}
            loading={acting}
            onClick={onDelete}
            title={!canDeleteProject ? 'Chỉ xóa được khi dự án còn sạch và chưa phát sinh dữ liệu liên quan.' : undefined}
            variant="danger"
          >
            Xóa
          </ActionButton>
        </div>
      </section>

      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-d4u-text-1">Tóm tắt nhanh</h2>
          <span className="text-xs font-medium text-d4u-text-3">Một khu vực summary duy nhất</span>
        </div>
        <div className="mt-4">
          <ProjectMetadataStrip items={sidebarStats} />
        </div>
      </section>

      <ProjectFlowHintCard />
    </aside>
  );
}

export function SmeProjectDetailPage() {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [cancelForm] = Form.useForm();
  const [project, setProject] = useState(null);
  const [hasMatchingEntitlement, setHasMatchingEntitlement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectResponse, entitlementRows] = await Promise.all([
        projectApi.getProject(projectId),
        packageApi.listMyEntitlements().catch(() => [])
      ]);
      setProject(projectResponse);
      setHasMatchingEntitlement(entitlementRows.some((item) => item.status === 'ACTIVE' && item.entitlementCode === 'SME_AI_MATCHING'));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const publish = async () => {
    const deadlineError = getPublishValidationMessage(project);
    if (deadlineError) {
      message.error(deadlineError);
      return;
    }

    setActing(true);
    try {
      setProject(await projectApi.publishProject(projectId));
      message.success('Đã publish dự án.');
    } catch (requestError) {
      if (isPlanLimitError(requestError)) {
        modal.error({
          centered: true,
          title: '\u0056\u01b0\u1ee3t gi\u1edbi h\u1ea1n g\u00f3i hi\u1ec7n t\u1ea1i',
          content: getPlanLimitErrorMessage(requestError),
          okText: '\u0110\u00e3 hi\u1ec3u',
        });
      } else {
        message.error(getApiErrorMessage(requestError, 'Không thể publish dự án.'));
      }
    } finally {
      setActing(false);
    }
  };

  const submitCancel = async () => {
    const values = await cancelForm.validateFields();

    setActing(true);
    try {
      setProject(await projectApi.cancelProject(projectId, values.cancellationReason.trim()));
      message.success('Đã hủy dự án.');
      setCancelModalOpen(false);
      cancelForm.resetFields();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể hủy dự án.'));
    } finally {
      setActing(false);
    }
  };

  const openCancelModal = () => {
    cancelForm.resetFields();
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    cancelForm.resetFields();
  };

  const remove = async () => {
    modal.confirm({
      title: 'Xóa vĩnh viễn dự án?',
      content: 'Xóa sẽ xóa hẳn dự án khỏi hệ thống và không thể khôi phục. Chỉ dùng khi dự án chưa phát sinh dữ liệu liên quan.',
      okText: 'Xóa vĩnh viễn',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setActing(true);
        try {
          await projectApi.deleteProject(projectId);
          message.success('Đã xóa dự án vĩnh viễn.');
          navigate('/sme/projects');
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể xóa dự án.'));
        } finally {
          setActing(false);
        }
      }
    });
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;

  const canOpenWorkspace = ['OFFER_SELECTED', 'IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW', 'REVISION_REQUESTED', 'ADMIN_REVIEW', 'COMPLETED', 'CANCELLED'].includes(project.status);
  const canCancelProject = ['DRAFT', 'OPEN', 'PRIVATE_INVITED', 'IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW', 'REVISION_REQUESTED', 'ADMIN_REVIEW'].includes(project.status);
  const canDeleteProject = ['DRAFT', 'OPEN', 'PRIVATE_INVITED'].includes(project.status);
  const canEditProject = ['DRAFT', 'OPEN', 'PRIVATE_INVITED', 'OFFER_SELECTED'].includes(project.status);
  const canUseAiMatching = hasMatchingEntitlement && AI_MATCHING_ELIGIBLE_PROJECT_STATUSES.includes(project.status);

  return (
    <div className="min-h-screen bg-d4u-bg text-d4u-text-1">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ProjectDetailHeader
          metadataItems={buildHeaderMetadata(project)}
          status={project.status}
          title={project.title}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="flex min-w-0 flex-col gap-6">
            <ProjectBriefSection
              description="Nội dung SME đang yêu cầu Student thực hiện và các điểm cần hiểu nhanh trước khi duyệt tiếp."
              title="Nội dung SME đang yêu cầu Student thực hiện"
              usagePurpose={project.brief}
            />
            <ProjectExecutionInfoGrid
              description="Các mốc thời gian và metadata quan trọng để theo dõi tiến độ, publish và review."
              items={buildExecutionItems(project)}
              title="Các mốc thời gian và metadata để theo dõi dự án"
            />
          </main>

          <ProjectActionSidebar
            acting={acting}
            canCancelProject={canCancelProject}
            canDeleteProject={canDeleteProject}
            canEditProject={canEditProject}
            canOpenWorkspace={canOpenWorkspace}
            hasMatchingEntitlement={hasMatchingEntitlement}
            canUseAiMatching={canUseAiMatching}
            onDelete={remove}
            onOpenCancelModal={openCancelModal}
            onPublish={publish}
            project={project}
            projectId={projectId}
          />
        </div>
      </div>

      <Modal
        title="Hủy dự án"
        open={cancelModalOpen}
        onCancel={closeCancelModal}
        footer={null}
        destroyOnHidden
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            Hủy dự án sẽ dừng luồng ứng tuyển, offer, escrow và các bước tiến trình liên quan. Hãy chắc chắn bạn đã thông báo rõ cho Student nếu dự án đã có tương tác.
          </div>

          <Form
            form={cancelForm}
            layout="vertical"
            requiredMark={false}
            validateTrigger={['onChange', 'onBlur']}
            onValuesChange={() => {
              cancelForm.validateFields(['cancellationReason']).catch(() => {});
            }}
          >
            <Form.Item
              name="cancellationReason"
              label="Lý do hủy dự án"
              rules={[
                { required: true, message: 'Vui lòng nhập lý do hủy dự án.' },
                {
                  validator: (_, value) => {
                    const trimmed = value?.trim?.() ?? '';
                    if (!trimmed) return Promise.resolve();
                    if (trimmed.length < 10) {
                      return Promise.reject(new Error('Lý do hủy dự án cần ít nhất 10 ký tự.'));
                    }
                    if (trimmed.length > 500) {
                      return Promise.reject(new Error('Lý do hủy dự án không được vượt quá 500 ký tự.'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.TextArea
                rows={5}
                maxLength={500}
                showCount
                placeholder="Ví dụ: Brief thay đổi, SME chưa sẵn sàng ngân sách, hoặc cần đóng dự án để tạo brief mới rõ ràng hơn."
                className="rounded-2xl"
              />
            </Form.Item>

            <Alert
              type="warning"
              showIcon
              message="Sau khi hủy, dự án sẽ chuyển sang trạng thái CANCELLED và lịch sử vẫn được giữ lại để đối soát."
            />

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button onClick={closeCancelModal}>Đóng</Button>
              <Button danger type="primary" loading={acting} onClick={submitCancel}>
                Hủy dự án
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
