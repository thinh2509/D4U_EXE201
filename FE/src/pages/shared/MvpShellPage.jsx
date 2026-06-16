import {
  ApiOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  ExclamationCircleFilled,
  FileDoneOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Button, Card, Modal, Skeleton, Tag } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { DataPanel, PageShell } from '../../components/PageShell.jsx';
import { BackendGapState, ErrorState } from '../../components/StateViews.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { adminApi } from '../../services/adminApi.js';
import { profileApi } from '../../services/profileApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const approvedStatuses = new Set(['APPROVED', 'VERIFIED']);
const countFormatter = new Intl.NumberFormat('vi-VN');

const dashboardContent = {
  STUDENT: {
    label: 'Student workspace',
    title: 'Sẵn sàng nhận dự án thiết kế thật',
    description: 'Hoàn thiện xác thực, tìm dự án phù hợp, theo dõi offer và quản lý ví D4U sau khi hoàn thành Final.',
    primaryPath: '/student/projects',
    primaryLabel: 'Tìm dự án',
    insight: 'Ưu tiên hoàn thiện xác thực trước khi ứng tuyển để SME tin tưởng hơn.',
    cards: [
      {
        title: 'Xác thực',
        description: 'Hoàn thiện hồ sơ sinh viên để đủ điều kiện ứng tuyển.',
        path: '/student/verification',
        icon: <SafetyCertificateOutlined />,
        badge: 'Ưu tiên'
      },
      {
        title: 'Dự án đang mở',
        description: 'Tìm brief phù hợp và gửi proposal rõ ràng.',
        path: '/student/projects',
        icon: <FolderOpenOutlined />,
        badge: 'Cơ hội mới'
      },
      {
        title: 'Đề nghị',
        description: 'Phản hồi offer trước khi SME mở thanh toán escrow.',
        path: '/student/offers',
        icon: <FileDoneOutlined />,
        badge: 'Cần phản hồi'
      },
      {
        title: 'Ví D4U',
        description: 'Theo dõi ledger nội bộ và yêu cầu rút tiền thủ công.',
        path: '/student/wallet',
        icon: <WalletOutlined />,
        badge: 'Thanh toán'
      }
    ],
    getPrimaryAction: (data) => (
      data.profile
        ? { path: '/student/projects', label: 'Tìm dự án' }
        : { path: '/student/profile', label: 'Tạo hồ sơ sinh viên' }
    ),
    getMetrics: (data) => [
      {
        label: 'Hồ sơ sinh viên',
        value: data.profile ? 'Đã tạo' : 'Chưa tạo',
        helper: data.profile ? 'Có thể cập nhật thêm bất cứ lúc nào.' : 'Cần lưu hồ sơ trước khi xác thực và dùng ví.'
      },
      {
        label: 'Xác thực',
        value: approvedStatuses.has(data.profile?.verificationStatus) ? 'Đã xác thực' : 'Chưa hoàn tất',
        helper: approvedStatuses.has(data.profile?.verificationStatus)
          ? 'Bạn đã sẵn sàng ứng tuyển dự án thật.'
          : 'Hoàn tất xác thực để tăng độ tin cậy với SME.'
      },
      {
        label: 'Dự án đang mở',
        value: String(data.openProjects.length),
        helper: data.openProjects.length > 0 ? 'Nguồn brief hiện có để bạn chọn lọc.' : 'Danh sách mở sẽ hiện ở đây khi có brief phù hợp.'
      },
      {
        label: 'Offer chờ phản hồi',
        value: String(data.offers.filter((offer) => offer.status === 'WAITING_ACCEPTANCE').length),
        helper: data.offers.length > 0 ? 'Theo dõi các đề nghị hiện có của bạn.' : 'Khi SME gửi offer, bạn sẽ thấy ở đây.'
      }
    ],
    isEmptyState: (data) => !data.profile && data.offers.length === 0 && data.studentProjects.length === 0,
    emptyTitle: 'Bắt đầu hành trình Student với vài bước rõ ràng',
    emptyDescription: 'Tạo hồ sơ, xác thực và mở workspace cá nhân để bạn sẵn sàng ứng tuyển những dự án thiết kế đầu tiên.',
    emptyActions: [
      {
        title: 'Tạo hồ sơ sinh viên',
        description: 'Điền trường học, chuyên ngành và phần giới thiệu ngắn để D4U khởi tạo hồ sơ.',
        path: '/student/profile',
        icon: <IdcardOutlined />,
        badge: 'Bước 1'
      },
      {
        title: 'Gửi xác thực',
        description: 'Hoàn thiện email EDU hoặc tài liệu để tăng độ tin cậy khi ứng tuyển.',
        path: '/student/verification',
        icon: <CheckCircleOutlined />,
        badge: 'Bước 2'
      },
      {
        title: 'Tìm dự án phù hợp',
        description: 'Khám phá các brief đang mở và chuẩn bị proposal khi hồ sơ đã sẵn sàng.',
        path: '/student/projects',
        icon: <FolderOpenOutlined />,
        badge: 'Bước 3'
      }
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
      {
        title: 'Tạo dự án',
        description: 'Viết brief, dùng AI hỗ trợ và publish khi sẵn sàng.',
        path: '/sme/projects/new',
        icon: <FolderOpenOutlined />,
        badge: 'Bắt đầu'
      },
      {
        title: 'Ứng tuyển',
        description: 'So sánh proposal trước khi chọn Student phù hợp.',
        path: '/sme/applications',
        icon: <TeamOutlined />,
        badge: 'Tuyển chọn'
      },
      {
        title: 'Đề nghị & escrow',
        description: 'Theo dõi offer đã accept và mở thanh toán PayOS.',
        path: '/sme/offers',
        icon: <CreditCardOutlined />,
        badge: 'Cần chú ý'
      },
      {
        title: 'AI Brief',
        description: 'Nhận gợi ý brief tiếng Việt có thể chỉnh sửa.',
        path: '/sme/projects/new',
        icon: <BulbOutlined />,
        badge: 'Hỗ trợ'
      }
    ],
    getPrimaryAction: (data) => (
      data.profile
        ? { path: '/sme/projects/new', label: 'Tạo dự án' }
        : { path: '/sme/profile', label: 'Tạo hồ sơ SME' }
    ),
    getMetrics: (data) => [
      {
        label: 'Hồ sơ doanh nghiệp',
        value: data.profile ? 'Đã tạo' : 'Chưa tạo',
        helper: data.profile ? 'Bạn có thể cập nhật thông tin doanh nghiệp bất cứ lúc nào.' : 'Hoàn thiện hồ sơ trước khi publish dự án.'
      },
      {
        label: 'Dự án của bạn',
        value: String(data.projects.length),
        helper: data.projects.length > 0 ? 'Bao gồm draft, đang mở và các dự án đã đi vào execution.' : 'Dự án đầu tiên sẽ xuất hiện ngay sau khi bạn lưu draft.'
      },
      {
        label: 'Ứng tuyển nhận được',
        value: String(data.applications.length),
        helper: data.applications.length > 0 ? 'Các proposal mới sẽ đi qua một luồng so sánh rõ ràng.' : 'Proposal của Student sẽ xuất hiện ở đây khi dự án bắt đầu nhận ứng tuyển.'
      },
      {
        label: 'Offer đang theo dõi',
        value: String(data.offers.length),
        helper: data.offers.length > 0 ? 'Quản lý xác nhận offer và bước thanh toán escrow tại một nơi.' : 'Khi bạn gửi offer, tiến trình sẽ hiện tại đây.'
      }
    ],
    isEmptyState: (data) => data.projects.length === 0 && data.applications.length === 0 && data.offers.length === 0,
    emptyTitle: 'Chuẩn bị workspace SME để dự án đầu tiên đi đúng luồng',
    emptyDescription: 'Hoàn thiện hồ sơ doanh nghiệp, viết brief rõ ràng và dùng AI như trợ lý hỗ trợ thay vì thay thế quyết định của bạn.',
    emptyActions: [
      {
        title: 'Hoàn thiện hồ sơ SME',
        description: 'Lưu thông tin doanh nghiệp để dashboard, project và workflow hiển thị đầy đủ hơn.',
        path: '/sme/profile',
        icon: <SafetyCertificateOutlined />,
        badge: 'Bước 1'
      },
      {
        title: 'Tạo dự án đầu tiên',
        description: 'Viết brief, ngân sách và deadline để lưu draft hoặc publish khi đã sẵn sàng.',
        path: '/sme/projects/new',
        icon: <FolderOpenOutlined />,
        badge: 'Bước 2'
      },
      {
        title: 'Theo dõi offer & escrow',
        description: 'Khi có Student phù hợp, bạn sẽ gửi offer và mở thanh toán PayOS trong cùng luồng.',
        path: '/sme/offers',
        icon: <CreditCardOutlined />,
        badge: 'Bước 3'
      }
    ]
  },
  ADMIN: {
    label: 'Admin console',
    title: 'Điều phối các bước vận hành quan trọng',
    description: 'Duyệt xác thực, xử lý rút tiền, moderation user/project và theo dõi các hàng đợi vận hành chính.',
    primaryPath: '/admin/verifications',
    primaryLabel: 'Duyệt xác thực',
    insight: 'Các thao tác tài chính và xác thực cần rõ trạng thái, người xử lý và thời điểm cập nhật.',
    cards: [
      {
        title: 'Duyệt xác thực',
        description: 'Xem và xử lý yêu cầu xác thực sinh viên.',
        path: '/admin/verifications',
        icon: <SafetyCertificateOutlined />,
        badge: 'Vận hành'
      },
      {
        title: 'Rút tiền',
        description: 'Cập nhật kết quả sau khi Finance chuyển khoản thủ công.',
        path: '/admin/withdrawals',
        icon: <WalletOutlined />,
        badge: 'Tài chính'
      },
      {
        title: 'Người dùng',
        description: 'Theo dõi tài khoản Student, SME và Admin.',
        path: '/admin/users',
        icon: <TeamOutlined />,
        badge: 'Quản trị'
      },
      {
        title: 'Dự án moderation',
        description: 'Xem case ADMIN_REVIEW và can thiệp tối thiểu khi flow bình thường bị kẹt.',
        path: '/admin/projects',
        icon: <FolderOpenOutlined />,
        badge: 'Moderation'
      },
      {
        title: 'Audit logs',
        description: 'Theo dõi các hành động quan trọng của hệ thống.',
        path: '/admin/audit-logs',
        icon: <FileDoneOutlined />,
        badge: 'Giám sát'
      }
    ]
  }
};

