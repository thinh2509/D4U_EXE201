import {
  App,
  Alert,
  Button,
  Card,
  Empty,
  List,
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
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const { Paragraph, Text, Title } = Typography;

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="min-w-0">
      <strong className="block truncate text-sm font-semibold text-d4u-text-1">{title}</strong>
      {subtitle ? <div className="mt-1 text-xs text-d4u-text-3">{subtitle}</div> : null}
    </div>
  );
}

function renderDateCell(value) {
  return value ? <span className="text-sm font-medium text-d4u-text-2">{formatDate(value)}</span> : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function findActiveMatchingEntitlement(entitlements) {
  return entitlements.find((item) => item.status === 'ACTIVE' && item.entitlementCode === 'SME_AI_MATCHING');
}

function buildPurchaseActionLabel(purchase) {
  if (!purchase) return 'Mua gói & thanh toán';
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return 'Mở lại PayOS';
  return 'Thanh toán lại';
}

function getScoreTone(score) {
  if (score >= 85) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }

  if (score >= 70) {
    return 'bg-sky-50 text-sky-700 ring-sky-200';
  }

  if (score >= 55) {
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }

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
                Chạy gợi ý AI trực tiếp từ dự án để xem danh sách sinh viên được xếp hạng theo mức độ phù hợp, rồi quay lại luồng ứng tuyển và đề nghị khi cần.
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

function RecommendationCard({ item, index }) {
  const isTopMatch = index === 0;

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
      const [packageRows, purchaseRows, entitlementRows] = await Promise.all([
        packageApi.listPackages('SME'),
        packageApi.listMyPurchases(),
        packageApi.listMyEntitlements()
      ]);
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
                Gói hiện có hiệu lực đến <span className="font-semibold text-d4u-text-1">{formatDate(activePackage.expiresAt)}</span>. Bạn có thể mở tính năng gợi ý AI trực tiếp từ trang chi tiết dự án.
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
            <MetricPill icon={<TeamOutlined />} label="Dùng ngay" value="Từ trang chi tiết dự án" />
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState(null);
  const [entitlements, setEntitlements] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const activePackage = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);

  const loadContext = async () => {
    if (!projectId) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [projectResponse, entitlementResponse] = await Promise.all([
        projectApi.getProject(projectId),
        packageApi.listMyEntitlements()
      ]);
      setProject(projectResponse);
      setEntitlements(entitlementResponse);
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
    if (!projectId) return;

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
    if (!projectId || !activePackage || result || running || loading) return;
    runMatching();
  }, [activePackage, loading, projectId]);

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
              disabled={!projectId || !activePackage}
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
            description={activePackage ? 'Chưa có kết quả. Hãy chạy gợi ý AI để lấy danh sách gợi ý.' : 'Tính năng đang bị khóa vì chưa có gói.'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            className="[&_.ant-list-item]:!border-0 [&_.ant-list-item]:!px-0 [&_.ant-list-item]:!pt-0 [&_.ant-list-item]:!pb-5 last:[&_.ant-list-item]:!pb-0"
            dataSource={result.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <RecommendationCard item={item} index={index} />
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
}
