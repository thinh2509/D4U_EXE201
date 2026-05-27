import { AuditOutlined, StarOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { FeatureShellPage } from '../shared/MvpShellPage.jsx';

export function AdminPortfolioPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Portfolio moderation"
      description="Ẩn các portfolio item không phù hợp khi cần, không phải mạng xã hội portfolio nâng cao."
      role="Admin"
      endpoint="POST /api/v1/admin/portfolio-items/{id}/hide"
      backTo="/admin/dashboard"
    />
  );
}

export function AdminWithdrawalsPage() {
  return (
    <FeatureShellPage
      icon={<WalletOutlined />}
      title="Xử lý rút tiền"
      description="Admin/Finance cập nhật trạng thái sau khi chuyển khoản thủ công ngoài hệ thống."
      role="Admin"
      endpoint="POST /api/v1/admin/withdrawal-requests/{id}/process"
      notes={['Không automatic bank payout trong MVP.', 'Không đồng bộ số dư ngân hàng thật.']}
      backTo="/admin/dashboard"
    />
  );
}

export function AdminUsersPage() {
  return (
    <FeatureShellPage
      icon={<TeamOutlined />}
      title="Người dùng"
      description="Không gian vận hành để tra cứu và hỗ trợ user khi backend API sẵn sàng."
      role="Admin"
      endpoint="GET /api/v1/admin/users"
      backTo="/admin/dashboard"
    />
  );
}

export function AdminAuditLogsPage() {
  return (
    <FeatureShellPage
      icon={<AuditOutlined />}
      title="Audit logs"
      description="Theo dõi hành động quan trọng như payment webhook, portfolio moderation và withdrawal processing."
      role="Admin"
      endpoint="GET /api/v1/admin/audit-logs"
      backTo="/admin/dashboard"
    />
  );
}
