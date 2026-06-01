import {
  ArrowRightOutlined,
  BankOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  MailOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SolutionOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { D4ULogo } from '../../components/D4ULogo.jsx';
import { roleHome } from '../../components/RouteGuards.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const PROOF_ITEMS = [
  { icon: SafetyCertificateOutlined, title: 'Student xác thực', copy: 'Hồ sơ sinh viên được kiểm tra trước khi tham gia dự án.' },
  { icon: WalletOutlined, title: 'Escrow PayOS', copy: 'Doanh nghiệp thanh toán escrow trước khi dự án bắt đầu.' },
  { icon: FileDoneOutlined, title: 'Sketch & Final rõ ràng', copy: 'Hai mốc duyệt bài giúp phản hồi và bàn giao minh bạch.' },
];

const ROLE_ITEMS = [
  {
    icon: BankOutlined,
    eyebrow: 'Dành cho doanh nghiệp',
    title: 'Tìm đúng tài năng cho từng brief',
    copy: 'Đăng yêu cầu thiết kế, xem proposal, gửi offer và theo dõi tiến độ trong một workspace thống nhất.',
    action: 'Đăng dự án thiết kế',
    points: ['Tạo brief và deadline rõ ràng', 'Chọn proposal phù hợp', 'Thanh toán escrow qua PayOS', 'Duyệt Sketch và Final'],
  },
  {
    icon: SolutionOutlined,
    eyebrow: 'Dành cho sinh viên',
    title: 'Biến kỹ năng thành dự án thực tế',
    copy: 'Tìm cơ hội phù hợp, gửi giải pháp, làm việc theo milestone và nhận thu nhập qua ví D4U.',
    action: 'Tìm dự án phù hợp',
    points: ['Khám phá dự án đang mở', 'Ứng tuyển hoặc đề xuất giá', 'Nộp Sketch và Final', 'Nhận tiền sau khi hoàn thành'],
  },
];

const PROCESS_ITEMS = [
  ['01', 'SME đăng dự án', 'Brief, ngân sách và deadline được công bố rõ ràng.'],
  ['02', 'Student gửi proposal', 'Sinh viên xác nhận điều khoản hoặc đề xuất giải pháp khác.'],
  ['03', 'Hai bên xác nhận offer', 'SME chọn proposal và Student quyết định nhận dự án.'],
  ['04', 'SME thanh toán escrow', 'PayOS xác nhận giao dịch trước khi bắt đầu thực hiện.'],
  ['05', 'Student nộp Sketch & Final', 'Bài nộp và phản hồi được lưu theo từng milestone.'],
  ['06', 'Hoàn thành và nhận tiền', 'Escrow được release vào ví Student sau khi Final được duyệt.'],
];

const TRUST_ITEMS = [
  {
    icon: SafetyCertificateOutlined,
    title: 'Verification trước khi hợp tác',
    copy: 'Student hoàn thiện hồ sơ xác thực EDU hoặc tài liệu trước khi gửi ứng tuyển.',
  },
  {
    icon: WalletOutlined,
    title: 'Escrow tạo sự an tâm',
    copy: 'Project chỉ chuyển sang thực hiện sau khi backend xác nhận escrow đã được thanh toán.',
  },
  {
    icon: CheckCircleOutlined,
    title: 'Review theo milestone',
    copy: 'Sketch, revision và Final có trạng thái, deadline review và lịch sử phản hồi rõ ràng.',
  },
];

const NAV_ITEMS = [
  ['Hai vai trò', '#roles'],
  ['Quy trình', '#process'],
  ['Tin cậy', '#trust'],
];