async function loadStudentDashboard() {
  const profile = await profileApi.getStudentProfile().catch((error) => {
    if (error?.response?.status === 404) return null;
    throw error;
  });

  const optionalStudentList = (request) => request.catch((error) => {
    const message = getApiErrorMessage(error, '');
    if (
      error?.response?.status === 404 ||
      /student profile must be created first/i.test(message) ||
      /student must be verified before/i.test(message)
    ) {
      return [];
    }
    throw error;
  });

  const [openProjects, offers, studentProjects] = await Promise.all([
    projectApi.listOpenProjects(),
    optionalStudentList(projectApi.listStudentOffers()),
    optionalStudentList(projectApi.listStudentProjects())
  ]);

  return { profile, openProjects, offers, studentProjects };
}

async function loadSmeDashboard() {
  const profile = await profileApi.getSmeProfile().catch((error) => {
    if (error?.response?.status === 404) return null;
    throw error;
  });

  const optionalSmeList = (request) => request.catch((error) => {
    const message = getApiErrorMessage(error, '');
    if (
      error?.response?.status === 404 ||
      /sme profile must be created before managing projects/i.test(message)
    ) {
      return [];
    }
    throw error;
  });

  const [projects, applications, offers] = await Promise.all([
    optionalSmeList(projectApi.listMyProjects()),
    optionalSmeList(projectApi.listMyApplications()),
    optionalSmeList(projectApi.listSmeOffers())
  ]);

  return { profile, projects, applications, offers };
}

