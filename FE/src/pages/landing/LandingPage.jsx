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
  { icon: SafetyCertificateOutlined, title: 'Student được xác thực', copy: 'Hồ sơ và tài liệu được kiểm tra trước khi Student tham gia dự án thật.' },
  { icon: WalletOutlined, title: 'Escrow trước khi bắt đầu', copy: 'Project chỉ vào execution sau khi backend xác nhận thanh toán PayOS thành công.' },
  { icon: FileDoneOutlined, title: 'Sketch và Final rõ ràng', copy: 'Mỗi mốc nộp bài có deadline, review và lịch sử phản hồi minh bạch.' },
];

const ROLE_ITEMS = [
  {
    icon: BankOutlined,
    eyebrow: 'Dành cho SME',
    title: 'Từ ý tưởng thô đến brief có thể triển khai',
    copy: 'Tạo dự án, nhận proposal, gửi offer và theo dõi Sketch/Final trong một workspace thống nhất.',
    action: 'Bắt đầu với vai trò SME',
    points: ['Brief, ngân sách và deadline rõ ràng', 'Chọn proposal phù hợp trước khi gửi offer', 'Thanh toán escrow qua PayOS', 'Duyệt Sketch, Revision và Final'],
  },
  {
    icon: SolutionOutlined,
    eyebrow: 'Dành cho Student',
    title: 'Tìm dự án thật để xây năng lực thiết kế',
    copy: 'Khám phá cơ hội phù hợp, ứng tuyển bằng proposal, làm việc theo milestone và nhận tiền qua ví D4U.',
    action: 'Bắt đầu với vai trò Student',
    points: ['Xem dự án đang mở theo category', 'Ứng tuyển hoặc phản hồi offer', 'Nộp Sketch và Final đúng quy trình', 'Nhận tiền sau khi Final được duyệt'],
  },
];

const PROCESS_ITEMS = [
  ['01', 'SME đăng dự án', 'Brief, ngân sách, category và deadline được nhập rõ ngay từ đầu.'],
  ['02', 'Student gửi proposal', 'Student nêu giải pháp, thời gian và mức giá trong phạm vi project.'],
  ['03', 'Hai bên xác nhận offer', 'SME chọn ứng viên, Student accept trước khi bước thanh toán mở ra.'],
  ['04', 'SME thanh toán escrow', 'PayOS và backend xác nhận giao dịch trước khi dự án bắt đầu.'],
  ['05', 'Student nộp Sketch và Final', 'Bản nộp, revision và review được lưu theo từng milestone.'],
  ['06', 'Duyệt Final và giải ngân', 'Escrow chỉ release vào ví Student khi Final được duyệt hoặc auto-approve đúng luật.'],
];

const TRUST_ITEMS = [
  {
    icon: SafetyCertificateOutlined,
    title: 'Verification trước khi hợp tác',
    copy: 'Student hoàn thiện hồ sơ xác thực bằng email EDU hoặc tài liệu để tăng độ tin cậy khi ứng tuyển.',
  },
  {
    icon: WalletOutlined,
    title: 'Escrow bảo vệ cả hai bên',
    copy: 'SME biết tiền được giữ đúng luồng; Student biết dự án đã được thanh toán trước khi bắt đầu làm.',
  },
  {
    icon: CheckCircleOutlined,
    title: 'Review theo milestone',
    copy: 'Sketch, Revision và Final có trạng thái, deadline review và thông báo để hai bên không mất dấu tiến trình.',
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
          <Button className="landing-mobile-menu" aria-label="Mở menu" icon={<MenuOutlined />} onClick={() => setMobileNavOpen(true)} />
        </div>
      </header>

      <Drawer className="landing-mobile-drawer" title={<D4ULogo />} placement="right" width={288} open={mobileNavOpen} onClose={closeMobileNav}>
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
            <div className="landing-hero-copy-block">
              <p className="landing-eyebrow">D4U Outcome 1 marketplace</p>
              <h1>Kết nối SME với Student Designer qua escrow và milestone rõ ràng</h1>
              <p className="landing-hero-copy">
                SME đăng brief, Student ứng tuyển, hai bên xác nhận offer và làm việc trong workspace có Sketch, Final, review và ví D4U.
              </p>
              <div className="landing-hero-actions">
                <Button type="primary" size="large" onClick={goToDestination}>
                  Tạo tài khoản <ArrowRightOutlined />
                </Button>
                <Button size="large" href="#process">
                  Xem cách hoạt động <SearchOutlined />
                </Button>
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="Hình minh họa D4U">
              <div className="landing-hero-image-frame">
                <img src="/brand/hero-laptops.png" alt="Hai màn hình laptop minh họa workflow D4U" />
              </div>
              <div className="landing-hero-float landing-hero-float-top">
                <span>Escrow xác nhận</span>
                <strong>Thanh toán chỉ ghi nhận khi backend xác minh thành công</strong>
              </div>
              <div className="landing-hero-float landing-hero-float-bottom">
                <span>Workflow rõ ràng</span>
                <strong>Brief, offer, Sketch, Final và ví D4U đi trong cùng một luồng dễ theo dõi</strong>
              </div>
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
              <h2>SME cần kết quả rõ. Student cần dự án thật.</h2>
              <p>D4U giữ hai nhu cầu đó trong cùng một luồng sản phẩm: đăng dự án, ứng tuyển, offer, escrow, nộp bài và review.</p>
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
              <h2>Từng bước đều có trạng thái, deadline và người chịu trách nhiệm</h2>
              <p>Không có khoảng trống mơ hồ giữa ứng tuyển, thanh toán, nộp bài và giải ngân.</p>
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
              <h2>D4U làm rõ các quyết định quan trọng trước khi dự án đi tiếp</h2>
              <p>Verification, escrow và review milestone xuất hiện đúng lúc hai bên cần xác nhận trách nhiệm.</p>
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
