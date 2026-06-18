import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CirclePlay,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HandCoins,
  Handshake,
  Mail,
  Menu,
  Rocket,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { D4ULogo } from '../../components/D4ULogo.jsx';
import { roleHome } from '../../components/RouteGuards.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const NAV_ITEMS = [
  { label: 'Hai vai trò', href: '#roles' },
  { label: 'Quy trình', href: '#process' },
  { label: 'Bảo chứng', href: '#assurance' },
];

const HERO_CHIPS = [
  {
    icon: ShieldCheck,
    title: 'Student đã được xác thực',
    description: 'Xác thực trước khi hợp tác',
  },
  {
    icon: WalletCards,
    title: 'Escrow qua PayOS',
    description: 'Thanh toán bảo đảm minh bạch',
  },
  {
    icon: FileCheck2,
    title: 'Review theo từng mốc',
    description: 'Sketch và Final rõ ràng',
  },
];

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Student đã được xác thực',
    description: 'Hồ sơ và tài liệu được kiểm tra trước khi tham gia dự án thật.',
  },
  {
    icon: WalletCards,
    title: 'Escrow chỉ mở khi thanh toán được xác nhận',
    description: 'Dự án chỉ bắt đầu khi thanh toán qua PayOS đã được hệ thống xác nhận thành công.',
  },
  {
    icon: ClipboardCheck,
    title: 'Milestone rõ trách nhiệm',
    description: 'Sketch, Final, revision và review đều có deadline và trạng thái minh bạch.',
  },
];

const ROLE_SECTIONS = [
  {
    label: 'Dành cho SME',
    icon: BriefcaseBusiness,
    title: 'Biến brief mơ hồ thành dự án có thể chốt và theo dõi.',
    description:
      'D4U giúp SME đi từ đăng dự án, nhận proposal, gửi offer đến duyệt Sketch và Final trong một luồng sản phẩm liền mạch.',
    points: [
      'Đăng brief với ngân sách, category và deadline rõ ràng',
      'Theo dõi tiến độ và chất lượng theo từng milestone',
      'Duyệt Final và giải ngân an toàn qua escrow',
    ],
    tone: 'blue',
  },
  {
    label: 'Dành cho Student',
    icon: GraduationCap,
    title: 'Nhận dự án thật để xây năng lực thiết kế, portfolio và thu nhập.',
    description:
      'Student có thể tìm dự án đang mở, dùng proposal rõ ràng, làm việc theo milestone minh bạch và nhận tiền qua ví D4U khi Final được duyệt.',
    points: [
      'Tìm cơ hội theo category và kỹ năng phù hợp',
      'Làm việc theo milestone minh bạch, có deadline',
      'Nhận thanh toán nhanh chóng, minh bạch',
    ],
    tone: 'green',
  },
];

const PROCESS_STEPS = [
  {
    step: 'Bước 01',
    icon: ClipboardCheck,
    title: 'SME đăng dự án',
    description: 'Brief, ngân sách, category và deadline được chốt ngay từ đầu để Student hiểu đúng bài toán.',
  },
  {
    step: 'Bước 02',
    icon: ArrowRight,
    title: 'Student gửi proposal',
    description: 'Student trình bày giải pháp, phạm vi thực hiện và mức giá đề xuất theo dự án.',
  },
  {
    step: 'Bước 03',
    icon: Handshake,
    title: 'Hai bên xác nhận offer',
    description: 'SME chọn ứng viên phù hợp, Student chấp nhận offer trước khi mở bước thanh toán.',
  },
  {
    step: 'Bước 04',
    icon: ShieldCheck,
    title: 'Escrow được xác nhận',
    description: 'PayOS và hệ thống cùng xác nhận giao dịch trước khi dự án bước vào execution.',
  },
  {
    step: 'Bước 05',
    icon: FileCheck2,
    title: 'Làm việc theo milestone',
    description: 'Sketch, revision và Final được nộp, phản hồi và duyệt theo đúng timeline của từng mốc.',
  },
  {
    step: 'Bước 06',
    icon: WalletCards,
    title: 'Duyệt Final và giải ngân',
    description: 'Tiền chỉ được release khi Final được duyệt hoặc hệ thống auto-approve theo đúng luật.',
  },
];

