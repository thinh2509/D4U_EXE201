import {
  AppstoreOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { D4ULogo } from '../../components/D4ULogo.jsx';

const FEATURES = [
  {
    icon: IdcardOutlined,
    title: 'Hồ sơ xác thực',
    copy: 'Student hoàn thiện hồ sơ và tài liệu trước khi tham gia dự án thật.',
  },
  {
    icon: AppstoreOutlined,
    title: 'Workspace theo dự án',
    copy: 'SME quản lý brief, proposal, offer và tiến độ trong cùng một nơi.',
  },
  {
    icon: CheckCircleOutlined,
    title: 'Review theo milestone',
    copy: 'Sketch, Revision và Final được theo dõi bằng trạng thái rõ ràng.',
  },
];

export function AuthBrandPanel() {
  return (
    <section className="auth-showcase" aria-label="D4U brand panel">
      <div className="auth-brand-stack">
        <div className="auth-logo-card">
          <Link className="auth-logo-link" to="/" aria-label="Về trang chủ D4U">
            <D4ULogo />
          </Link>
        </div>

        <div className="auth-brand-copy">
          <span className="auth-market-badge">
            <SafetyCertificateOutlined />
            Marketplace thiết kế cho Student và SME
          </span>
          <h1>Đăng nhập để tiếp tục workflow thiết kế của bạn</h1>
          <p>
            D4U giúp SME tạo dự án, chọn Student phù hợp, xác nhận escrow và theo dõi bài nộp qua từng milestone.
            Student có một nơi để ứng tuyển, nhận offer và quản lý ví D4U sau khi hoàn thành dự án.
          </p>
        </div>

        <div className="auth-feature-grid">
          {FEATURES.map(({ icon: Icon, title, copy }) => (
            <article className="auth-feature-card" key={title}>
              <span>
                <Icon />
              </span>
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
