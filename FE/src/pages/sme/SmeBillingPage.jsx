import {
  CreditCardOutlined,
  FileSearchOutlined,
  PlusCircleOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { App, Button } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { packageApi } from '../../services/packageApi.js';
import { profileApi } from '../../services/profileApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import {
  BillingErrorAlert,
  BillingHistorySection,
  BillingInfoAlert,
  BillingPlanCard,
  BillingRefreshButton,
  BillingSuccessAlert,
  BillingSummaryHero,
  BillingPill,
  buildBillingPurchaseActionLabel,
  buildBillingStatusMap,
  billingIcons,
  renderBillingDateCell,
  renderBillingPrimaryCell,
  shouldShowBillingRetryPurchase,
} from '../shared/BillingUi.jsx';

function findActiveMatchingEntitlement(entitlements) {
  return entitlements.find((item) => item.status === 'ACTIVE' && item.entitlementCode === 'SME_AI_MATCHING') || null;
}

function buildSmeSummaryStatus(profile, activeEntitlement, latestPurchase) {
  if (activeEntitlement) return { label: 'Đang hoạt động', tone: 'success' };
  if (latestPurchase?.paymentStatus === 'PENDING') return { label: 'Chờ xác nhận', tone: 'warning' };
  if (latestPurchase?.entitlementStatus === 'EXPIRED' || latestPurchase?.status === 'EXPIRED') {
    return { label: 'Hết hiệu lực', tone: 'neutral' };
  }
  if (profile?.isFreePlan) return { label: 'Đang dùng gói Free', tone: 'info' };
  return { label: 'Chưa kích hoạt', tone: 'neutral' };
}

function getSmeProjectLimit(profile) {
  const activeCount = profile?.activeOpenProjectCount ?? 0;
  const maxCount = profile?.effectiveMaxActiveOpenProjects ?? (profile?.isFreePlan ? 2 : null);

  if (maxCount == null) return `${activeCount} dự án đang mở`;
  return `${activeCount}/${maxCount} dự án đang mở`;
}

function getSmePlanName(profile, activeEntitlement, featuredPackage) {
  if (activeEntitlement?.packageName) return activeEntitlement.packageName;
  if (profile?.isFreePlan) return 'Gói Free';
  if (featuredPackage?.code === 'SME_GROWTH_30D' || featuredPackage?.code === 'SME_AI_MATCHING_30D') {
    return 'SME AI Growth 30 ngày';
  }
  if (featuredPackage?.name) return featuredPackage.name;
  return 'SME AI Growth 30 ngày';
}

function getSmePlanPrice(profile, activeEntitlement, featuredPackage) {
  if (activeEntitlement?.price != null) {
    return `${formatCurrency(activeEntitlement.price, activeEntitlement.currency)}/30 ngày`;
  }
  if (profile?.isFreePlan) return '0 VND';
  if (featuredPackage?.price != null) {
    return `${formatCurrency(featuredPackage.price, featuredPackage.currency)}/30 ngày`;
  }
  return 'Chưa có';
}

function getSmeExpiry(profile, activeEntitlement, latestPurchase) {
  if (activeEntitlement?.expiresAt) return formatDate(activeEntitlement.expiresAt);
  if (latestPurchase?.paymentStatus === 'PENDING') return 'Sẽ cập nhật sau khi thanh toán được xác nhận';
  if (profile?.isFreePlan) return 'Không hết hạn';
  return 'Hiện chưa có gói hoạt động';
}

function getSmeSummaryDescription(profile, activeEntitlement, latestPurchase) {
  if (activeEntitlement) {
    return `Gói hiện có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}. Bạn có thể dùng AI Matching và mở rộng giới hạn dự án đang mở ngay trong workspace SME.`;
  }
  if (latestPurchase?.paymentStatus === 'PENDING') {
    return 'Giao dịch của bạn đang chờ xác nhận thanh toán. Tính năng AI Matching và giới hạn mở rộng sẽ chỉ bật sau khi hệ thống ghi nhận thanh toán thành công.';
  }
  if (profile?.isFreePlan) {
    return 'Bạn đang ở gói Free với giới hạn vận hành cơ bản. Nâng cấp để mở AI Matching và tăng số dự án đang mở cho doanh nghiệp.';
  }
  return 'Mua gói SME AI Growth để mở AI Matching, tăng giới hạn dự án đang mở và vận hành pipeline tuyển chọn rõ ràng hơn.';
}