async function loadAdminDashboard() {
  return await adminApi.getDashboardStats();
}

function DashboardSkeleton() {
  return (
    <PageShell size="wide" density="relaxed">
      <div className="rounded-panel border border-d4u-border/80 bg-white/92 p-6 shadow-soft">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-panel border border-d4u-border/80 bg-white/92 p-5 shadow-soft">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function OperationalDashboard({ content, data, onNavigate }) {
  const metrics = content.getMetrics(data);
  const primaryAction = content.getPrimaryAction(data);
  const isEmptyState = content.isEmptyState(data);

  return (
    <PageShell size="wide" density="relaxed">
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan"
        description="D4U dùng dữ liệu thật từ API để gợi ý bước tiếp theo. Khi tài khoản còn mới, dashboard sẽ ưu tiên các bước khởi tạo cần thiết."
        extra={<Button type="primary" onClick={() => onNavigate(primaryAction.path)}>{primaryAction.label}</Button>}
      />

      <DataPanel>
        <div className="dashboard-hero-copy">
          <Tag color="cyan">{content.label}</Tag>
          <h2>{isEmptyState ? content.emptyTitle : content.title}</h2>
          <p>{isEmptyState ? content.emptyDescription : content.description}</p>
          <div className="dashboard-insight">
            <span>{isEmptyState ? 'Ưu tiên khởi tạo' : 'Gợi ý workflow'}</span>
            <strong>{content.insight}</strong>
          </div>
        </div>
      </DataPanel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="grid gap-3 rounded-card border border-d4u-border/80 bg-white/92 p-5 shadow-soft">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-d4u-text-3">{metric.label}</span>
            <strong className="text-[26px] font-semibold leading-none text-d4u-text-1">{metric.value}</strong>
            <p className="text-sm leading-6 text-d4u-text-2">{metric.helper}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-1">
        <span>{isEmptyState ? 'Lộ trình gợi ý' : 'Workflow chính'}</span>
        <strong>{isEmptyState ? 'Đi tiếp theo từng bước, không cần đoán phải bắt đầu từ đâu' : 'Chọn bước cần xử lý tiếp theo'}</strong>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(isEmptyState ? content.emptyActions : content.cards).map((card) => (
          <button
            key={card.path}
            type="button"
            className="grid h-full gap-4 rounded-panel border border-d4u-border/80 bg-white/92 p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:shadow-card"
            onClick={() => onNavigate(card.path)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-card bg-d4u-soft text-[20px] text-d4u-cyan">{card.icon}</div>
              <Tag className="!m-0 rounded-full font-semibold">{card.badge}</Tag>
            </div>
            <div className="grid gap-2">
              <h2 className="text-lg font-semibold leading-tight text-d4u-text-1">{card.title}</h2>
              <p className="text-sm leading-6 text-d4u-text-2">{card.description}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-d4u-cyan">
              Mở <ArrowRightOutlined />
            </span>
          </button>
        ))}
      </div>
    </PageShell>
  );
}

function getAdminStatusTag(status) {
  const colorMap = {
    PENDING: 'gold',
    PROCESSING: 'blue',
    ACTIVE: 'green',
    APPROVED: 'green',
    SUCCESS: 'green',
    FAILED: 'red',
    REJECTED: 'red',
    CANCELLED: 'default',
    EXPIRED: 'default'
  };

  return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
}

function AdminRecentList({ title, description, actionLabel, actionPath, items, renderItem, onNavigate }) {
  return (
    <DataPanel
      title={title}
      description={description}
      extra={(
        <Button onClick={() => onNavigate(actionPath)}>
          {actionLabel}
        </Button>
      )}
    >
      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-card border border-d4u-border/80 bg-d4u-soft/45 p-4">
              {renderItem(item)}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-d4u-border bg-d4u-soft/35 p-6 text-sm text-d4u-text-2">
          Chưa có dữ liệu gần đây.
        </div>
      )}
    </DataPanel>
  );
}

