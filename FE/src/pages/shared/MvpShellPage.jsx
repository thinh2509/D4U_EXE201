import {
  ApiOutlined,
  BulbOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { BackendGapState } from '../../components/StateViews.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const dashboardCards = {
  STUDENT: [
    ['Xác thực', 'Hoàn thiện xác thực sinh viên để đủ điều kiện ứng tuyển.', '/student/verification', <SafetyCertificateOutlined />],
    ['Dự án đang mở', 'Tìm brief phù hợp và gửi ứng tuyển.', '/student/projects', <FolderOpenOutlined />],
    ['Portfolio', 'Chuẩn bị hồ sơ năng lực từ các dự án được phép công khai.', '/student/portfolio', <StarOutlined />],
    ['Ví D4U', 'Theo dõi số dư nội bộ và yêu cầu rút tiền thủ công.', '/student/wallet', <WalletOutlined />]
  ],
  SME: [
    ['Tạo dự án', 'Viết brief, dùng AI hỗ trợ và publish khi sẵn sàng.', '/sme/projects/new', <FolderOpenOutlined />],
    ['Đề nghị & escrow', 'Theo dõi offer đã accept và mở thanh toán PayOS cho từng dự án.', '/sme/offers', <CreditCardOutlined />],
    ['AI Brief', 'Nhận gợi ý brief có thể chỉnh sửa trước khi lưu.', '/sme/ai-brief', <BulbOutlined />],
    ['AI Matching', 'Tìm sinh viên phù hợp khi có gói tính năng đang hoạt động.', '/sme/ai-matching', <TeamOutlined />],
    ['Gói & thanh toán', 'Mua gói tính năng bằng provider payment-in thật.', '/sme/billing', <CreditCardOutlined />]
  ],
  ADMIN: [
    ['Duyệt xác thực', 'Xem và xử lý yêu cầu xác thực sinh viên.', '/admin/verifications', <SafetyCertificateOutlined />],
    ['Portfolio', 'Ẩn các portfolio item không phù hợp nếu cần.', '/admin/portfolio', <StarOutlined />],
    ['Rút tiền', 'Xử lý withdrawal sau khi Finance chuyển khoản ngoài hệ thống.', '/admin/withdrawals', <WalletOutlined />],
    ['Audit logs', 'Theo dõi các hành động quan trọng của hệ thống.', '/admin/audit-logs', <FileDoneOutlined />]
  ]
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cards = dashboardCards[user?.role] || [];

  return (
    <>
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow="D4U workspace"
        title="Tổng quan"
        description="Các lối tắt chính cho vai trò hiện tại. Những chức năng chưa có API thật sẽ hiển thị trạng thái chờ backend thay vì dùng dữ liệu giả."
      />
      <div className="dashboard-grid">
        {cards.map(([title, description, path, icon]) => (
          <Card key={path} className="dashboard-card" hoverable onClick={() => navigate(path)}>
            <div className="dashboard-card-icon">{icon}</div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <Button type="link">Mở</Button>
          </Card>
        ))}
      </div>
    </>
  );
}

export function FeatureShellPage({
  title,
  description,
  role,
  backTo,
  icon = <ApiOutlined />,
  endpoint,
  notes = [],
  children
}) {
  return (
    <>
      <PageHeader icon={icon} title={title} description={description} />
      <Card className="feature-shell-card">
        <div className="feature-shell-copy">
          <Tag color="cyan">{role || 'MVP shell'}</Tag>
          <h2>API chưa sẵn sàng cho feature này</h2>
          <p>
            Route và cấu trúc UX đã được chuẩn bị theo MVP. Khi backend triển khai endpoint,
            màn hình sẽ gọi API thật và không dùng dữ liệu mẫu.
          </p>
          {endpoint && <code>{endpoint}</code>}
          {notes.length > 0 && (
            <ul>
              {notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}
          {children && <div className="feature-shell-actions">{children}</div>}
        </div>
      </Card>
      <BackendGapState backTo={backTo} />
    </>
  );
}
