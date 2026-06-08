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
import { App, Button, Card, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency } from '../../utils/format.js';

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
  const metaItems = [
    { icon: <FolderOpenOutlined />, label: 'Danh mục', value: project.designCategoryName || 'Chưa có' },
    { icon: <WalletOutlined />, label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { icon: <CalendarOutlined />, label: 'Publish', value: formatDetailDate(project.publishedAt) }
  ];

  return (
    <section className="project-hero-card">
      <div className="project-hero-main">
        <div className="project-hero-eyebrow">
          <span>Project detail</span>
          <StatusBadge status={project.status} />
        </div>
        <h1>{project.title}</h1>
        <p className="project-hero-subtitle">
          {project.projectType} · {project.designCategoryName || 'Dự án thiết kế'} · Hạn review {formatDetailDate(project.totalDeadlineAt)}
        </p>
        <div className="project-hero-meta">
          {metaItems.map((item) => (
            <div className="project-meta-chip" key={item.label}>
              <span className="project-meta-icon">{item.icon}</span>
              <div>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
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
        <strong>Nội dung SME đang yêu cầu Student thực hiện</strong>
      </div>
      <div className="rich-text-block project-brief-copy">{brief}</div>
    </Card>
  );
}

function ProjectInfoGrid({ project }) {
  const items = [
    { label: 'Trạng thái', value: <StatusBadge status={project.status} /> },
    { label: 'Ngân sách', value: formatCurrency(project.budgetAmount, project.currency) },
    { label: 'Loại dự án', value: project.projectType },
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
        <strong>Các mốc thời gian và metadata để theo dõi dự án</strong>
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
  return (
    <Card className="project-action-panel" title="Thao tác">
      <div className="project-action-stack">
        {canOpenWorkspace ? (
          <Button
            block
            type="primary"
            size="large"
            icon={<FileDoneOutlined />}
            onClick={() => window.location.assign(`/projects/${projectId}/execution`)}
          >
            Workspace & escrow
          </Button>
        ) : null}
        <Button block size="large" icon={<FileSearchOutlined />} onClick={() => window.location.assign(`/sme/projects/${projectId}/applications`)}>
          Xem ứng tuyển
        </Button>
        <Button
          block
          size="large"
          type="default"
          icon={<RocketOutlined />}
          loading={acting}
          onClick={onPublish}
          disabled={project.status !== 'DRAFT'}
        >
          Publish
        </Button>
        <Button
          block
          size="large"
          icon={<EditOutlined />}
          disabled={!canEditProject}
          onClick={() => window.location.assign(`/sme/projects/${projectId}/edit`)}
        >
          {project.status === 'DRAFT' ? 'Sửa dự án' : 'Điều chỉnh deadline'}
        </Button>
        <Button
          block
          size="large"
          icon={<StopOutlined />}
          loading={acting}
          onClick={onCancel}
          disabled={!canCancelProject}
        >
          Hủy dự án
        </Button>
        <Button block size="large" danger ghost icon={<DeleteOutlined />} loading={acting} onClick={onDelete}>
          Xóa
        </Button>
      </div>
      <div className="project-action-notes">
        <Tag color="processing">Flow hiện tại</Tag>
        <p>Project chỉ đi vào execution sau khi offer được chấp nhận và PayOS xác nhận escrow thành công.</p>
      </div>
    </Card>
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
      content: <textarea className="reject-textarea" placeholder="Lý do hủy..." onChange={(event) => { reason = event.target.value; }} />,
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
    <>
      <ProjectDetailHeader project={project} />

      <div className="project-detail-layout modern-project-detail">
        <div className="project-detail-main">
          <ProjectBriefCard brief={project.brief} />
          <ProjectInfoGrid project={project} />
        </div>

        <aside className="project-side-panel">
          <ProjectActionPanel
            projectId={projectId}
            project={project}
            acting={acting}
            canEditProject={canEditProject}
            canOpenWorkspace={canOpenWorkspace}
            canCancelProject={canCancelProject}
            onPublish={publish}
            onCancel={cancel}
            onDelete={remove}
          />
        </aside>
      </div>
    </>
  );
}