function getSmePlanDescription(featuredPackage) {
  if (featuredPackage?.code === 'SME_AI_MATCHING_30D' || featuredPackage?.code === 'SME_GROWTH_30D') {
    return 'Mở AI Matching trong 30 ngày để gợi ý Student phù hợp hơn, đồng thời tăng giới hạn số dự án đang mở cho SME.';
  }
  if (featuredPackage?.description) return featuredPackage.description;
  return 'Gói trả phí dành cho SME muốn mở AI Matching và vận hành nhiều dự án đang mở hơn trong cùng một giai đoạn.';
}

function SmeBillingSummary({ profile, activeEntitlement, latestPurchase, featuredPackage }) {
  const status = buildSmeSummaryStatus(profile, activeEntitlement, latestPurchase);

  return (
    <BillingSummaryHero
      badges={[
        { tone: status.tone, label: status.label },
        { tone: 'info', label: 'AI Matching', icon: <ThunderboltOutlined /> },
        { tone: 'neutral', label: getSmeProjectLimit(profile), icon: <RocketOutlined /> },
      ]}
      title={getSmePlanName(profile, activeEntitlement, featuredPackage)}
      description={getSmeSummaryDescription(profile, activeEntitlement, latestPurchase)}
      stats={[
        { label: 'Trạng thái', value: status.label },
        { label: 'Giá gói', value: getSmePlanPrice(profile, activeEntitlement, featuredPackage) },
        { label: 'Hiệu lực đến', value: getSmeExpiry(profile, activeEntitlement, latestPurchase) },
        { label: 'Dự án đang mở', value: getSmeProjectLimit(profile) },
      ]}
    />
  );
}

