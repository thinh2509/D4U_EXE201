import {
  ApiOutlined,
  ArrowRightOutlined,
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

const dashboardContent = {
  STUDENT: {
    label: 'Student workspace',
    title: 'Sẵn sàng nhận dự án thiết kế thật',
    description: 'Hoàn thiện xác thực, tìm dự án phù hợp, theo dõi offer và quản lý ví D4U sau khi hoàn thành Final.',
    primaryPath: '/student/projects',
    primaryLabel: 'Tìm dự án',
    insight: 'Ưu tiên hoàn thiện xác thực trước khi ứng tuyển để SME tin tưởng hơn.',
    cards: [
      ['Xác thực', 'Hoàn thiện hồ sơ sinh viên để đủ điều kiện ứng tuyển.', '/student/verification', <SafetyCertificateOutlined />, 'Cần làm trước'],
      ['Dự án đang mở', 'Tìm brief phù hợp và gửi proposal rõ ràng.', '/student/projects', <FolderOpenOutlined />, 'Cơ hội mới'],
      ['Đề nghị', 'Phản hồi offer trước khi SME mở thanh toán escrow.', '/student/offers', <FileDoneOutlined />, 'Cần phản hồi'],
      ['Ví D4U', 'Theo dõi ledger nội bộ và yêu cầu rút tiền thủ công.', '/student/wallet', <WalletOutlined />, 'Thanh toán']
    ]
  },
  SME: {
    label: 'SME workspace',
    title: 'Biến nhu cầu thiết kế thành project có thể triển khai',
    description: 'Tạo brief, nhận ứng tuyển, gửi offer, thanh toán escrow và review Sketch/Final trong cùng một luồng.',
    primaryPath: '/sme/projects/new',
    primaryLabel: 'Tạo dự án',
    insight: 'Brief càng rõ, Student càng dễ gửi proposal sát nhu cầu và deadline.',
    cards: [
      ['Tạo dự án', 'Viết brief, dùng AI hỗ trợ và publish khi sẵn sàng.', '/sme/projects/new', <FolderOpenOutlined />, 'Bắt đầu'],
      ['Ứng tuyển', 'So sánh proposal trước khi chọn Student phù hợp.', '/sme/applications', <TeamOutlined />, 'Tuyển chọn'],
      ['Đề nghị & escrow', 'Theo dõi offer đã accept và mở thanh toán PayOS.', '/sme/offers', <CreditCardOutlined />, 'Cần chú ý'],
      ['AI Brief', 'Nhận gợi ý brief tiếng Việt có thể chỉnh sửa.', '/sme/ai-brief', <BulbOutlined />, 'Hỗ trợ']
    ]
  },
  ADMIN: {
    label: 'Admin console',
    title: 'Điều phối các bước vận hành quan trọng',
    description: 'Duyệt xác thực, xử lý rút tiền, theo dõi audit logs và moderation phục vụ demo Outcome 1.',
    primaryPath: '/admin/verifications',
    primaryLabel: 'Duyệt xác thực',
    insight: 'Các thao tác tài chính và xác thực cần rõ trạng thái, người xử lý và thời điểm cập nhật.',
    cards: [
      ['Duyệt xác thực', 'Xem và xử lý yêu cầu xác thực sinh viên.', '/admin/verifications', <SafetyCertificateOutlined />, 'Vận hành'],
      ['Rút tiền', 'Cập nhật kết quả sau khi Finance chuyển khoản thủ công.', '/admin/withdrawals', <WalletOutlined />, 'Tài chính'],
      ['Người dùng', 'Theo dõi tài khoản Student, SME và Admin.', '/admin/users', <TeamOutlined />, 'Quản trị'],
      ['Audit logs', 'Theo dõi các hành động quan trọng của hệ thống.', '/admin/audit-logs', <FileDoneOutlined />, 'Giám sát']
    ]
  }
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const content = dashboardContent[user?.role] || dashboardContent.STUDENT;

  return (
    <>
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan"
        description="Các tác vụ quan trọng nhất cho vai trò hiện tại. D4U chỉ hiển thị dữ liệu thật từ API và không dùng số liệu giả cho dashboard."
        extra={<Button type="primary" onClick={() => navigate(content.primaryPath)}>{content.primaryLabel}</Button>}
      />

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <Tag color="cyan">{content.label}</Tag>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="dashboard-insight">
            <span>Gợi ý workflow</span>
            <strong>{content.insight}</strong>
          </div>
        </div>
        <div className="dashboard-hero-action">
          <span>Next action</span>
          <Button type="primary" size="large" onClick={() => navigate(content.primaryPath)}>
            {content.primaryLabel} <ArrowRightOutlined />
          </Button>
        </div>
      </section>

      <div className="dashboard-section-heading">
        <span>Workflow chính</span>
        <strong>Chọn bước cần xử lý tiếp theo</strong>
      </div>

      <div className="dashboard-grid">
        {content.cards.map(([title, description, path, icon, badge]) => (
          <Card key={path} className="dashboard-card" hoverable onClick={() => navigate(path)}>
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon">{icon}</div>
              <Tag>{badge}</Tag>
            </div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <Button type="link">Mở <ArrowRightOutlined /></Button>
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
