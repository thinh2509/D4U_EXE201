import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  RocketOutlined,
  StopOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { App } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency } from '../../utils/format.js';
import {
  ActionButton,
  ProjectBriefSection,
  ProjectDetailHeader,
  ProjectExecutionInfoGrid,
  ProjectFlowHintCard,
  ProjectMetadataStrip
} from '../shared/ProjectDetailUi.jsx';

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

function buildHeaderMetadata(project) {
  return [
    { label: 'Loại dự án', value: project.projectType || 'Chưa có' },
    { label: 'Danh mục', value: project.designCategoryName || 'Chưa có' },
    { label: 'Hạn review', value: formatDetailDate(project.totalDeadlineAt), muted: !project.totalDeadlineAt },
    { label: 'Publish status', value: project.publishedAt ? formatDetailDate(project.publishedAt) : 'Chưa có', muted: !project.publishedAt }
  ];
}

function buildHeaderStats(project) {
  return [
    { icon: <FolderOpenOutlined className="h-5 w-5" />, label: 'Danh mục', value: project.designCategoryName || 'Chưa có', muted: !project.designCategoryName },
    { icon: <WalletOutlined className="h-5 w-5" />, label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { icon: <CalendarOutlined className="h-5 w-5" />, label: 'Publish', value: project.publishedAt ? formatDetailDate(project.publishedAt) : 'Chưa có', muted: !project.publishedAt }
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

function ProjectActionSidebar({
  projectId,
  project,
  acting,
  canEditProject,
  canOpenWorkspace,
  canCancelProject,
  onPublish,
  onCancel,
  onDelete
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
            onClick={onCancel}
            title={!canCancelProject ? 'Trạng thái hiện tại không cho phép hủy dự án.' : undefined}
            variant="neutral"
          >
            Hủy dự án
          </ActionButton>
          <ActionButton
            icon={<DeleteOutlined />}
            loading={acting}
            onClick={onDelete}
            variant="danger"
          >
            Xóa
          </ActionButton>
        </div>
      </section>

      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <h2 className="text-base font-semibold text-d4u-text-1">Tóm tắt nhanh</h2>
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
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);

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

  const publish = async () => {
    setActing(true);
    try {
      setProject(await projectApi.publishProject(projectId));
      message.success('Đã publish dự án.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể publish dự án.'));
    } finally {
      setActing(false);
    }
  };

  const cancel = () => {
    let reason = '';
    modal.confirm({
      title: 'Hủy dự án?',
      content: (
        <textarea
          className="min-h-32 w-full resize-y rounded-btn border border-d4u-border bg-white px-3 py-3 text-sm leading-6 text-d4u-text-1 placeholder:text-d4u-text-3 transition-colors hover:border-d4u-teal-muted focus:border-d4u-cyan focus:outline-none focus:shadow-focus"
          onChange={(event) => {
            reason = event.target.value;
          }}
          placeholder="Lý do hủy..."
        />
      ),
      okText: 'Hủy dự án',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      async onOk() {
        setActing(true);
        try {
          setProject(await projectApi.cancelProject(projectId, reason || 'Cancelled by SME.'));
          message.success('Đã hủy dự án.');
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể hủy dự án.'));
        } finally {
          setActing(false);
        }
      }
    });
  };

  const remove = async () => {
    setActing(true);
    try {
      await projectApi.deleteProject(projectId);
      message.success('Đã xóa/hủy dự án.');
      navigate('/sme/projects');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa dự án.'));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;

  const canOpenWorkspace = ['OFFER_SELECTED', 'IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW', 'REVISION_REQUESTED', 'ADMIN_REVIEW', 'COMPLETED', 'CANCELLED'].includes(project.status);
  const canCancelProject = ['DRAFT', 'OPEN', 'PRIVATE_INVITED', 'IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW', 'REVISION_REQUESTED', 'ADMIN_REVIEW'].includes(project.status);
  const canEditProject = ['DRAFT', 'OPEN', 'PRIVATE_INVITED', 'OFFER_SELECTED'].includes(project.status);

  return (
    <div className="min-h-screen bg-d4u-bg text-d4u-text-1">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ProjectDetailHeader
          metadataItems={buildHeaderMetadata(project)}
          railDescription="Các chỉ số chính để quyết định publish hoặc điều chỉnh dự án."
          status={project.status}
          statItems={buildHeaderStats(project)}
          title={project.title}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="flex min-w-0 flex-col gap-6">
            <ProjectBriefSection
              description="Nội dung SME đang yêu cầu Student thực hiện"
              title="Nội dung SME đang yêu cầu Student thực hiện"
              usagePurpose={project.brief}
            />
            <ProjectExecutionInfoGrid
              description="Các mốc thời gian và metadata để theo dõi dự án"
              items={buildExecutionItems(project)}
              title="Các mốc thời gian và metadata để theo dõi dự án"
            />
          </main>

          <ProjectActionSidebar
            acting={acting}
            canCancelProject={canCancelProject}
            canEditProject={canEditProject}
            canOpenWorkspace={canOpenWorkspace}
            onCancel={cancel}
            onDelete={remove}
            onPublish={publish}
            project={project}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  );
}
