import { CalendarOutlined, EyeOutlined, FileProtectOutlined, FileTextOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import { StatusBadge } from './StatusBadge.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export function ProjectCard({ project, onOpen, actionLabel = 'Xem chi tiết' }) {
  return (
    <Card className="project-card" hoverable onClick={onOpen}>
      <div className="project-card-accent" />
      <div className="project-card-content">
        <div className="project-card-tags">
          <StatusBadge status={project.status} />
          {project.hasApplied && <Tag className="soft-tag" color="blue">Đã ứng tuyển</Tag>}
          {project.designCategoryName && <Tag className="soft-tag" color="cyan">{project.designCategoryName}</Tag>}
        </div>

        <div className="project-card-main">
          <h2>{project.title}</h2>
          <p>{project.brief}</p>
        </div>

        <div className="project-card-footer">
          <div className="project-meta-grid">
            <span className="project-meta-item">
              <WalletOutlined />
              <span>
                <small>Ngân sách</small>
                <strong>{formatCurrency(project.budgetAmount, project.currency)}</strong>
              </span>
            </span>
            <span className="project-meta-item">
              <CalendarOutlined />
              <span>
                <small>Deadline</small>
                <strong>{formatDate(project.totalDeadlineAt)}</strong>
              </span>
            </span>
          </div>

          <Button
            className="project-card-action"
            type="primary"
            ghost
            icon={actionLabel === 'Xem chi tiết' ? <EyeOutlined /> : <FileTextOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {project.hasApplied ? 'Đã ứng tuyển' : actionLabel}
          </Button>
        </div>
      </div>
      {project.projectType === 'PRIVATE' && <FileProtectOutlined className="project-card-watermark" />}
    </Card>
  );
}
