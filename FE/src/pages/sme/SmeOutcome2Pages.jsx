import {
  App,
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  InputNumber,
  List,
  Modal,
  Space,
  Table,
  Typography
} from 'antd';
import {
  BankOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FireOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  TeamOutlined
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { matchingApi } from '../../services/matchingApi.js';
import { packageApi } from '../../services/packageApi.js';
import { profileApi } from '../../services/profileApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const { Paragraph, Title } = Typography;
const ACTIVE_OFFER_STATUSES = ['WAITING_ACCEPTANCE', 'ACCEPTED', 'PENDING_PAYMENT', 'PAYMENT_FAILED', 'ACTIVE'];
const AI_MATCHING_ELIGIBLE_PROJECT_STATUSES = ['DRAFT', 'OPEN', 'PRIVATE_INVITED'];

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="min-w-0">
      <strong className="block truncate text-sm font-semibold text-d4u-text-1">{title}</strong>
      {subtitle ? <div className="mt-1 text-xs text-d4u-text-3">{subtitle}</div> : null}
    </div>
  );
}

function renderDateCell(value) {
  return value
    ? <span className="text-sm font-medium text-d4u-text-2">{formatDate(value)}</span>
    : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function findActiveMatchingEntitlement(entitlements) {
  return entitlements.find((item) => item.status === 'ACTIVE' && item.entitlementCode === 'SME_AI_MATCHING');
}

function canUseAiMatchingForProject(projectStatus) {
  return AI_MATCHING_ELIGIBLE_PROJECT_STATUSES.includes(projectStatus);
}

function buildPurchaseActionLabel(purchase) {
  if (!purchase) return 'Mua gói & thanh toán';
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return 'Mở lại PayOS';
  return 'Thanh toán lại';
}

function getScoreTone(score) {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (score >= 70) return 'bg-sky-50 text-sky-700 ring-sky-200';
  if (score >= 55) return 'bg-amber-50 text-amber-700 ring-amber-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function PillBadge({ tone = 'neutral', children }) {
  const toneClass = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    info: 'bg-sky-50 text-sky-700 ring-sky-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200'
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
      {children}
    </span>
  );
}