const ASSURANCE_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Verification trước khi cộng tác',
    description:
      'SME nhìn thấy marketplace có lọc chất lượng đầu vào; Student đã xác thực đáng tin cậy hơn khi ứng tuyển.',
  },
  {
    icon: WalletCards,
    title: 'Escrow bảo vệ cả hai phía',
    description:
      'SME không phải trả tiền mù, còn Student biết dự án chỉ bắt đầu khi tiền đã được ghi nhận đúng luồng.',
  },
  {
    icon: FileCheck2,
    title: 'Review milestone không bị mơ hồ',
    description:
      'Mỗi bản Sketch hoặc Final đều có thời điểm nộp, deadline review và trạng thái rõ ràng để tránh mất dấu tiến độ.',
  },
  {
    icon: HandCoins,
    title: 'Ví nội bộ và giải ngân minh bạch',
    description:
      'Khi đủ điều kiện, tiền đi vào ví D4U của Student và tiếp tục sang luồng rút tiền nội bộ theo sản phẩm.',
  },
];

const FOOTER_LINKS = [
  { label: 'Hai vai trò', href: '#roles' },
  { label: 'Quy trình', href: '#process' },
  { label: 'Bảo chứng', href: '#assurance' },
];

const shellClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8';
const buttonBaseClass =
  'inline-flex min-h-[42px] items-center justify-center gap-2 rounded-btn px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:shadow-focus';
const primaryButtonClass =
  `${buttonBaseClass} bg-d4u-cyan text-white shadow-[0_10px_24px_rgba(18,174,234,0.16)] hover:-translate-y-0.5 hover:bg-d4u-cyan-hover`;
const secondaryButtonClass =
  `${buttonBaseClass} border border-sky-200 bg-white text-d4u-cyan shadow-[0_8px_20px_rgba(7,93,120,0.05)] hover:-translate-y-0.5 hover:bg-sky-50`;

function SectionPill({ children }) {
  return (
    <span className="inline-flex rounded-chip bg-sky-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-d4u-cyan">
      {children}
    </span>
  );
}