function SmeBillingPlanCard({
  featuredPackage,
  activeEntitlement,
  latestPurchase,
  actingPackageId,
  actingPurchaseId,
  onStartPurchase,
  onReopenPurchasePayment,
}) {
  if (!featuredPackage) return null;

  const isActive = activeEntitlement?.packageId === featuredPackage.id;
  const status = buildSmeSummaryStatus(null, isActive ? activeEntitlement : null, latestPurchase);

  return (
    <BillingPlanCard
      status={status}
      audienceLabel="SME Growth"
      title={featuredPackage.name || 'SME AI Growth 30 ngày'}
      description={getSmePlanDescription(featuredPackage)}
      features={[
        {
          icon: <ThunderboltOutlined />,
          label: 'Mở khóa AI Matching cho doanh nghiệp',
          description: 'Dùng gợi ý AI trên từng dự án để tìm Student phù hợp nhanh hơn và giảm thời gian lọc hồ sơ thủ công.',
        },
        {
          icon: <PlusCircleOutlined />,
          label: 'Tăng giới hạn dự án đang mở',
          description: `Cho phép vận hành tối đa ${featuredPackage.maxActiveOpenProjectsOverride || 10} dự án đang mở cùng lúc trong thời hạn gói.`,
        },
        {
          icon: <SafetyCertificateOutlined />,
          label: 'Chỉ kích hoạt sau khi thanh toán được xác nhận',
          description: 'Hệ thống chỉ mở quyền dùng gói khi giao dịch được xác nhận thành công, không kích hoạt theo trạng thái tạm.',
        },
      ]}
      metrics={[
        { icon: billingIcons.duration, label: 'Hiệu lực', value: `${featuredPackage.durationDays ?? 30} ngày` },
        { icon: <FileSearchOutlined />, label: 'Project limit', value: `${featuredPackage.maxActiveOpenProjectsOverride || 10} dự án` },
        { icon: billingIcons.payment, label: 'Thanh toán', value: latestPurchase?.paymentStatus || 'Chưa có' },
      ]}
      sideLabel="Giá gói"
      sideValue={formatCurrency(featuredPackage.price, featuredPackage.currency)}
      sideSuffix="/30 ngày"
      sideStatusLabel="Trạng thái hiện tại"
      sideStatusValue={status.label}
      sideStatusTone={status.tone}
      sideHighlights={[
        'AI Matching cho từng dự án SME',
        `Tối đa ${featuredPackage.maxActiveOpenProjectsOverride || 10} dự án đang mở cùng lúc`,
        'Tự cập nhật ngay sau khi thanh toán được xác nhận',
      ]}
      extraContent={(
        <div className="rounded-2xl border border-d4u-border/70 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-d4u-text-3">Điều kiện kích hoạt</p>
            {activeEntitlement?.expiresAt ? <BillingPill tone="success">Hiệu lực đến {formatDate(activeEntitlement.expiresAt)}</BillingPill> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-d4u-text-2">
            Sau khi thanh toán được xác nhận, quyền dùng AI Matching và giới hạn dự án đang mở mới được cập nhật vào tài khoản SME.
          </p>
        </div>
      )}
    >
      {!isActive && !shouldShowBillingRetryPurchase(latestPurchase) ? (
        <Button
          type="primary"
          className="!h-11 !rounded-btn !font-semibold"
          loading={actingPackageId === featuredPackage.id}
          onClick={() => onStartPurchase(featuredPackage)}
        >
          Mua gói
        </Button>
      ) : null}

      {shouldShowBillingRetryPurchase(latestPurchase) ? (
        <Button
          className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
          loading={actingPurchaseId === latestPurchase.id}
          onClick={() => onReopenPurchasePayment(latestPurchase)}
        >
          {buildBillingPurchaseActionLabel(latestPurchase, {
            defaultLabel: 'Mua gói',
            reopenLabel: 'Mở lại PayOS',
            retryLabel: 'Thanh toán lại',
          })}
        </Button>
      ) : null}
    </BillingPlanCard>
  );
}

function SmeBillingHistory({ purchases, loading, actingPurchaseId, onReopenPurchasePayment }) {
  return (
    <BillingHistorySection
      eyebrow="Lịch sử thanh toán"
      title="Lịch sử mua gói"
      description="Theo dõi giao dịch gần nhất của SME để biết gói nào đã kích hoạt, gói nào đang chờ xác nhận và giao dịch nào cần mở lại thanh toán."
      purchases={purchases}
      loading={loading}
      emptyText="Chưa có giao dịch mua gói nào."
      columns={[
        {
          title: 'Gói',
          dataIndex: 'packageName',
          width: 240,
          render: (value, row) => renderBillingPrimaryCell(value, row.createdAt ? `Mua ngày ${formatDate(row.createdAt)}` : null),
        },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          width: 150,
          render: (value) => {
            const mapped = buildBillingStatusMap(value, 'purchase');
            return <BillingPill tone={mapped.tone}>{mapped.label}</BillingPill>;
          },
        },
        {
          title: 'Thanh toán',
          dataIndex: 'paymentStatus',
          width: 170,
          render: (value) => {
            const mapped = buildBillingStatusMap(value, 'payment');
            return <BillingPill tone={mapped.tone}>{mapped.label}</BillingPill>;
          },
        },
        {
          title: 'Số tiền',
          dataIndex: 'price',
          width: 150,
          render: (value, row) => <span className="text-[15px] font-bold text-d4u-teal-deep">{formatCurrency(value, row.currency)}</span>,
        },
        {
          title: 'Hạn dùng',
          dataIndex: 'expiresAt',
          width: 180,
          render: (value) => renderBillingDateCell(value, 'Chưa kích hoạt'),
        },
        {
          title: 'Thao tác',
          width: 170,
          render: (_, row) => (
            shouldShowBillingRetryPurchase(row) ? (
              <Button
                className="!rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                loading={actingPurchaseId === row.id}
                onClick={() => onReopenPurchasePayment(row)}
              >
                {buildBillingPurchaseActionLabel(row, {
                  defaultLabel: 'Mua gói',
                  reopenLabel: 'Mở lại PayOS',
                  retryLabel: 'Thanh toán lại',
                })}
              </Button>
            ) : null
          ),
        },
      ]}
    />
  );
}