function ScoreBadge({ score }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1 text-xs font-semibold ring-1 ${getScoreTone(score)}`}>
      <StarFilled />
      Điểm {score}
    </span>
  );
}

function MetricPill({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-d4u-border bg-white/85 px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-d4u-soft text-d4u-teal-deep">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d4u-text-3">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-d4u-text-1">{value}</p>
      </div>
    </div>
  );
}

function renderSubscriptionDuration(profile) {
  if (!profile) return 'Chua co';
  if (!profile.subscriptionCurrentPeriodEnd) return 'Khong het han';
  return `Den ${formatDate(profile.subscriptionCurrentPeriodEnd)}`;
}

function renderProjectLimit(profile) {
  const activeCount = profile?.activeOpenProjectCount ?? 0;
  const maxOpenProjects = profile?.subscriptionPlan?.maxActiveOpenProjects;

  if (maxOpenProjects == null) return `${activeCount} dang mo`;
  return `${activeCount}/${maxOpenProjects} du an dang mo`;
}

function renderProjectLimitDescription(profile) {
  const maxOpenProjects = profile?.subscriptionPlan?.maxActiveOpenProjects;

  if (maxOpenProjects == null) return 'Khong gioi han so du an dang mo';
  return `Toi da ${maxOpenProjects} du an dang mo cung luc`;
}

function renderPlanPrice(profile) {
  if (!profile?.subscriptionPlan) return 'Chua co';
  const price = formatCurrency(profile.subscriptionPlan.monthlyPrice);
  return profile.isFreePlan ? `${price}/thang` : `${price}/30 ngay`;
}

function RecommendationReason({ reason }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-d4u-cyan ring-1 ring-d4u-cyan/20">
        <CheckCircleFilled className="text-[11px]" />
      </span>
      <span className="text-sm leading-6 text-d4u-text-2">{reason}</span>
    </li>
  );
}

function ProjectSummaryHero({ project, activePackage }) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft via-white to-sky-50" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <PillBadge tone="info">Khu vực gợi ý AI</PillBadge>
                <StatusBadge status={project.status} />
                {activePackage ? (
                  <PillBadge tone="success">
                    <SafetyCertificateOutlined />
                    Gói đang hoạt động
                  </PillBadge>
                ) : (
                  <PillBadge tone="warning">
                    <CreditCardOutlined />
                    Chưa có gói
                  </PillBadge>
                )}
              </div>
              <Title level={3} className="!mb-2 !font-display !text-d4u-teal-deep">
                {project.title}
              </Title>
              <Paragraph className="!mb-0 max-w-3xl !text-sm !leading-6 !text-d4u-text-2">
                Chạy gợi ý AI trực tiếp từ dự án để xem danh sách sinh viên được xếp hạng theo mức độ phù hợp,
                rồi quay lại luồng ứng tuyển và đề nghị khi cần.
              </Paragraph>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <MetricPill icon={<DollarOutlined />} label="Ngân sách" value={formatCurrency(project.budgetAmount, project.currency)} />
              <MetricPill icon={<CreditCardOutlined />} label="Gói" value={activePackage ? `Đến ${formatDate(activePackage.expiresAt)}` : 'Chưa kích hoạt'} />
              <MetricPill icon={<TeamOutlined />} label="Trạng thái" value={project.status || 'Chưa có'} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({
  item,
  index,
  application,
  activeOffer,
  canCreateOffer,
  actingOfferStudentId,
  onOpenOfferModal,
  onGoToOffers
}) {
  const isTopMatch = index === 0;
  const isCreatingOffer = actingOfferStudentId === item.studentProfileId;
  const hasActiveOffer = Boolean(activeOffer);

  return (
    <Card
      className={[
        'group overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-d4u-cyan/40 hover:shadow-card',
        isTopMatch ? 'ring-2 ring-d4u-cyan/20 shadow-card' : ''
      ].join(' ')}
      bodyStyle={{ padding: 0 }}
    >
      <div className={isTopMatch ? 'bg-gradient-to-r from-d4u-soft-2 via-white to-white' : 'bg-white'}>
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <PillBadge tone={isTopMatch ? 'info' : 'neutral'}>
                  <FireOutlined />
                  #{index + 1}
                </PillBadge>
                <ScoreBadge score={item.matchScore} />
                {item.verificationStatus && item.verificationStatus !== 'UNVERIFIED' ? (
                  <PillBadge tone="success">
                    <SafetyCertificateOutlined />
                    Đã xác thực
                  </PillBadge>
                ) : (
                  <PillBadge tone="neutral">
                    <SafetyCertificateOutlined />
                    Chưa xác thực
                  </PillBadge>
                )}
                {item.hasAppliedToProject ? (
                  <PillBadge tone="info">
                    <FileDoneOutlined />
                    Đã ứng tuyển
                  </PillBadge>
                ) : null}
                <PillBadge tone={application ? 'info' : 'neutral'}>
                  {application ? 'Từ ứng tuyển' : 'Từ gợi ý AI'}
                </PillBadge>
                {hasActiveOffer ? (
                  <PillBadge tone="warning">
                    {activeOffer.offerStatus === 'WAITING_ACCEPTANCE' ? 'Đang chờ phản hồi' : 'Đã có đề nghị'}
                  </PillBadge>
                ) : null}
                {isTopMatch ? <PillBadge tone="warning">Phù hợp nhất</PillBadge> : null}
              </div>

              <Title level={4} className="!mb-1 truncate !font-display !text-d4u-text-1">
                {item.studentFullName}
              </Title>
              <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                {[item.school || 'Chưa có trường', item.major || 'Chưa có chuyên ngành'].join(' · ')}
              </Paragraph>
            </div>

            <div className="rounded-2xl border border-d4u-border bg-d4u-soft/70 px-4 py-3 text-left lg:min-w-[180px] lg:text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d4u-text-3">Giá đề xuất</p>
              <p className="mt-1 text-base font-semibold text-d4u-teal-deep">
                {item.proposedPrice ? formatCurrency(item.proposedPrice) : 'Chưa có'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricPill icon={<BankOutlined />} label="Trường" value={item.school || 'Chưa có'} />
            <MetricPill icon={<ReadOutlined />} label="Chuyên ngành" value={item.major || 'Chưa có'} />
            <MetricPill icon={<StarFilled />} label="Đánh giá" value={item.averageRating ? item.averageRating.toFixed(2) : '0.00'} />
            <MetricPill icon={<TeamOutlined />} label="Dự án đã xong" value={`${item.completedProjectsCount ?? 0} dự án`} />
          </div>

          <div className="rounded-2xl border border-d4u-border bg-white/90 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Tóm tắt hồ sơ</p>
            <Paragraph className="!mb-0 mt-2 !text-sm !leading-6 !text-d4u-text-2">
              {item.bio || 'Sinh viên chưa bổ sung phần giới thiệu chi tiết, nên hệ thống ưu tiên đánh giá từ trạng thái xác thực, lịch sử dự án và dữ liệu ứng tuyển hiện có.'}
            </Paragraph>
          </div>

          <div className="rounded-block border border-d4u-cyan/15 bg-d4u-soft/75 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-d4u-cyan shadow-sm">
                <CheckCircleFilled />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Lý do gợi ý</p>
                <p className="text-sm font-semibold text-d4u-teal-deep">Điểm mạnh nổi bật cho dự án này</p>
              </div>
            </div>
            <ul className="grid gap-3">
              {item.reasons?.map((reason) => <RecommendationReason key={reason} reason={reason} />)}
            </ul>
          </div>

          {item.warnings?.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Cảnh báo dữ liệu</p>
              <p className="mt-2 text-sm leading-6 text-amber-800">{item.warnings.join(' ')}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-2xl border border-d4u-border bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Đề nghị hợp tác</p>
              <p className="mt-1 text-sm leading-6 text-d4u-text-2">
                {application
                  ? 'Student đã ứng tuyển vào dự án này. Bạn có thể gửi đề nghị ngay từ kết quả gợi ý.'
                  : 'Bạn có thể gửi đề nghị trực tiếp từ AI Matching ngay cả khi student chưa ứng tuyển.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:min-w-[220px]">
              <Button
                type="primary"
                className="!h-11 !rounded-btn !bg-d4u-cyan !font-semibold hover:!bg-d4u-cyan-hover"
                disabled={!canCreateOffer || hasActiveOffer}
                loading={isCreatingOffer}
                onClick={() => onOpenOfferModal(item)}
              >
                {hasActiveOffer ? 'Đã gửi đề nghị' : 'Gửi đề nghị'}
              </Button>
              {hasActiveOffer ? (
                <Button
                  className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                  onClick={onGoToOffers}
                >
                  Mở danh sách đề nghị
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PackageShowcaseCard({
  pkg,
  latestPurchase,
  isActivePackage,
  loading,
  actingPackageId,
  actingPurchaseId,
  onStartPurchase,
  onReopenPurchasePayment
}) {
  return (
    <Card
      className={[
        'h-full overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-d4u-cyan/35 hover:shadow-card',
        isActivePackage ? 'ring-2 ring-emerald-200/70 shadow-card' : ''
      ].join(' ')}
      loading={loading}
      bodyStyle={{ padding: 0 }}
    >
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-d4u-soft-2 via-d4u-soft to-white" />
        <div className="relative flex h-full flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <PillBadge tone="info">{pkg.code}</PillBadge>
            <PillBadge tone="neutral">{pkg.durationDays} ngày</PillBadge>
            <PillBadge tone={isActivePackage ? 'success' : latestPurchase?.paymentStatus === 'PENDING' ? 'warning' : 'neutral'}>
              {isActivePackage ? 'Đang hoạt động' : latestPurchase?.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Chưa kích hoạt'}
            </PillBadge>
          </div>

          <div>
            <Title level={3} className="!mb-2 !font-display !text-d4u-teal-deep">
              {pkg.name}
            </Title>
            <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
              {pkg.description}
            </Paragraph>
          </div>

          <div className="rounded-block border border-d4u-cyan/15 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Giá gói</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-d4u-teal-deep sm:text-4xl">
                {formatCurrency(pkg.price, pkg.currency)}
              </span>
            </div>
            <p className="mt-3 text-sm text-d4u-text-2">
              Gói cho vai trò {pkg.role} · mở khóa tính năng gợi ý AI cho SME
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricPill icon={<CreditCardOutlined />} label="Thanh toán" value={latestPurchase?.paymentStatus || 'Chưa có'} />
            <MetricPill icon={<SafetyCertificateOutlined />} label="Gói" value={latestPurchase?.entitlementStatus || (isActivePackage ? 'Đang hoạt động' : 'Chưa có')} />
            <MetricPill icon={<CheckCircleFilled />} label="Lượt mua" value={latestPurchase?.status || 'Chưa có'} />
          </div>

          {latestPurchase ? (
            <div className="rounded-2xl border border-d4u-border bg-d4u-soft/65 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Lần mua gần nhất</p>
                  <p className="mt-1 text-sm font-semibold text-d4u-text-1">{formatDate(latestPurchase.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={latestPurchase.status} />
                  {latestPurchase.paymentStatus ? <StatusBadge status={latestPurchase.paymentStatus} /> : null}
                  {!isActivePackage && latestPurchase.entitlementStatus ? <StatusBadge status={latestPurchase.entitlementStatus} /> : null}
                </div>
              </div>
              {latestPurchase.expiresAt ? (
                <p className="mt-3 text-sm leading-6 text-d4u-text-2">
                  Hiệu lực đến <span className="font-semibold text-d4u-text-1">{formatDate(latestPurchase.expiresAt)}</span>.
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-d4u-text-2">
                  Gói sẽ được mở khóa sau khi PayOS webhook xác nhận thanh toán thành công.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-d4u-border bg-white/80 p-4 text-sm leading-6 text-d4u-text-2">
              Chưa có giao dịch nào cho gói này. Bạn có thể bắt đầu mua ngay để mở khóa tính năng gợi ý AI cho SME.
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 sm:flex-row">
            <Button
              type="primary"
              className="!h-12 flex-1 !rounded-btn !bg-d4u-cyan !font-semibold hover:!bg-d4u-cyan-hover"
              disabled={isActivePackage}
              loading={actingPackageId === pkg.id}
              onClick={() => onStartPurchase(pkg)}
            >
              {isActivePackage ? 'Gói đang hoạt động' : 'Mua gói & thanh toán'}
            </Button>
            {latestPurchase && !isActivePackage ? (
              <Button
                className="!h-12 flex-1 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                loading={actingPurchaseId === latestPurchase.id}
                onClick={() => onReopenPurchasePayment(latestPurchase)}
              >
                {buildPurchaseActionLabel(latestPurchase)}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SmeBillingLivePage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [packages, setPackages] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingPackageId, setActingPackageId] = useState(null);
  const [actingPurchaseId, setActingPurchaseId] = useState(null);
  const [error, setError] = useState(null);
  const activePackage = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, packageRows, purchaseRows, entitlementRows] = await Promise.all([
        profileApi.getSmeProfile().catch((requestError) => {
          if (requestError?.response?.status === 404) {
            return null;
          }

          throw requestError;
        }),
        packageApi.listPackages('SME'),
        packageApi.listMyPurchases(),
        packageApi.listMyEntitlements()
      ]);
      setProfile(profileResponse);
      setPackages(packageRows);
      setPurchases(purchaseRows);
      setEntitlements(entitlementRows);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu gói SME.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchParams.get('paymentReturn') && !searchParams.get('paymentId')) return;
    loadData();
  }, [searchParams]);

  const openCheckout = (checkoutUrl) => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const startPurchase = async (pkg) => {
    setActingPackageId(pkg.id);
    setError(null);
    try {
      const purchase = await packageApi.purchasePackage(pkg.id);
      const payment = await packageApi.createPurchasePayment(purchase.id);
      openCheckout(payment.checkoutUrl);
      message.success('Đã tạo giao dịch PayOS cho gói gợi ý AI.');
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tạo giao dịch mua gói.'));
    } finally {
      setActingPackageId(null);
    }
  };

  const reopenPurchasePayment = async (purchase) => {
    setActingPurchaseId(purchase.id);
    setError(null);
    try {
      const payment = await packageApi.createPurchasePayment(purchase.id);
      openCheckout(payment.checkoutUrl || purchase.checkoutUrl);
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán PayOS cho gói.'));
    } finally {
      setActingPurchaseId(null);
    }
  };

  if (error && !packages.length && !loading) return <ErrorState description={error} onRetry={loadData} />;

  const latestPurchaseByPackage = Object.fromEntries(
    packages.map((pkg) => [
      pkg.id,
      purchases
        .filter((purchase) => purchase.packageId === pkg.id)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null
    ])
  );

  return (
    <>
      <PageHeader
        icon={<CreditCardOutlined />}
        title="Gói & thanh toán"
        description="Mở khóa tính năng gợi ý AI cho SME qua PayOS với giao diện quản lý gói rõ ràng, tập trung vào trạng thái gói và các giao dịch gần nhất."
        extra={(
          <Button
            className="!h-11 !rounded-btn !border-d4u-border !px-5 !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
            onClick={loadData}
          >
            Làm mới
          </Button>
        )}
      />

      {profile ? (
        <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-d4u-soft via-white to-sky-50 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <PillBadge tone={profile.isFreePlan ? 'info' : 'success'}>
                  {profile.isFreePlan ? 'Goi Free' : profile.subscriptionPlan?.name || 'Goi hien tai'}
                </PillBadge>
                <PillBadge tone="neutral">{renderProjectLimitDescription(profile)}</PillBadge>
              </div>
              <Title level={4} className="!mb-1 !font-display !text-d4u-teal-deep">
                {profile.isFreePlan ? 'SME dang o goi Free mac dinh' : `SME dang o goi ${profile.subscriptionPlan?.name || 'hien tai'}`}
              </Title>
              <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                {profile.isFreePlan
                  ? 'Goi Free khong het han, cho phep dang toi da 2 du an OPEN cung luc. Gioi han nay khong duoc tinh theo so du an da dang trong thang.'
                  : 'Plan hien tai duoc tinh theo so du an dang mo cung luc. Khi mot du an roi khoi trang thai OPEN, ban se mo lai slot de dang du an moi.'}
              </Paragraph>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
              <MetricPill icon={<CreditCardOutlined />} label="Goi" value={profile.subscriptionPlan?.name || 'Chua co'} />
              <MetricPill icon={<DollarOutlined />} label="Gia" value={renderPlanPrice(profile)} />
              <MetricPill icon={<TeamOutlined />} label="Open projects" value={renderProjectLimit(profile)} />
              <MetricPill icon={<CheckCircleFilled />} label="Thoi han" value={renderSubscriptionDuration(profile)} />
              <MetricPill
                icon={<SafetyCertificateOutlined />}
                label="Budget toi da"
                value={profile.subscriptionPlan?.maxProjectBudget != null
                  ? formatCurrency(profile.subscriptionPlan.maxProjectBudget)
                  : 'Khong gioi han'}
              />
              <MetricPill
                icon={<ReadOutlined />}
                label="Rule"
                value={profile.isFreePlan ? 'Khong phai trial 30 ngay' : 'Tinh theo slot dang mo'}
              />
            </div>
          </div>
        </section>
      ) : null}

      {activePackage ? (
        <section className="overflow-hidden rounded-panel border border-emerald-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-50 via-white to-d4u-soft px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <PillBadge tone="success">
                  <SafetyCertificateOutlined />
                  Gói đang hoạt động
                </PillBadge>
                <PillBadge tone="info">Gợi ý AI cho SME</PillBadge>
              </div>
              <Title level={4} className="!mb-1 !font-display !text-emerald-700">
                Bạn đang dùng gói gợi ý AI
              </Title>
              <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                Gói hiện có hiệu lực đến <span className="font-semibold text-d4u-text-1">{formatDate(activePackage.expiresAt)}</span>.
                Bạn có thể mở tính năng gợi ý AI trực tiếp từ trang chi tiết dự án.
              </Paragraph>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <MetricPill icon={<CreditCardOutlined />} label="Gói" value="Đang hoạt động" />
              <MetricPill icon={<CheckCircleFilled />} label="Hết hạn" value={formatDate(activePackage.expiresAt)} />
            </div>
          </div>
        </section>
      ) : (
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message="Gói chỉ được kích hoạt sau khi PayOS webhook xác nhận thành công."
          description="Trang return từ PayOS không tự mở khóa tính năng. Nếu vừa thanh toán xong, hãy bấm Làm mới để kiểm tra trạng thái mới nhất."
        />
      )}

      {error ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="grid grid-cols-1 gap-6">
          {packages.map((pkg) => {
            const latestPurchase = latestPurchaseByPackage[pkg.id];
            const isActivePackage = activePackage?.packageId === pkg.id;

            return (
              <PackageShowcaseCard
                key={pkg.id}
                pkg={pkg}
                latestPurchase={latestPurchase}
                isActivePackage={isActivePackage}
                loading={loading}
                actingPackageId={actingPackageId}
                actingPurchaseId={actingPurchaseId}
                onStartPurchase={startPurchase}
                onReopenPurchasePayment={reopenPurchasePayment}
              />
            );
          })}
        </div>

        <Card className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft" bodyStyle={{ padding: 0 }}>
          <div className="border-b border-d4u-border bg-gradient-to-r from-d4u-soft via-white to-white px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Bảng điều khiển gói</p>
            <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
              Tóm tắt mua gói
            </Title>
            <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
              Theo dõi trạng thái gói, thanh toán và các lần mua gần đây ở một nơi gọn hơn.
            </Paragraph>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
            <MetricPill icon={<CreditCardOutlined />} label="Số gói" value={`${packages.length} gói`} />
            <MetricPill icon={<CheckCircleFilled />} label="Gói" value={activePackage ? 'Đang hoạt động' : 'Chưa kích hoạt'} />
            <MetricPill icon={<DollarOutlined />} label="Đã mua" value={`${purchases.length} giao dịch`} />
            <MetricPill icon={<TeamOutlined />} label="Open projects" value={renderProjectLimit(profile)} />
          </div>
        </Card>
      </section>

      <Card
        className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft"
        title={<span className="font-display text-lg font-semibold text-d4u-text-1">Lịch sử mua gói</span>}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          scroll={{ x: 980 }}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: 'Chưa có giao dịch mua gói nào.' }}
          columns={[
            {
              title: 'Gói',
              dataIndex: 'packageName',
              width: 260,
              render: (value, row) => renderPrimaryCell(value, row.packageCode)
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 132,
              render: (value) => <StatusBadge status={value} />
            },
            {
              title: 'Thanh toán',
              dataIndex: 'paymentStatus',
              width: 132,
              render: (value) => renderStatusOrFallback(value)
            },
            {
              title: 'Gói',
              dataIndex: 'entitlementStatus',
              width: 140,
              render: (value) => renderStatusOrFallback(value)
            },
            {
              title: 'Số tiền',
              dataIndex: 'price',
              width: 150,
              render: (value, row) => <span className="text-sm font-semibold text-d4u-text-1">{formatCurrency(value, row.currency)}</span>
            },
            {
              title: 'Hiệu lực đến',
              dataIndex: 'expiresAt',
              width: 170,
              render: renderDateCell
            },
            {
              title: 'Hành động',
              width: 180,
              render: (_, row) => (
                <Button
                  className="!rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                  disabled={row.status === 'ACTIVE'}
                  loading={actingPurchaseId === row.id}
                  onClick={() => reopenPurchasePayment(row)}
                >
                  {buildPurchaseActionLabel(row)}
                </Button>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}

export function SmeAiMatchingLivePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [offerForm] = Form.useForm();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState(null);
  const [entitlements, setEntitlements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [offers, setOffers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [actingOfferStudentId, setActingOfferStudentId] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const activePackage = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);
  const canUseAiMatching = useMemo(() => canUseAiMatchingForProject(project?.status), [project?.status]);
  const applicationByStudentId = useMemo(
    () => Object.fromEntries(applications.map((item) => [item.studentProfileId, item])),
    [applications]
  );
  const activeOfferByStudentId = useMemo(
    () => Object.fromEntries(
      offers
        .filter((offer) => ACTIVE_OFFER_STATUSES.includes(offer.offerStatus))
        .map((offer) => [offer.studentProfileId, offer])
    ),
    [offers]
  );

  const loadContext = async () => {
    if (!projectId) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [projectResponse, entitlementResponse, applicationResponse, offerResponse] = await Promise.all([
        projectApi.getProject(projectId),
        packageApi.listMyEntitlements(),
        projectApi.listApplications(projectId),
        projectApi.listSmeOffers()
      ]);
      setProject(projectResponse);
      setEntitlements(entitlementResponse);
      setApplications(applicationResponse);
      setOffers(offerResponse.filter((offer) => offer.projectId === projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu gợi ý AI.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [projectId]);

  const runMatching = async () => {
    if (!projectId || !canUseAiMatching) return;

    setRunning(true);
    setError(null);
    try {
      setResult(await matchingApi.matchStudentsForProject(projectId, { maxResults: 6 }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể chạy gợi ý AI cho dự án này.'));
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!projectId || !activePackage || !canUseAiMatching || result || running || loading) return;
    runMatching();
  }, [activePackage, canUseAiMatching, loading, projectId, result, running]);

  useEffect(() => {
    if (!selectedRecommendation || !project) return;
    offerForm.setFieldsValue({
      offeredAmount: selectedRecommendation.proposedPrice || project.budgetAmount
    });
  }, [offerForm, project, selectedRecommendation]);

  const openOfferModal = (recommendation) => {
    setSelectedRecommendation(recommendation);
    offerForm.setFieldsValue({
      offeredAmount: recommendation.proposedPrice || project?.budgetAmount
    });
  };

  const closeOfferModal = () => {
    setSelectedRecommendation(null);
    offerForm.resetFields();
  };

  const createOfferFromMatching = async (values) => {
    if (!projectId || !selectedRecommendation) return;

    const application = applicationByStudentId[selectedRecommendation.studentProfileId];
    setActingOfferStudentId(selectedRecommendation.studentProfileId);
    setError(null);

    try {
      await projectApi.createOffer(projectId, {
        studentProfileId: selectedRecommendation.studentProfileId,
        applicationId: application?.id || null,
        offeredAmount: values.offeredAmount,
        expiresAt: null
      });
      message.success('Đã gửi đề nghị cho student. Bạn có thể theo dõi phản hồi trong danh sách đề nghị.');
      closeOfferModal();
      await loadContext();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gửi đề nghị từ gợi ý AI.'));
    } finally {
      setActingOfferStudentId(null);
    }
  };

  if (error && !project && projectId) return <ErrorState description={error} onRetry={loadContext} />;

  return (
    <>
      <PageHeader
        icon={<TeamOutlined />}
        title="Gợi ý AI"
        description="Đánh giá nhanh các gợi ý sinh viên theo điểm, lý do gợi ý và mức độ sẵn sàng trước khi quay lại luồng đề nghị."
        extra={(
          <Space>
            <Button
              className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
              onClick={() => navigate(projectId ? `/sme/projects/${projectId}` : '/sme/projects')}
            >
              Về dự án
            </Button>
            <Button
              type="primary"
              className="!h-11 !rounded-btn !bg-d4u-cyan !font-semibold hover:!bg-d4u-cyan-hover"
              disabled={!projectId || !activePackage || !canUseAiMatching}
              loading={running}
              onClick={runMatching}
            >
              Chạy lại gợi ý
            </Button>
          </Space>
        )}
      />

      {!projectId ? (
        <Card className="rounded-panel border border-d4u-border shadow-soft">
          <Empty description="Hãy mở tính năng gợi ý AI từ trang chi tiết một dự án SME cụ thể." image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" className="!rounded-btn !bg-d4u-cyan hover:!bg-d4u-cyan-hover" onClick={() => navigate('/sme/projects')}>
              Đi tới danh sách dự án
            </Button>
          </Empty>
        </Card>
      ) : null}

      {project ? <ProjectSummaryHero project={project} activePackage={activePackage} /> : null}

      {project && activePackage && !canUseAiMatching ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Dự án đã qua giai đoạn tuyển chọn nên không thể dùng AI Matching."
          description="Bạn chỉ có thể dùng AI Matching khi dự án còn ở trạng thái DRAFT, OPEN hoặc PRIVATE_INVITED."
        />
      ) : null}

      {!activePackage ? (
        <section className="overflow-hidden rounded-panel border border-amber-200 bg-white shadow-soft">
          <div className="bg-gradient-to-r from-amber-50 via-white to-d4u-soft px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PillBadge tone="warning">
                    <CreditCardOutlined />
                    Tính năng đang khóa
                  </PillBadge>
                </div>
                <Title level={4} className="!mb-1 !font-display !text-amber-700">
                  Bạn chưa có gói gợi ý AI
                </Title>
                <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                  SME cần mua gói gợi ý AI và chờ webhook xác nhận trước khi dùng tính năng này.
                </Paragraph>
              </div>
              <Button
                type="primary"
                className="!h-11 !rounded-btn !bg-d4u-cyan !font-semibold hover:!bg-d4u-cyan-hover"
                onClick={() => navigate('/sme/billing')}
              >
                Mở trang gói & thanh toán
              </Button>
            </div>
          </div>
        </section>
      ) : !canUseAiMatching ? (
        <section className="overflow-hidden rounded-panel border border-amber-200 bg-white shadow-soft">
          <div className="bg-gradient-to-r from-amber-50 via-white to-d4u-soft px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PillBadge tone="warning">
                    <CreditCardOutlined />
                    Ngoài giai đoạn tuyển chọn
                  </PillBadge>
                </div>
                <Title level={4} className="!mb-1 !font-display !text-amber-700">
                  Dự án này không còn dùng được AI Matching
                </Title>
                <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                  AI Matching chỉ khả dụng khi dự án còn ở giai đoạn tuyển chọn: DRAFT, OPEN hoặc PRIVATE_INVITED.
                </Paragraph>
              </div>
              <Button
                className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                onClick={() => navigate(projectId ? `/sme/projects/${projectId}` : '/sme/projects')}
              >
                Quay về chi tiết dự án
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-panel border border-emerald-200 bg-white shadow-soft">
          <div className="bg-gradient-to-r from-emerald-50 via-white to-d4u-soft px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PillBadge tone="success">
                    <SafetyCertificateOutlined />
                    Gói đang hoạt động
                  </PillBadge>
                </div>
                <p className="text-sm font-semibold text-emerald-700">Tính năng gợi ý AI đã sẵn sàng cho dự án này.</p>
                <p className="mt-1 text-sm text-d4u-text-2">Có hiệu lực đến {formatDate(activePackage.expiresAt)}.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricPill icon={<CreditCardOutlined />} label="Gói" value="Đang hoạt động" />
                <MetricPill icon={<CheckCircleFilled />} label="Hết hạn" value={formatDate(activePackage.expiresAt)} />
              </div>
            </div>
          </div>
        </section>
      )}

      {error && project ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <Card
        className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft"
        title={<span className="font-display text-lg font-semibold text-d4u-text-1">Kết quả gợi ý sinh viên</span>}
      >
        {!result ? (
          <Empty
            description={
              !activePackage
                ? 'Tính năng đang bị khóa vì chưa có gói.'
                : !canUseAiMatching
                  ? 'Dự án này đã qua giai đoạn tuyển chọn nên không còn dùng AI Matching.'
                  : 'Chưa có kết quả. Hãy chạy gợi ý AI để lấy danh sách gợi ý.'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            className="[&_.ant-list-item]:!border-0 [&_.ant-list-item]:!px-0 [&_.ant-list-item]:!pt-0 [&_.ant-list-item]:!pb-5 last:[&_.ant-list-item]:!pb-0"
            dataSource={result.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <RecommendationCard
                  item={item}
                  index={index}
                  application={applicationByStudentId[item.studentProfileId] || null}
                  activeOffer={activeOfferByStudentId[item.studentProfileId] || null}
                  canCreateOffer={Boolean(activePackage && project && canUseAiMatching)}
                  actingOfferStudentId={actingOfferStudentId}
                  onOpenOfferModal={openOfferModal}
                  onGoToOffers={() => navigate('/sme/offers')}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="Gửi đề nghị từ AI Matching"
        open={Boolean(selectedRecommendation)}
        footer={null}
        onCancel={closeOfferModal}
        destroyOnHidden
      >
        {selectedRecommendation ? (
          <div className="grid gap-4">
            <Alert
              type="info"
              showIcon
              className="form-alert"
              message="Student sẽ có thời gian phản hồi theo policy hiện có của hệ thống."
              description="Sau khi student chấp nhận, SME mới tiếp tục thanh toán escrow qua PayOS."
            />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Student">{selectedRecommendation.studentFullName}</Descriptions.Item>
              <Descriptions.Item label="Điểm phù hợp">{selectedRecommendation.matchScore}/100</Descriptions.Item>
              <Descriptions.Item label="Nguồn đề nghị">
                {applicationByStudentId[selectedRecommendation.studentProfileId]
                  ? 'Đề nghị gắn với ứng tuyển hiện có'
                  : 'Đề nghị trực tiếp từ AI Matching'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá đề xuất AI">
                {selectedRecommendation.proposedPrice
                  ? formatCurrency(selectedRecommendation.proposedPrice)
                  : 'Chưa có, hệ thống dùng ngân sách dự án để gợi ý mặc định'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngân sách dự án">
                {project ? formatCurrency(project.budgetAmount, project.currency) : 'Chưa có'}
              </Descriptions.Item>
            </Descriptions>

            <Form form={offerForm} layout="vertical" onFinish={createOfferFromMatching}>
              <Form.Item
                name="offeredAmount"
                label="Giá đề nghị"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá đề nghị.' },
                  {
                    validator: (_, value) => (
                      Number(value) > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Giá đề nghị phải lớn hơn 0.'))
                    )
                  }
                ]}
              >
                <InputNumber min={1} step={10000} style={{ width: '100%' }} />
              </Form.Item>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button onClick={closeOfferModal}>Hủy</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actingOfferStudentId === selectedRecommendation.studentProfileId}
                  className="!rounded-btn !bg-d4u-cyan !font-semibold hover:!bg-d4u-cyan-hover"
                >
                  Gửi đề nghị
                </Button>
              </div>
            </Form>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
