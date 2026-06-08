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
import { BackendGapState, ErrorState } from '../../components/StateViews.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { profileApi } from '../../services/profileApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const approvedStatuses = new Set(['APPROVED', 'VERIFIED']);

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
    description: 'Duyệt xác thực, xử lý rút tiền, theo dõi audit logs và moderation phục vụ demo Outcome 1.',
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

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <Skeleton active paragraph={{ rows: 3 }} />
      <div className="dashboard-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="dashboard-card">
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function OperationalDashboard({ content, data, onNavigate }) {
  const metrics = content.getMetrics(data);
  const primaryAction = content.getPrimaryAction(data);
  const isEmptyState = content.isEmptyState(data);

  return (
    <>
      <PageHeader
        icon={<DashboardOutlined />}
        eyebrow={content.label}
        title="Tổng quan"
        description="D4U dùng dữ liệu thật từ API để gợi ý bước tiếp theo. Khi tài khoản còn mới, dashboard sẽ ưu tiên các bước khởi tạo cần thiết."
        extra={<Button type="primary" onClick={() => onNavigate(primaryAction.path)}>{primaryAction.label}</Button>}
      />

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <Tag color="cyan">{content.label}</Tag>
          <h2>{isEmptyState ? content.emptyTitle : content.title}</h2>
          <p>{isEmptyState ? content.emptyDescription : content.description}</p>
          <div className="dashboard-insight">
            <span>{isEmptyState ? 'Ưu tiên khởi tạo' : 'Gợi ý workflow'}</span>
            <strong>{content.insight}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-metric-grid">
        {metrics.map((metric) => (
          <Card key={metric.label} className="dashboard-metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.helper}</p>
          </Card>
        ))}
      </section>

      <div className="dashboard-section-heading">
        <span>{isEmptyState ? 'Lộ trình gợi ý' : 'Workflow chính'}</span>
        <strong>{isEmptyState ? 'Đi tiếp theo từng bước, không cần đoán phải bắt đầu từ đâu' : 'Chọn bước cần xử lý tiếp theo'}</strong>
      </div>

      <div className={`dashboard-grid ${isEmptyState ? 'dashboard-grid-onboarding' : ''}`}>
        {(isEmptyState ? content.emptyActions : content.cards).map((card) => (
          <Card key={card.path} className="dashboard-card" hoverable onClick={() => onNavigate(card.path)}>
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon">{card.icon}</div>
              <Tag>{card.badge}</Tag>
            </div>
            <div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
            <Button type="link">
              Mở <ArrowRightOutlined />
            </Button>
          </Card>
        ))}
      </div>
    </>
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
  const [loading, setLoading] = useState(isOperationalRole);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [readinessModal, setReadinessModal] = useState(null);
  const readinessModalKeyRef = useRef(null);

  useEffect(() => {
    if (!isOperationalRole) return undefined;

    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextData = role === 'STUDENT'
          ? await loadStudentDashboard()
          : await loadSmeDashboard();

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
  }, [isOperationalRole, reloadSeed, role]);

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

  if (isOperationalRole && loading) return <DashboardSkeleton />;
  if (isOperationalRole && error) {
    return (
      <ErrorState
        title="Không thể tải dashboard"
        description={error}
        onRetry={() => setReloadSeed((current) => current + 1)}
      />
    );
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
      </section>

      <div className="dashboard-section-heading">
        <span>Workflow chính</span>
        <strong>Chọn bước cần xử lý tiếp theo</strong>
      </div>

      <div className="dashboard-grid">
        {content.cards.map((card) => (
          <Card key={card.path} className="dashboard-card" hoverable onClick={() => navigate(card.path)}>
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon">{card.icon}</div>
              <Tag>{card.badge}</Tag>
            </div>
            <div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
            <Button type="link">
              Mở <ArrowRightOutlined />
            </Button>
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