const CONTACT_EMAIL = 'contact@d4u.vn';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const destination = user ? roleHome(user.role) : '/register';

  const goToDestination = () => navigate(destination);
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link className="landing-brand" to="/" aria-label="D4U trang chủ">
            <D4ULogo />
          </Link>
          <nav className="landing-nav" aria-label="Điều hướng homepage">
            {NAV_ITEMS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="landing-header-actions">
            {user ? (
              <Button type="primary" onClick={goToDestination}>Vào dashboard</Button>
            ) : (
              <>
                <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
                <Button type="primary" onClick={() => navigate('/register')}>Bắt đầu</Button>
              </>
            )}
          </div>
          <Button
            className="landing-mobile-menu"
            aria-label="Mở menu"
            icon={<MenuOutlined />}
            onClick={() => setMobileNavOpen(true)}
          />
        </div>
      </header>

      <Drawer
        className="landing-mobile-drawer"
        title={<D4ULogo />}
        placement="right"
        width={288}
        open={mobileNavOpen}
        onClose={closeMobileNav}
      >
        <nav className="landing-mobile-nav" aria-label="Điều hướng homepage mobile">
          {NAV_ITEMS.map(([label, href]) => <a key={href} href={href} onClick={closeMobileNav}>{label}</a>)}
          {user ? (
            <Button type="primary" block onClick={goToDestination}>Vào dashboard</Button>
          ) : (
            <>
              <Button block onClick={() => navigate('/login')}>Đăng nhập</Button>
              <Button type="primary" block onClick={() => navigate('/register')}>Bắt đầu</Button>
            </>
          )}
        </nav>
      </Drawer>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-inner">
            <p className="landing-eyebrow">Marketplace thiết kế cho thế hệ mới</p>
            <h1>D4U - Design For You</h1>
            <p className="landing-hero-copy">
              Nơi doanh nghiệp gặp sinh viên thiết kế tài năng, cùng làm việc qua offer,
              escrow PayOS và milestone rõ ràng.
            </p>
            <div className="landing-hero-actions">
              <Button type="primary" size="large" onClick={goToDestination}>
                Đăng dự án thiết kế <ArrowRightOutlined />
              </Button>
              <Button size="large" onClick={goToDestination}>
                Tìm dự án phù hợp <SearchOutlined />
              </Button>
            </div>
          </div>
        </section>

        <section className="landing-proof" aria-label="Điểm tin cậy D4U">
          <div className="landing-container landing-proof-grid">
            {PROOF_ITEMS.map(({ icon: Icon, title, copy }) => (
              <article className="landing-proof-item" key={title}>
                <Icon />
                <div>
                  <h2>{title}</h2>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="roles">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">Một nền tảng, hai phía cộng tác</p>
              <h2>Quy trình rõ cho cả doanh nghiệp và sinh viên</h2>
              <p>D4U giữ mọi bước quan trọng trong cùng một luồng, từ brief đầu tiên đến bàn giao cuối.</p>
            </div>
            <div className="landing-role-grid">
              {ROLE_ITEMS.map(({ icon: Icon, eyebrow, title, copy, action, points }) => (
                <article className="landing-role-card" key={eyebrow}>
                  <div className="landing-icon-tile"><Icon /></div>
                  <p className="landing-eyebrow">{eyebrow}</p>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <ul>
                    {points.map((point) => <li key={point}><CheckCircleOutlined /> {point}</li>)}
                  </ul>
                  <Button className="landing-role-action" onClick={goToDestination}>{action} <ArrowRightOutlined /></Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-soft" id="process">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">Quy trình tương tác thực tế</p>
              <h2>Từng bước đều có phản hồi từ hai phía</h2>
              <p>Không có khoảng trống mơ hồ giữa ứng tuyển, thanh toán và bàn giao thiết kế.</p>
            </div>
            <div className="landing-process-grid">
              {PROCESS_ITEMS.map(([step, title, copy]) => (
                <article className="landing-process-item" key={step}>
                  <span>{step}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="trust">
          <div className="landing-container landing-trust-layout">
            <div className="landing-section-heading landing-trust-heading">
              <p className="landing-eyebrow">Tin cậy ngay trong sản phẩm</p>
              <h2>Không chỉ kết nối, D4U còn giữ luồng làm việc minh bạch</h2>
              <p>Những điểm bảo vệ cốt lõi xuất hiện đúng lúc hai bên cần đưa ra quyết định.</p>
            </div>
            <div className="landing-trust-list">
              {TRUST_ITEMS.map(({ icon: Icon, title, copy }) => (
                <article className="landing-trust-item" key={title}>
                  <div className="landing-icon-tile landing-icon-tile-small"><Icon /></div>
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta-inner">
            <div>
              <p className="landing-eyebrow">Bắt đầu với D4U</p>
              <h2>Sẵn sàng cho dự án thiết kế tiếp theo?</h2>
              <p>Tạo tài khoản theo vai trò và đi thẳng vào workflow phù hợp với bạn.</p>
            </div>
            <Button type="primary" size="large" onClick={goToDestination}>
              {user ? 'Vào dashboard' : 'Tạo tài khoản'} <ArrowRightOutlined />
            </Button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <D4ULogo />
              <p>Nền tảng kết nối doanh nghiệp và sinh viên thiết kế qua quy trình rõ ràng, tin cậy.</p>
            </div>
            <div className="landing-footer-contact">
              <h2>Liên hệ</h2>
              <a href={`mailto:${CONTACT_EMAIL}`}><MailOutlined /> {CONTACT_EMAIL}</a>
              <p>Gửi email để được hỗ trợ về tài khoản, dự án và thanh toán escrow.</p>
            </div>
            <nav className="landing-footer-nav" aria-label="Điều hướng footer">
              <h2>Khám phá D4U</h2>
              {NAV_ITEMS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 D4U - Design For You.</span>
            <span>Marketplace thiết kế dành cho doanh nghiệp và sinh viên.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
