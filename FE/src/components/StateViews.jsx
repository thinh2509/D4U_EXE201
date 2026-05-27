import { ApiOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Empty, Result, Skeleton, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

export function LoadingState({ label = 'Đang tải dữ liệu...', type = 'spinner' }) {
  if (type === 'skeleton') {
    return (
      <div className="skeleton-panel">
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  return (
    <div className="state-box">
      <Spin size="large" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ description = 'Chưa có dữ liệu.', actionLabel, onAction }) {
  return (
    <div className="empty-panel">
      <Empty description={description}>
        {actionLabel && <Button type="primary" onClick={onAction}>{actionLabel}</Button>}
      </Empty>
    </div>
  );
}

export function ErrorState({ title = 'Không thể tải dữ liệu', description, onRetry }) {
  return (
    <div className="result-panel">
      <Result
        status="warning"
        title={title}
        subTitle={description}
        extra={onRetry && <Button type="primary" onClick={onRetry}>Thử lại</Button>}
      />
    </div>
  );
}

export function BackendGapState({
  title = 'API chưa sẵn sàng',
  description = 'Màn hình này đã được chuẩn bị theo MVP mới, nhưng backend endpoint tương ứng chưa được triển khai.',
  backTo
}) {
  const navigate = useNavigate();
  return (
    <div className="result-panel">
      <Result
        icon={<ApiOutlined className="result-brand-icon" />}
        title={title}
        subTitle={description}
        extra={backTo && (
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backTo)}>
            Quay lại
          </Button>
        )}
      />
    </div>
  );
}