function SectionHeading({ pill, title, description, align = 'center' }) {
  const wrapperClass = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex flex-col gap-3 ${wrapperClass}`}>
      <SectionPill>{pill}</SectionPill>
      <h2 className="max-w-3xl font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-d4u-nav-dark sm:text-[2.45rem]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-d4u-text-2 sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-white px-4 pb-4 pt-5 shadow-[0_16px_42px_rgba(7,93,120,0.08)] sm:px-5 sm:pb-5 sm:pt-6">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-sky-50/60" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sky-50/55 to-transparent" />
      <div className="absolute left-8 top-14 hidden h-28 w-28 rounded-full bg-sky-100/50 blur-3xl lg:block" />
      <div className="absolute bottom-12 right-10 hidden h-24 w-24 rounded-full bg-cyan-100/45 blur-3xl lg:block" />
      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="grid grid-cols-3 gap-2 opacity-50">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-sky-200" />
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="relative rounded-[26px] border border-sky-100 bg-white px-5 pb-5 pt-7 shadow-[0_10px_26px_rgba(7,93,120,0.06)] sm:px-6 sm:pb-6">
          <span className="absolute left-8 top-6 rotate-[-12deg] text-[13px] font-semibold italic text-d4u-nav-dark/90">
            Designer dashboard
          </span>
          <span className="absolute right-9 top-8 rotate-[10deg] text-[13px] font-semibold italic text-d4u-nav-dark/90">
            SME dashboard
          </span>
          <div className="absolute left-1/2 top-[49%] hidden h-8 w-24 -translate-x-1/2 rounded-full border-2 border-dashed border-sky-300/90 lg:block" />
          <div className="absolute left-1/2 top-[49%] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-d4u-cyan ring-8 ring-sky-100 lg:block" />
          <div className="absolute left-[24%] top-[32%] hidden h-10 w-10 rounded-full border border-sky-100 bg-white/90 shadow-soft lg:block" />
          <div className="absolute right-[20%] top-[58%] hidden h-11 w-11 rounded-full border border-sky-100 bg-white/90 shadow-soft lg:block" />
          <img
            src="/brand/hero-laptops.png"
            alt="Minh họa dashboard cho Designer và SME"
            className="mx-auto w-full max-w-[600px] object-contain"
          />
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-[18px] border border-sky-100 bg-white px-4 py-2.5 shadow-[0_8px_20px_rgba(7,93,120,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="h-8 w-8 rounded-full border-2 border-white bg-sky-100" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-cyan-100" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-emerald-100" />
                <span className="h-8 w-8 rounded-full border-2 border-white bg-d4u-soft" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-d4u-text-1">4.9/5 từ 500+ dự án</p>
                <p className="text-xs text-d4u-text-2">Được dùng cho brief thật và workflow thật</p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-sky-100 bg-white px-4 py-2.5 shadow-[0_8px_20px_rgba(7,93,120,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-d4u-text-2">Thanh toán bảo đảm bởi</p>
              <span className="text-[1.45rem] font-semibold tracking-tight text-d4u-cyan">PayOS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ label, icon: Icon, title, description, points, tone }) {
  const toneClass =
    tone === 'green'
      ? {
          border: 'border-emerald-200',
          pill: 'bg-emerald-100 text-emerald-700',
          icon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          check: 'text-emerald-500',
        }
      : {
          border: 'border-sky-200',
          pill: 'bg-sky-100 text-sky-700',
          icon: 'bg-sky-50 text-d4u-cyan border-sky-200',
          check: 'text-d4u-cyan',
        };

  return (
    <article
      className={`rounded-[30px] border bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_42px_rgba(7,93,120,0.12)] ${toneClass.border}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${toneClass.icon}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="pt-2">
          <span className={`inline-flex rounded-chip px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${toneClass.pill}`}>
            {label}
          </span>
        </div>
      </div>

      <h3 className="mt-5 max-w-xl font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-d4u-nav-dark">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-7 text-d4u-text-2">{description}</p>

      <div className="mt-6 space-y-3">
        {points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3 rounded-[16px] border border-d4u-border bg-white px-4 py-3 shadow-[0_6px_18px_rgba(7,93,120,0.05)] transition-all duration-200 hover:border-sky-200 hover:bg-sky-50/40"
          >
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${toneClass.check}`} />
            <span className="text-sm leading-6 text-d4u-text-1">{point}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ProcessCard({ step, icon: Icon, title, description, showConnector }) {
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-d4u-border bg-white p-5 text-center shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_18px_38px_rgba(7,93,120,0.12)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-200 via-d4u-cyan to-sky-200 opacity-75" />
      {showConnector ? (
        <div className="absolute right-[-18px] top-1/2 hidden -translate-y-1/2 xl:flex">
          <ChevronRight className="h-5 w-5 text-d4u-cyan/50" />
        </div>
      ) : null}

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-d4u-cyan">{step}</p>
      <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-d4u-soft text-d4u-cyan transition-colors duration-300 group-hover:bg-sky-100">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 min-h-[56px] text-lg font-semibold tracking-tight text-d4u-nav-dark">{title}</h3>
      <p className="mx-auto mt-3 max-w-[220px] text-sm leading-7 text-d4u-text-2">{description}</p>
    </article>
  );
}

function AssuranceMiniCard({ title, description }) {
  return (
    <article className="rounded-[24px] border border-d4u-border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_16px_34px_rgba(7,93,120,0.1)]">
      <div className="flex items-center gap-2 text-d4u-cyan">
        <BadgeCheck className="h-4 w-4" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{title}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-d4u-text-2">{description}</p>
    </article>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const destination = user ? roleHome(user.role) : '/register';
  const primaryCtaLabel = user ? 'Vào dashboard' : 'Tạo tài khoản ngay';

  const goToDestination = () => navigate(destination);
  const goToLogin = () => navigate('/login');
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-d4u-bg text-d4u-text-1">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f2f9ff_36%,#f7fbfe_100%)]">
        <div className="absolute left-[-120px] top-[180px] h-[300px] w-[300px] rounded-full bg-sky-100/55 blur-3xl" />
        <div className="absolute right-[-80px] top-[120px] h-[220px] w-[220px] rounded-full bg-d4u-soft/75 blur-3xl" />

        <header className="relative border-b border-d4u-border/70 bg-white/80 backdrop-blur-xl">
          <div className={`${shellClass} flex min-h-[74px] items-center justify-between gap-4`}>
            <Link to="/" aria-label="D4U trang chủ" className="shrink-0">
              <D4ULogo className="w-[182px]" />
            </Link>

            <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng trang chủ">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-d4u-cyan transition-colors hover:text-d4u-teal-deep"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2.5 lg:flex">
              {user ? (
                <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`${buttonBaseClass} border border-d4u-border bg-white text-d4u-nav-dark shadow-soft hover:bg-d4u-soft`}
                    onClick={goToLogin}
                  >
                    Đăng nhập
                  </button>
                  <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                    Bắt đầu
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-btn border border-d4u-border bg-white text-d4u-teal-deep shadow-soft hover:bg-d4u-soft lg:hidden"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileNavOpen ? (
            <div className="border-t border-d4u-border bg-white lg:hidden">
              <div className={`${shellClass} flex flex-col gap-4 py-4`}>
                <nav className="flex flex-col gap-2" aria-label="Điều hướng mobile">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileNav}
                      className="rounded-card px-3 py-3 text-sm font-semibold text-d4u-text-2 transition-colors hover:bg-d4u-soft hover:text-d4u-teal-deep"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>

                <div className="flex flex-col gap-3">
                  {user ? (
                    <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                      {primaryCtaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${buttonBaseClass} border border-d4u-border bg-white text-d4u-nav-dark shadow-soft hover:bg-d4u-soft`}
                        onClick={goToLogin}
                      >
                        Đăng nhập
                      </button>
                      <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                        Bắt đầu
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <main className="relative">
          <section className="pt-6 sm:pt-9 lg:pt-10">
            <div className={`${shellClass} grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(500px,0.93fr)] lg:gap-10`}>
              <div className="pt-2">
                <SectionPill>Marketplace thiết kế cho SME và sinh viên</SectionPill>

                <h1 className="mt-5 max-w-[560px] font-display text-[2.85rem] font-semibold leading-[1.1] tracking-tight text-d4u-nav-dark sm:text-[3.55rem]">
                  Thuê Student Designer minh bạch, an toàn và hiệu quả cho <span className="text-d4u-cyan">SME</span>
                </h1>

                <p className="mt-5 max-w-[560px] text-[1rem] leading-[1.85] text-slate-600">
                  D4U kết nối brief thật, quy trình rõ ràng và thanh toán escrow qua PayOS. Đảm bảo dự án được thực hiện đúng cam kết, đúng chất lượng và đúng tiến độ.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                    Tạo tài khoản
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <a href="#process" className={secondaryButtonClass}>
                    Xem cách hoạt động
                    <CirclePlay className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                  {HERO_CHIPS.map(({ icon: Icon, title, description }) => (
                    <article
                      key={title}
                      className="rounded-[16px] border border-sky-100 bg-white px-3.5 py-3 shadow-[0_8px_18px_rgba(7,93,120,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_14px_28px_rgba(7,93,120,0.1)]"
                    >
                      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[12px] bg-d4u-soft text-d4u-cyan">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h2 className="text-sm font-semibold leading-5 text-d4u-nav-dark">{title}</h2>
                      <p className="mt-1 text-[13px] leading-5 text-d4u-text-2">{description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <HeroVisual />
            </div>
          </section>

          <section className="pt-8 sm:pt-10">
            <div className={`${shellClass} grid gap-4 lg:grid-cols-3`}>
              {TRUST_CARDS.map(({ icon: Icon, title, description }) => (
                <article
                  className="rounded-[28px] border border-d4u-border bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(7,93,120,0.12)]"
                  key={title}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-d4u-soft text-d4u-cyan">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-[1.45rem] font-semibold leading-tight tracking-tight text-d4u-nav-dark">{title}</h2>
                      <p className="mt-3 text-sm leading-7 text-d4u-text-2">{description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="pt-12 sm:pt-16" id="roles">
            <div className={`${shellClass} flex flex-col gap-10`}>
              <SectionHeading
                pill="Hai phía, một mục tiêu"
                title="SME cần kết quả rõ ràng. Student cần dự án thật để trưởng thành."
              />

              <div className="mx-auto grid w-full max-w-[980px] gap-6 lg:grid-cols-2">
                {ROLE_SECTIONS.map((section) => (
                  <RoleCard key={section.label} {...section} />
                ))}
              </div>
            </div>
          </section>

          <section className="pt-14 sm:pt-18" id="process">
            <div className={`${shellClass} flex flex-col gap-10`}>
              <SectionHeading
                pill="Quy trình thật sự diễn ra thế nào?"
                title="Mỗi bước đều có trạng thái, điều kiện tiếp theo và người chịu trách nhiệm."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {PROCESS_STEPS.map((item, index) => (
                  <ProcessCard key={item.step} {...item} showConnector={index < PROCESS_STEPS.length - 1} />
                ))}
              </div>
            </div>
          </section>

          <section className="pt-14 sm:pt-18" id="assurance">
            <div className={`${shellClass} grid gap-8 lg:grid-cols-[0.92fr_1.08fr]`}>
              <div className="space-y-6">
                <SectionHeading
                  pill="Bảo chứng ngay trong sản phẩm"
                  align="left"
                  title="D4U làm rõ những quy tắc rủi ro trước khi dự án đi tiếp."
                  description='Đây là khác biệt quan trọng giữa một landing page "cho có" và một homepage có sức thuyết phục: nó phải cho thấy guardrails vận hành, không chỉ là danh sách tính năng.'
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <AssuranceMiniCard
                    title="Verification"
                    description="SME nhìn thấy tín hiệu tin cậy trước khi chọn người làm."
                  />
                  <AssuranceMiniCard
                    title="Escrow"
                    description="Student không phải bắt đầu dự án khi tiền chưa được xác nhận."
                  />
                </div>
              </div>

              <div className="space-y-4">
                {ASSURANCE_POINTS.map(({ icon: Icon, title, description }, index) => (
                  <article
                    className={[
                      'rounded-[24px] border bg-white px-5 py-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_36px_rgba(7,93,120,0.1)]',
                      index % 2 === 0 ? 'border-sky-100 lg:translate-x-0' : 'border-d4u-border lg:translate-x-4',
                    ].join(' ')}
                    key={title}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-d4u-soft text-d4u-cyan">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-d4u-nav-dark">{title}</h3>
                        <p className="mt-1.5 text-sm leading-7 text-d4u-text-2">{description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-16 pt-10 sm:pb-20">
            <div className={shellClass}>
              <div className="overflow-hidden rounded-[32px] border border-sky-100 bg-white shadow-[0_18px_42px_rgba(7,93,120,0.08)]">
                <div className="grid gap-6 bg-gradient-to-r from-white via-white to-sky-50/65 px-7 py-7 sm:px-8 sm:py-8 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative flex h-36 items-center justify-center rounded-[24px] bg-gradient-to-br from-white via-sky-50 to-d4u-soft">
                    <div className="absolute h-20 w-20 rounded-full bg-sky-100 blur-2xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-d4u-cyan text-white shadow-card">
                      <Rocket className="h-10 w-10" />
                    </div>
                  </div>

                  <div>
                    <h2 className="max-w-2xl font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-d4u-nav-dark">
                      Sẵn sàng bắt đầu dự án thiết kế rõ ràng hơn?
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-d4u-text-2">
                      Dù bạn là SME đang cần một designer đáng tin cậy hay là Student đang muốn nhận dự án thật, D4U đưa bạn vào đúng luồng sản phẩm phù hợp ngay từ bước đầu tiên.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 lg:items-end">
                    <button type="button" className={primaryButtonClass} onClick={goToDestination}>
                      {primaryCtaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <div className="flex flex-wrap gap-4 text-sm text-d4u-text-2">
                      <span className="inline-flex items-center gap-2">
                        <Check className="h-4 w-4 text-d4u-cyan" />
                        Miễn phí đăng ký
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Check className="h-4 w-4 text-d4u-cyan" />
                        Bắt đầu trong 2 phút
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-d4u-border bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(245,251,255,0.95)_100%)]">
          <div className={`${shellClass} py-10`}>
            <div className="grid gap-10 lg:grid-cols-[1.25fr_0.95fr_0.8fr]">
              <div>
                <div className="inline-flex rounded-[22px] border border-white/80 bg-white/90 px-5 py-4 shadow-soft">
                  <D4ULogo className="w-[165px]" />
                </div>
                <p className="mt-4 max-w-md text-sm leading-7 text-d4u-text-2">
                  Nền tảng kết nối SME với Student Designer qua verification, escrow và workflow milestone rõ ràng để cả hai phía ra quyết định chắc chắn hơn.
                </p>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-d4u-text-3">Liên hệ</h2>
                <a
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-d4u-cyan transition-colors hover:text-d4u-cyan-hover"
                  href="mailto:contact@d4u.vn"
                >
                  <Mail className="h-4 w-4" />
                  contact@d4u.vn
                </a>
                <p className="mt-4 max-w-sm text-sm leading-7 text-d4u-text-2">
                  Gửi email để được hỗ trợ về tài khoản, dự án, thanh toán escrow và các bước vận hành trong hệ thống.
                </p>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-d4u-text-3">Khám phá D4U</h2>
                <nav className="mt-4 flex flex-col gap-3" aria-label="Điều hướng footer">
                  {FOOTER_LINKS.map((item) => (
                    <a
                      className="inline-flex items-center gap-2 text-sm font-semibold text-d4u-cyan transition-colors hover:text-d4u-teal-deep"
                      href={item.href}
                      key={item.href}
                    >
                      <ChevronRight className="h-4 w-4" />
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2 border-t border-d4u-border pt-6 text-sm text-d4u-text-3 sm:flex-row sm:items-center sm:justify-between">
              <span>© 2026 D4U - Design For You.</span>
              <span>Marketplace thiết kế dành cho doanh nghiệp và sinh viên với quy trình rõ ràng, đáng tin cậy.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