export function SmeBillingPage() {
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

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileResponse, packageRows, purchaseRows, entitlementRows] = await Promise.all([
        profileApi.getSmeProfile().catch((requestError) => {
          if (requestError?.response?.status === 404) return null;
          throw requestError;
        }),
        packageApi.listPackages('SME'),
        packageApi.listMyPurchases(),
        packageApi.listMyEntitlements(),
      ]);

      setProfile(profileResponse);
      setPackages(packageRows);
      setPurchases(
        purchaseRows
          .filter((purchase) => purchase.role === 'SME')
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      );
      setEntitlements(entitlementRows.filter((item) => item.entitlementCode === 'SME_AI_MATCHING'));
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

  const featuredPackage = useMemo(
    () => packages.find((pkg) => pkg.maxActiveOpenProjectsOverride) || packages[0] || null,
    [packages]
  );
  const activeEntitlement = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);
  const latestPurchase = useMemo(() => {
    if (!featuredPackage) return purchases[0] || null;
    return purchases.find((purchase) => purchase.packageId === featuredPackage.id) || purchases[0] || null;
  }, [featuredPackage, purchases]);

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
      message.success('Đã tạo giao dịch thanh toán cho gói SME AI Growth.');
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
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán cho gói.'));
    } finally {
      setActingPurchaseId(null);
    }
  };

  if (error && !packages.length && !loading) {
    return <ErrorState description={error} onRetry={loadData} />;
  }

  return (
    <>
      <PageHeader
        icon={<CreditCardOutlined />}
        title="Gói & thanh toán"
        description="Quản lý gói Free và gói trả phí của SME để mở AI Matching, theo dõi giới hạn dự án đang mở và xem lại các giao dịch gần nhất."
        extra={<BillingRefreshButton onClick={loadData} />}
      />

      {!profile ? (
        <BillingInfoAlert
          message="Bạn vẫn có thể xem gói và giao dịch ngay từ bây giờ."
          description="Để dùng đầy đủ workflow SME như tạo dự án, theo dõi offer và vận hành dashboard, bạn vẫn cần hoàn thiện hồ sơ doanh nghiệp."
        />
      ) : null}

      {activeEntitlement ? (
        <BillingSuccessAlert
          message="Gói SME của bạn đang hoạt động."
          description={`AI Matching và giới hạn vận hành mở rộng hiện có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}.`}
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus === 'PENDING' ? (
        <BillingInfoAlert
          message="Thanh toán của bạn đang chờ xác nhận."
          description="Gói chỉ được kích hoạt sau khi thanh toán được xác nhận thành công. Nếu cần, bạn có thể mở lại phiên thanh toán hiện tại."
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus !== 'PENDING' ? (
        <BillingInfoAlert
          message={profile?.isFreePlan ? 'Bạn đang dùng gói Free.' : 'Hiện chưa có gói SME đang hoạt động.'}
          description="Bạn có thể tiếp tục dùng gói Free với giới hạn cơ bản, hoặc nâng cấp để mở AI Matching và tăng giới hạn dự án đang mở."
        />
      ) : null}

      <BillingErrorAlert message={error} />

      <SmeBillingSummary
        profile={profile}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
        featuredPackage={featuredPackage}
      />

      <SmeBillingPlanCard
        featuredPackage={featuredPackage}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
        actingPackageId={actingPackageId}
        actingPurchaseId={actingPurchaseId}
        onStartPurchase={startPurchase}
        onReopenPurchasePayment={reopenPurchasePayment}
      />

      {profile?.isFreePlan && !activeEntitlement ? (
        <div className="mt-4">
          <BillingPill tone="neutral">Free hiện tại phù hợp để bắt đầu, còn gói trả phí dành cho SME muốn mở rộng pipeline và số dự án đang vận hành.</BillingPill>
        </div>
      ) : null}

      <SmeBillingHistory
        purchases={purchases}
        loading={loading}
        actingPurchaseId={actingPurchaseId}
        onReopenPurchasePayment={reopenPurchasePayment}
      />
    </>
  );
}