function formatCount(value) {
  return countFormatter.format(value ?? 0);
}

function AdminSummaryCard({ metric, onNavigate }) {
  const isAccent = metric.tone === 'accent';
  const accentClass = isAccent
    ? 'border-d4u-cyan/35 bg-gradient-to-br from-d4u-soft-2 via-white to-d4u-soft shadow-card'
    : 'border-d4u-border/80 bg-white/95 shadow-soft';
  const valueClass = isAccent ? 'text-d4u-teal-deep' : 'text-d4u-text-1';
  const iconClass = isAccent
    ? 'bg-white text-d4u-cyan ring-1 ring-d4u-cyan/15'
    : 'bg-d4u-soft text-d4u-teal-deep';

  return (
    <button
      type="button"
      className={`grid h-full gap-4 rounded-panel border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:shadow-card ${accentClass}`}
      onClick={() => onNavigate(metric.path)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-card text-[20px] ${iconClass}`}>
          {metric.icon}
        </div>
        {metric.badge ? (
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${isAccent ? 'bg-white text-d4u-teal-deep ring-1 ring-d4u-cyan/15' : 'bg-d4u-soft text-d4u-text-2'}`}>
            {metric.badge}
          </span>
        ) : null}
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-semibold text-d4u-text-2">{metric.label}</span>
        <strong className={`text-[30px] font-bold leading-none tracking-tight ${valueClass}`}>{metric.value}</strong>
        <p className="text-sm leading-6 text-d4u-text-2">{metric.helper}</p>
      </div>
    </button>
  );
}

