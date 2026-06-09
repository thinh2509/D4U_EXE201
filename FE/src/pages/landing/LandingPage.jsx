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
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  FormOutlined,
  SendOutlined,
  TeamOutlined,
  CreditCardOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
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
  { icon: FormOutlined, title: 'SME đăng dự án', copy: 'Brief, ngân sách, category và deadline được nhập rõ ngay từ đầu.' },
  { icon: SendOutlined, title: 'Student gửi proposal', copy: 'Student nêu giải pháp, thời gian và mức giá trong phạm vi project.' },
  { icon: TeamOutlined, title: 'Hai bên xác nhận offer', copy: 'SME chọn ứng viên, Student accept trước khi bước thanh toán mở ra.' },
  { icon: CreditCardOutlined, title: 'SME thanh toán escrow', copy: 'PayOS và backend xác nhận giao dịch trước khi dự án bắt đầu.' },
  { icon: UploadOutlined, title: 'Student nộp Sketch và Final', copy: 'Bản nộp, revision và review được lưu theo từng milestone.' },
  { icon: SafetyCertificateOutlined, title: 'Duyệt Final và giải ngân', copy: 'Escrow chỉ release vào ví Student khi Final được duyệt hoặc auto-approve đúng luật.' },
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

function FadeInSection({ children }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
      ref={domRef}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const destination = user ? roleHome(user.role) : '/register';
  
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('d4u_intro_played');
  });

  const goToDestination = () => navigate(destination);
  const closeMobileNav = () => setMobileNavOpen(false);

  const handleIntroEnded = () => {
    setShowIntro(false);
    sessionStorage.setItem('d4u_intro_played', 'true');
  };

  if (showIntro) {
    return (
      <div className="landing-intro-screen" onClick={handleIntroEnded}>
        <video 
          className="landing-intro-video" 
          src="/gif/option 1.mp4" 
          autoPlay 
          muted 
          playsInline 
          onEnded={handleIntroEnded}
        />
        <button className="landing-intro-skip" onClick={handleIntroEnded}>Bỏ qua</button>
      </div>
    );
  }

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
                <Button size="large" href="#roles">
                  Xem hai vai trò <SearchOutlined />
                </Button>
              </div>
              <p className="landing-hero-note">
                D4U không tự chọn Student, không tự publish dự án và chỉ ghi nhận thanh toán khi backend hoặc provider xác nhận.
              </p>
            </div>

          </div>
        </section>

        <FadeInSection>
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
        </FadeInSection>

        <FadeInSection>
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
        </FadeInSection>

        <FadeInSection>
          <section className="landing-section landing-section-soft" id="process">
            <div className="landing-container">
              <div className="landing-section-heading">
                <p className="landing-eyebrow">Quy trình tương tác thực tế</p>
                <h2>Từng bước đều có trạng thái, deadline và người chịu trách nhiệm</h2>
                <p>Không có khoảng trống mơ hồ giữa ứng tuyển, thanh toán, nộp bài và giải ngân.</p>
              </div>
              <div className="landing-process-grid">
                {PROCESS_ITEMS.map(({ icon: Icon, title, copy }) => (
                  <article className="landing-process-item" key={title}>
                    <span><Icon /></span>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
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
        </FadeInSection>

        <FadeInSection>
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
        </FadeInSection>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <div className="footer-logo-wrap">
                <D4ULogo />
              </div>
              <p>Nền tảng kết nối doanh nghiệp và sinh viên thiết kế qua quy trình rõ ràng, tin cậy.</p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter"><TwitterOutlined /></a>
                <a href="https://www.facebook.com/share/1DyQ9rpGJS/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookOutlined /></a>
                <a href="#" aria-label="Instagram"><InstagramOutlined /></a>
                <a href="#" aria-label="LinkedIn"><LinkedinOutlined /></a>
              </div>
            </div>
            
            <div className="landing-footer-contact">
              <h2>Liên hệ</h2>
              <a href={`mailto:${CONTACT_EMAIL}`} className="footer-contact-link"><MailOutlined /> {CONTACT_EMAIL}</a>
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
