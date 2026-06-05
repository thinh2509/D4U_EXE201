import {
  AppstoreOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { D4ULogo } from '../../components/D4ULogo.jsx';

const FEATURES = [
  {
    icon: IdcardOutlined,
    title: 'Student profile',
    copy: 'Hồ sơ năng lực và xác thực sinh viên rõ ràng.'
  },
  {
    icon: AppstoreOutlined,
    title: 'SME workspace',
    copy: 'Quản lý brief, offer và tiến độ trong một nơi.'
  },
  {
    icon: CheckCircleOutlined,
    title: 'Review flow',
    copy: 'Sketch, Final và phản hồi được theo dõi minh bạch.'
  }
];

const STATS = [
  ['3 roles', 'Student, SME, Admin'],
  ['Verified flow', 'Xác thực trước khi hợp tác']
];

export function AuthBrandPanel() {
  return (
    <section className="auth-showcase" aria-label="D4U brand panel">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="auth-brand-stack">
        <div className="auth-logo-card">
          <Link className="auth-logo-link" to="/" aria-label="Về trang chủ D4U">
            <D4ULogo />
          </Link>
        </div>

        <div className="auth-brand-copy">
          <span className="auth-market-badge">
            <SafetyCertificateOutlined />
            Design marketplace for students & SMEs
          </span>
          <h1>Kết nối sinh viên thiết kế với doanh nghiệp SME</h1>
          <p>
            D4U giúp doanh nghiệp tìm designer phù hợp, quản lý hồ sơ, xác thực tài khoản
            và vận hành quy trình tuyển chọn trong một nền tảng duy nhất.
          </p>
        </div>

        <div className="auth-feature-grid">
          {FEATURES.map(({ icon: Icon, title, copy }) => (
            <article className="auth-feature-card" key={title}>
              <span><Icon /></span>
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <div className="auth-stats-row">
          {STATS.map(([value, label]) => (
            <div key={value}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
          <div>
            <TeamOutlined />
            <span>Quy trình marketplace</span>
          </div>
        </div>
      </div>
    </section>
  );
}
