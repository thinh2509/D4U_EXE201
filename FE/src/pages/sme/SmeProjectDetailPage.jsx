import { DeleteOutlined, EditOutlined, FileDoneOutlined, FileSearchOutlined, RocketOutlined, StopOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

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
  const canOpenWorkspace = ['OFFER_SELECTED', 'IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW', 'REVISION_REQUESTED', 'ADMIN_REVIEW', 'COMPLETED'].includes(project.status);

  return (
    <>
      <PageHeader
        title={project.title}
        description={project.designCategoryName}
        extra={<StatusBadge status={project.status} />}
      />

      <div className="project-detail-layout">
        <div className="project-detail-main">
          <Card title="Brief dự án">
            <div className="rich-text-block">{project.brief}</div>
          </Card>
          <Card title="Thông tin thực hiện">
            <Descriptions column={{ xs: 1, md: 2 }} bordered>
              <Descriptions.Item label="Trạng thái"><StatusBadge status={project.status} /></Descriptions.Item>
              <Descriptions.Item label="Ngân sách">{formatCurrency(project.budgetAmount, project.currency)}</Descriptions.Item>
              <Descriptions.Item label="Loại dự án">{project.projectType}</Descriptions.Item>
              <Descriptions.Item label="Deadline sketch">{formatDate(project.sketchDeadlineAt)}</Descriptions.Item>
              <Descriptions.Item label="Deadline final">{formatDate(project.finalDeadlineAt)}</Descriptions.Item>
              <Descriptions.Item label="Deadline tổng">{formatDate(project.totalDeadlineAt)}</Descriptions.Item>
              <Descriptions.Item label="Publish lúc">{formatDate(project.publishedAt)}</Descriptions.Item>
              <Descriptions.Item label="Mục đích sử dụng" span={2}>{project.usagePurpose || 'Chưa có'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <aside className="project-side-panel">
          <Card title="Thao tác">
            <Space direction="vertical" className="full-width">
              <Button block icon={<EditOutlined />} onClick={() => navigate(`/sme/projects/${projectId}/edit`)}>Sửa dự án</Button>
              <Button block icon={<FileSearchOutlined />} onClick={() => navigate(`/sme/projects/${projectId}/applications`)}>Xem ứng tuyển</Button>
              {canOpenWorkspace ? <Button block type="primary" icon={<FileDoneOutlined />} onClick={() => navigate(`/projects/${projectId}/execution`)}>Workspace & escrow</Button> : null}
              <Button block type="primary" icon={<RocketOutlined />} loading={acting} onClick={publish} disabled={project.status !== 'DRAFT'}>Publish</Button>
              <Button block danger icon={<StopOutlined />} loading={acting} onClick={cancel} disabled={!['DRAFT', 'OPEN', 'PRIVATE_INVITED'].includes(project.status)}>Hủy dự án</Button>
              <Button block danger icon={<DeleteOutlined />} loading={acting} onClick={remove}>Xóa</Button>
            </Space>
          </Card>
        </aside>
      </div>
    </>
  );
}