function AdminQueueCard({ card, onNavigate }) {
  const isActive = card.value > 0;
  const isWarning = card.tone === 'warning';
  const activeClass = isWarning
    ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50'
    : 'border-d4u-cyan/30 bg-gradient-to-br from-d4u-soft-2 via-white to-d4u-soft';
  const neutralClass = 'border-d4u-border/75 bg-white/88';
  const iconClass = isActive
    ? isWarning
      ? 'bg-amber-100 text-amber-700'
      : 'bg-d4u-soft text-d4u-cyan'
    : 'bg-slate-100 text-slate-500';
  const valueClass = isActive
    ? isWarning
      ? 'text-amber-700'
      : 'text-d4u-teal-deep'
    : 'text-d4u-text-2';

  return (
    <button
      type="button"
      className={`grid h-full gap-3 rounded-card border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft ${isActive ? activeClass : neutralClass}`}
      onClick={() => onNavigate(card.path)}
    >
      <div className="flex items-start gap-3">
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px] ${iconClass}`}>
          {card.icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-d4u-text-1">{card.label}</p>
          <p className="mt-1 text-xs leading-5 text-d4u-text-3">{card.helper}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-black/5 pt-3">
        <strong className={`text-[30px] font-bold leading-none tracking-tight ${valueClass}`}>{formatCount(card.value)}</strong>
        <span className={`text-xs font-semibold ${isActive ? 'text-d4u-teal-deep' : 'text-d4u-text-3'}`}>
          {isActive ? 'Cần xử lý' : 'Ổn định'}
        </span>
      </div>
    </button>
  );
}

function AdminSnapshotMetric({ label, value, helper, tone = 'neutral' }) {
  const toneClass = {
    warning: 'border-amber-200 bg-amber-50',
    success: 'border-emerald-200 bg-emerald-50',
    info: 'border-d4u-cyan/25 bg-d4u-soft/70',
    neutral: 'border-d4u-border/75 bg-white/90'
  };
  const valueClass = {
    warning: 'text-amber-700',
    success: 'text-emerald-700',
    info: 'text-d4u-teal-deep',
    neutral: 'text-d4u-text-1'
  };

  return (
    <div className={`rounded-card border p-4 ${toneClass[tone] || toneClass.neutral}`}>
      <span className="text-xs font-semibold text-d4u-text-2">{label}</span>
      <strong className={`mt-2 block text-[28px] font-bold leading-none tracking-tight ${valueClass[tone] || valueClass.neutral}`}>
        {formatCount(value)}
      </strong>
      <p className="mt-2 text-sm leading-6 text-d4u-text-3">{helper}</p>
    </div>
  );
}

// Legacy admin dashboard kept temporarily to avoid risky large-block replacement while the new layout settles.
// eslint-disable-next-line no-unused-vars
function LegacyAdminDashboard({ content, data, onNavigate }) {
  const summaryMetrics = [
    {
      label: 'Tổng người dùng',
      value: data.summary.totalUsers,
      helper: `${data.summary.totalStudents} Student • ${data.summary.totalSmes} SME`
    },
    {
      label: 'Tổng dự án',
      value: data.summary.totalProjects,
      helper: `${data.summary.openProjects} đang mở • ${data.summary.completedProjects} đã hoàn thành`
    },
    {
      label: 'Việc cần xử lý',
      value: data.actions.needsAttentionCount,
      helper: 'Tổng các hàng đợi đang chờ admin xử lý'
    },
    {
      label: 'Gói trả phí',
      value: data.packages.totalPurchases,
      helper: `${data.packages.pendingPurchases} chờ • ${data.packages.activePurchases} đang hoạt động`
    }
  ];

  const queueCards = [
    {
      label: 'Xác thực chờ duyệt',
      value: data.queues.pendingVerifications,
      helper: 'Đi tới màn duyệt xác thực sinh viên',
      path: '/admin/verifications'
    },
    {
      label: 'Rút tiền chờ xử lý',
      value: data.queues.pendingWithdrawals,
      helper: 'Các yêu cầu mới cần admin nhận xử lý',
      path: '/admin/withdrawals'
    },
    {
      label: 'Rút tiền đang xử lý',
      value: data.queues.processingWithdrawals,
      helper: 'Các yêu cầu đang chờ xác nhận chuyển khoản',
      path: '/admin/withdrawals'
    },
    {
      label: 'Refund chờ hoàn',
      value: data.queues.pendingRefunds,
      helper: 'Refund thủ công SME đang chờ cập nhật',
      path: '/admin/withdrawals'
    },
    {
      label: 'Mua gói chờ xác nhận',
      value: data.queues.pendingPackagePurchases,
      helper: 'Theo dõi thanh toán gói và entitlement',
      path: '/admin/package-support'
    }
  ];

  return (
    <PageShell size="wide" density="relaxed">
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan vận hành"
        description="Theo dõi các hàng đợi cần xử lý và snapshot hiện tại của hệ thống admin mà không cần mở từng màn hình riêng lẻ."
        extra={<Button type="primary" onClick={() => onNavigate('/admin/verifications')}>Duyệt xác thực</Button>}
      />

      <DataPanel>
        <div className="dashboard-hero-copy">
          <Tag color="cyan">{content.label}</Tag>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="dashboard-insight">
            <span>Ưu tiên hôm nay</span>
            <strong>{content.insight}</strong>
          </div>
        </div>
      </DataPanel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className="grid gap-3 rounded-card border border-d4u-border/80 bg-white/92 p-5 shadow-soft">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-d4u-text-3">{metric.label}</span>
            <strong className="text-[26px] font-semibold leading-none text-d4u-text-1">{metric.value}</strong>
            <p className="text-sm leading-6 text-d4u-text-2">{metric.helper}</p>
          </article>
        ))}
      </section>

      <DataPanel title="Hàng đợi vận hành" description="Mở thẳng các màn cần xử lý khi số lượng đang tăng.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {queueCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="grid gap-2 rounded-card border border-d4u-border/80 bg-d4u-soft/35 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:bg-white"
              onClick={() => onNavigate(card.path)}
            >
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-d4u-text-3">{card.label}</span>
              <strong className="text-[28px] font-semibold leading-none text-d4u-teal-deep">{card.value}</strong>
              <p className="text-sm leading-6 text-d4u-text-2">{card.helper}</p>
            </button>
          ))}
        </div>
      </DataPanel>

      <DataPanel title="Snapshot gói & thanh toán" description="Tóm tắt nhanh tình trạng mua gói hiện tại.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Tổng lượt mua gói', data.packages.totalPurchases],
            ['Gói đang hoạt động', data.packages.activePurchases],
            ['Chờ xác nhận', data.packages.pendingPurchases],
            ['Thanh toán thất bại', data.packages.failedPurchases]
          ].map(([label, value]) => (
            <div key={label} className="rounded-card border border-d4u-border/80 bg-white/92 p-4 shadow-soft">
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-d4u-text-3">{label}</span>
              <strong className="mt-2 block text-2xl font-semibold leading-none text-d4u-text-1">{value}</strong>
            </div>
          ))}
        </div>
      </DataPanel>

      {false ? <div className="grid gap-4 xl:grid-cols-3">
        <AdminRecentList
          title="Xác thực mới nhất"
          description="Ưu tiên hồ sơ sinh viên vừa gửi để không làm chậm luồng marketplace."
          actionLabel="Mở duyệt xác thực"
          actionPath="/admin/verifications"
          items={data.recent.latestVerifications}
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="grid gap-1">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-sm text-d4u-text-1">{item.studentFullName}</strong>
                {getAdminStatusTag(item.status)}
              </div>
              <span className="text-sm text-d4u-text-2">{item.school || 'Chưa có trường học'}</span>
              <span className="text-xs text-d4u-text-3">Gửi lúc {formatDate(item.submittedAt)}</span>
            </div>
          )}
        />

        <AdminRecentList
          title="Yêu cầu rút tiền mới"
          description="Theo dõi các yêu cầu rút tiền cần finance/admin xử lý thủ công."
          actionLabel="Mở rút tiền"
          actionPath="/admin/withdrawals"
          items={data.recent.latestWithdrawals}
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="grid gap-1">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-sm text-d4u-text-1">{item.studentFullName}</strong>
                {getAdminStatusTag(item.status)}
              </div>
              <span className="text-sm font-semibold text-d4u-teal-deep">{formatCurrency(item.amount, 'VND')}</span>
              <span className="text-xs text-d4u-text-3">Tạo lúc {formatDate(item.createdAt)}</span>
            </div>
          )}
        />

        <AdminRecentList
          title="Mua gói gần nhất"
          description="Giúp admin nhìn nhanh các giao dịch gói đang phát sinh."
          actionLabel="Mở package support"
          actionPath="/admin/package-support"
          items={data.recent.latestPackagePurchases}
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="grid gap-1">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-sm text-d4u-text-1">{item.buyerName}</strong>
                {getAdminStatusTag(item.status)}
              </div>
              <span className="text-sm text-d4u-text-2">{item.packageName}</span>
              <div className="flex flex-wrap items-center gap-2">
                {item.paymentStatus ? getAdminStatusTag(item.paymentStatus) : null}
                <span className="text-xs text-d4u-text-3">Tạo lúc {formatDate(item.createdAt)}</span>
              </div>
            </div>
          )}
        />
      </div> : null}
    </PageShell>
  );
}

function AdminDashboard({ content, data, onNavigate }) {
  const summaryMetrics = [
    {
      label: 'Tổng người dùng',
      value: formatCount(data.summary.totalUsers),
      helper: `${formatCount(data.summary.totalStudents)} Student • ${formatCount(data.summary.totalSmes)} SME`,
      path: '/admin/users',
      icon: <TeamOutlined />
    },
    {
      label: 'Tổng dự án',
      value: formatCount(data.summary.totalProjects),
      helper: `${formatCount(data.summary.openProjects)} đang mở • ${formatCount(data.summary.completedProjects)} đã hoàn thành`,
      path: '/admin/audit-logs',
      icon: <FolderOpenOutlined />
    },
    {
      label: 'Việc cần xử lý',
      value: formatCount(data.actions.needsAttentionCount),
      helper: 'Hàng đợi đang chờ admin',
      path: '/admin/verifications',
      icon: <ExclamationCircleFilled />,
      tone: 'accent',
      badge: 'Ưu tiên'
    },
    {
      label: 'Gói trả phí',
      value: formatCount(data.packages.totalPurchases),
      helper: `${formatCount(data.packages.pendingPurchases)} chờ • ${formatCount(data.packages.activePurchases)} đang hoạt động`,
      path: '/admin/package-support',
      icon: <CreditCardOutlined />
    }
  ];

  const queueCards = [
    {
      label: 'Xác thực chờ duyệt',
      value: data.queues.pendingVerifications,
      helper: 'Đi tới duyệt xác thực',
      path: '/admin/verifications',
      icon: <SafetyCertificateOutlined />
    },
    {
      label: 'Rút tiền chờ xử lý',
      value: data.queues.pendingWithdrawals,
      helper: 'Yêu cầu mới cần xử lý',
      path: '/admin/withdrawals',
      icon: <WalletOutlined />
    },
    {
      label: 'Rút tiền đang xác nhận',
      value: data.queues.processingWithdrawals,
      helper: 'Đang chờ xác nhận chuyển khoản',
      path: '/admin/withdrawals',
      icon: <FileDoneOutlined />
    },
    {
      label: 'Refund chờ xử lý',
      value: data.queues.pendingRefunds,
      helper: 'Refund thủ công đang chờ',
      path: '/admin/withdrawals',
      icon: <CreditCardOutlined />,
      tone: 'warning'
    },
    {
      label: 'Gói chờ xác nhận',
      value: data.queues.pendingPackagePurchases,
      helper: 'Theo dõi thanh toán gói',
      path: '/admin/package-support',
      icon: <CheckCircleOutlined />,
      tone: 'warning'
    }
  ];

  return (
    <PageShell size="wide" density="relaxed">
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan vận hành"
        description="Theo dõi nhanh người dùng, dự án, giao dịch và các hàng đợi cần xử lý."
        extra={<Button type="primary" onClick={() => onNavigate('/admin/verifications')}>Duyệt xác thực</Button>}
      />

      <section className="overflow-hidden rounded-panel border border-d4u-border bg-white shadow-soft">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft via-white to-sky-50" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="grid gap-3">
              <Tag color="cyan" className="w-fit !rounded-full !px-3 !py-1 !text-xs !font-semibold">{content.label}</Tag>
              <div className="grid gap-2">
                <h2 className="font-display text-[26px] font-semibold tracking-tight text-d4u-teal-deep sm:text-[30px]">
                  Điều phối các tác vụ vận hành quan trọng: xác thực, rút tiền, refund và mua gói.
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-d4u-text-2">
                  Giữ bố cục gọn, ưu tiên các hàng đợi cần thao tác ngay và tách rõ nhóm báo cáo gói, thanh toán.
                </p>
              </div>
            </div>
            <div className="rounded-card border border-d4u-cyan/20 bg-d4u-soft/80 p-4">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-d4u-cyan ring-1 ring-d4u-cyan/15">
                  <ExclamationCircleFilled />
                </div>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-d4u-teal-deep">Ưu tiên hôm nay</span>
                  <p className="text-sm leading-6 text-d4u-text-2">
                    Kiểm tra các yêu cầu tài chính và xác thực đang chờ xử lý.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-d4u-text-3">Tổng quan hệ thống</span>
          <strong className="font-display text-xl font-semibold text-d4u-text-1">Nhìn nhanh các chỉ số chính và phần việc cần ưu tiên</strong>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <AdminSummaryCard key={metric.label} metric={metric} onNavigate={onNavigate} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-panel border border-d4u-border/80 bg-white/95 p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-d4u-soft text-[22px] text-d4u-cyan">
                <WalletOutlined />
              </div>
              <div className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-d4u-text-3">Doanh thu D4U đã ghi nhận</span>
                <strong className="font-display text-[30px] font-bold tracking-tight text-d4u-teal-deep">
                  {formatCurrency(data.summary.totalRevenue, 'VND')}
                </strong>
                <p className="text-sm leading-6 text-d4u-text-2">
                  Gồm phí nền tảng đã giải ngân và giao dịch mua gói thanh toán thành công.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-panel border border-d4u-border/80 bg-gradient-to-br from-d4u-soft via-white to-white p-5 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-d4u-text-3">Nhịp vận hành</span>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between gap-3 rounded-card border border-d4u-border/70 bg-white/90 px-4 py-3">
                <span className="text-sm text-d4u-text-2">Xác thực + tài chính đang chờ</span>
                <strong className="text-lg font-semibold text-d4u-text-1">{formatCount(data.actions.needsAttentionCount)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-card border border-d4u-border/70 bg-white/90 px-4 py-3">
                <span className="text-sm text-d4u-text-2">Dự án đã hoàn thành</span>
                <strong className="text-lg font-semibold text-d4u-text-1">{formatCount(data.summary.completedProjects)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DataPanel title="Hàng đợi vận hành" description="Mở thẳng các màn cần xử lý khi số lượng đang tăng.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {queueCards.map((card) => (
            <AdminQueueCard key={card.label} card={card} onNavigate={onNavigate} />
          ))}
        </div>
      </DataPanel>

      <DataPanel title="Tổng quan gói & thanh toán" description="Theo dõi trạng thái mua gói và thanh toán của SME.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
          <div className="rounded-panel border border-d4u-cyan/20 bg-gradient-to-br from-d4u-soft via-white to-white p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-d4u-text-3">Báo cáo nhanh</span>
            <p className="mt-3 text-sm leading-6 text-d4u-text-2">
              Theo dõi trạng thái mua gói và các giao dịch cần xác nhận.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminSnapshotMetric
              label="Tổng lượt mua gói"
              value={data.packages.totalPurchases}
              helper="Toàn bộ giao dịch mua gói đã phát sinh"
              tone="info"
            />
            <AdminSnapshotMetric
              label="Gói đang hoạt động"
              value={data.packages.activePurchases}
              helper="Gói đang có hiệu lực"
              tone="success"
            />
            <AdminSnapshotMetric
              label="Chờ xác nhận"
              value={data.packages.pendingPurchases}
              helper="Giao dịch đang chờ xác nhận"
              tone={data.packages.pendingPurchases > 0 ? 'warning' : 'neutral'}
            />
            <AdminSnapshotMetric
              label="Thanh toán thất bại"
              value={data.packages.failedPurchases}
              helper="Lượt mua chưa hoàn tất"
              tone={data.packages.failedPurchases > 0 ? 'warning' : 'success'}
            />
          </div>
        </div>
      </DataPanel>
    </PageShell>
  );
}

function buildOperationalReadinessModal(role, data) {
  if (role === 'STUDENT') {
    if (!data.profile) {
      return {
        key: 'student-profile',
        title: 'Bạn cần tạo hồ sơ sinh viên trước',
        description: 'Tạo hồ sơ để D4U mở ví, lưu trạng thái ứng tuyển và bật đầy đủ workflow Student cho bạn.',
        actionLabel: 'Tạo hồ sơ sinh viên',
        actionPath: '/student/profile',
        notes: [
          'Bạn vẫn có thể xem marketplace trước khi hoàn tất hồ sơ.',
          'Ví D4U, đề nghị và dự án của tôi sẽ mở đầy đủ sau khi hồ sơ được tạo.'
        ]
      };
    }

    if (!approvedStatuses.has(data.profile?.verificationStatus)) {
      return {
        key: 'student-verification',
        title: 'Bạn cần hoàn tất xác thực sinh viên',
        description: 'Sau khi xác thực, D4U mới mở đầy đủ ứng tuyển, offer, ví và workspace dự án cho bạn.',
        actionLabel: 'Mở trang xác thực',
        actionPath: '/student/verification',
        notes: [
          'SME sẽ tin tưởng proposal hơn khi hồ sơ của bạn đã được xác thực.',
          'Bạn vẫn có thể xem brief và chuẩn bị nội dung ứng tuyển từ bây giờ.'
        ]
      };
    }
  }

  if (role === 'SME' && !data.profile) {
    return {
      key: 'sme-profile',
      title: 'Bạn cần hoàn thiện hồ sơ SME trước',
      description: 'Hoàn thiện hồ sơ doanh nghiệp để tạo project, theo dõi offer và dùng dashboard SME đầy đủ hơn.',
      actionLabel: 'Tạo hồ sơ SME',
      actionPath: '/sme/profile',
      notes: [
        'Sau khi lưu hồ sơ, bạn có thể tạo brief đầu tiên ngay trong cùng workspace.',
        'Luồng ứng tuyển, offer và thanh toán escrow sẽ rõ hơn khi thông tin doanh nghiệp đã sẵn sàng.'
      ]
    };
  }

  return null;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const content = dashboardContent[role] || dashboardContent.STUDENT;
  const isOperationalRole = useMemo(() => role === 'STUDENT' || role === 'SME', [role]);
  const isDataDrivenRole = useMemo(() => role === 'STUDENT' || role === 'SME' || role === 'ADMIN', [role]);
  const [loading, setLoading] = useState(isDataDrivenRole);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [readinessModal, setReadinessModal] = useState(null);
  const readinessModalKeyRef = useRef(null);

  useEffect(() => {
    if (!isDataDrivenRole) return undefined;

    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextData = role === 'STUDENT'
          ? await loadStudentDashboard()
          : role === 'SME'
            ? await loadSmeDashboard()
            : await loadAdminDashboard();

        if (!ignore) {
          setData(nextData);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getApiErrorMessage(requestError, 'Không thể tải dashboard lúc này.'));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [isDataDrivenRole, reloadSeed, role]);

  useEffect(() => {
    if (!isOperationalRole || !data) return;

    const nextModal = buildOperationalReadinessModal(role, data);
    if (!nextModal) {
      readinessModalKeyRef.current = null;
      setReadinessModal(null);
      return;
    }

    if (readinessModalKeyRef.current !== nextModal.key) {
      readinessModalKeyRef.current = nextModal.key;
      setReadinessModal(nextModal);
    }
  }, [data, isOperationalRole, role]);

  if (isDataDrivenRole && loading) return <DashboardSkeleton />;
  if (isDataDrivenRole && error) {
    return (
      <ErrorState
        title="Không thể tải dashboard"
        description={error}
        onRetry={() => setReloadSeed((current) => current + 1)}
      />
    );
  }

  if (role === 'ADMIN' && data) {
    return <AdminDashboard content={content} data={data} onNavigate={navigate} />;
  }

  if (isOperationalRole && data) {
    return (
      <>
        <OperationalDashboard content={content} data={data} onNavigate={navigate} />
        <Modal
          open={Boolean(readinessModal)}
          centered
          className="workspace-readiness-modal"
          title={null}
          footer={[
            <Button key="later" onClick={() => setReadinessModal(null)}>
              Để sau
            </Button>,
            <Button
              key="primary"
              type="primary"
              onClick={() => {
                if (readinessModal?.actionPath) {
                  navigate(readinessModal.actionPath);
                }
                setReadinessModal(null);
              }}
            >
              {readinessModal?.actionLabel}
            </Button>
          ]}
          onCancel={() => setReadinessModal(null)}
        >
          <div className="workspace-readiness-modal-body">
            <div className="workspace-readiness-modal-icon">
              <ExclamationCircleFilled />
            </div>
            <div className="workspace-readiness-modal-copy">
              <h2>{readinessModal?.title}</h2>
              <p>{readinessModal?.description}</p>
              <div className="workspace-readiness-modal-notes">
                {readinessModal?.notes?.map((note) => (
                  <div key={note} className="workspace-readiness-modal-note">
                    <span />
                    <strong>{note}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <PageShell size="wide" density="relaxed">
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan"
        description="Các tác vụ quan trọng nhất cho vai trò hiện tại. D4U chỉ hiển thị dữ liệu thật từ API và không dùng số liệu giả cho dashboard."
        extra={<Button type="primary" onClick={() => navigate(content.primaryPath)}>{content.primaryLabel}</Button>}
      />

      <DataPanel>
        <div className="dashboard-hero-copy">
          <Tag color="cyan">{content.label}</Tag>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
          <div className="dashboard-insight">
            <span>Gợi ý workflow</span>
            <strong>{content.insight}</strong>
          </div>
        </div>
      </DataPanel>

      <div className="grid gap-1">
        <span>Workflow chính</span>
        <strong>Chọn bước cần xử lý tiếp theo</strong>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {content.cards.map((card) => (
          <button
            key={card.path}
            type="button"
            className="grid h-full gap-4 rounded-panel border border-d4u-border/80 bg-white/92 p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:shadow-card"
            onClick={() => navigate(card.path)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-card bg-d4u-soft text-[20px] text-d4u-cyan">{card.icon}</div>
              <Tag className="!m-0 rounded-full font-semibold">{card.badge}</Tag>
            </div>
            <div className="grid gap-2">
              <h2 className="text-lg font-semibold leading-tight text-d4u-text-1">{card.title}</h2>
              <p className="text-sm leading-6 text-d4u-text-2">{card.description}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-d4u-cyan">
              Mở <ArrowRightOutlined />
            </span>
          </button>
        ))}
      </div>
    </PageShell>
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
