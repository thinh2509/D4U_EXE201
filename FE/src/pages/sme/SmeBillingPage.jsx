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
  if (activeEntitlement) return { label: 'Äang hoáº¡t Ä‘á»™ng', tone: 'success' };
  if (latestPurchase?.paymentStatus === 'PENDING') return { label: 'Chá» xÃ¡c nháº­n', tone: 'warning' };
  if (latestPurchase?.entitlementStatus === 'EXPIRED' || latestPurchase?.status === 'EXPIRED') {
    return { label: 'Háº¿t hiá»‡u lá»±c', tone: 'neutral' };
  }
  if (profile?.isFreePlan) return { label: 'Äang dÃ¹ng gÃ³i Free', tone: 'info' };
  return { label: 'ChÆ°a kÃ­ch hoáº¡t', tone: 'neutral' };
}

function getSmeProjectLimit(profile) {
  const activeCount = profile?.activeOpenProjectCount ?? 0;
  const maxCount = profile?.effectiveMaxActiveOpenProjects ?? (profile?.isFreePlan ? 2 : null);

  if (maxCount == null) return `${activeCount} dá»± Ã¡n Ä‘ang má»Ÿ`;
  return `${activeCount}/${maxCount} dá»± Ã¡n Ä‘ang má»Ÿ`;
}

function getSmeBudgetLimit(profile) {
  const maxBudget = profile?.subscriptionPlan?.maxProjectBudget;

  if (maxBudget == null) return 'Kh?ng gi?i h?n ng?n s?ch';
  return `T?i ?a ${formatCurrency(maxBudget, 'VND')} / d? ?n`;
}

function getSmePlanName(profile, activeEntitlement, featuredPackage) {
  if (activeEntitlement?.packageName) return activeEntitlement.packageName;
  if (profile?.isFreePlan) return 'GÃ³i Free';
  if (featuredPackage?.code === 'SME_GROWTH_30D' || featuredPackage?.code === 'SME_AI_MATCHING_30D') {
    return 'SME AI Growth 30 ngÃ y';
  }
  if (featuredPackage?.name) return featuredPackage.name;
  return 'SME AI Growth 30 ngÃ y';
}

function getSmePlanPrice(profile, activeEntitlement, featuredPackage) {
  if (activeEntitlement?.price != null) {
    return `${formatCurrency(activeEntitlement.price, activeEntitlement.currency)}/30 ngÃ y`;
  }
  if (profile?.isFreePlan) return '0 VND';
  if (featuredPackage?.price != null) {
    return `${formatCurrency(featuredPackage.price, featuredPackage.currency)}/30 ngÃ y`;
  }
  return 'ChÆ°a cÃ³';
}

function getSmeExpiry(profile, activeEntitlement, latestPurchase) {
  if (activeEntitlement?.expiresAt) return formatDate(activeEntitlement.expiresAt);
  if (latestPurchase?.paymentStatus === 'PENDING') return 'Sáº½ cáº­p nháº­t sau khi thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n';
  if (profile?.isFreePlan) return 'KhÃ´ng háº¿t háº¡n';
  return 'Hiá»‡n chÆ°a cÃ³ gÃ³i hoáº¡t Ä‘á»™ng';
}

function getSmeSummaryDescription(profile, activeEntitlement, latestPurchase) {
  if (activeEntitlement) {
    return `GÃ³i hiá»‡n cÃ³ hiá»‡u lá»±c Ä‘áº¿n ${formatDate(activeEntitlement.expiresAt)}. Báº¡n cÃ³ thá»ƒ dÃ¹ng AI Matching vÃ  má»Ÿ rá»™ng giá»›i háº¡n dá»± Ã¡n Ä‘ang má»Ÿ ngay trong workspace SME.`;
  }
  if (latestPurchase?.paymentStatus === 'PENDING') {
    return 'Giao dá»‹ch cá»§a báº¡n Ä‘ang chá» xÃ¡c nháº­n thanh toÃ¡n. TÃ­nh nÄƒng AI Matching vÃ  giá»›i háº¡n má»Ÿ rá»™ng sáº½ chá»‰ báº­t sau khi há»‡ thá»‘ng ghi nháº­n thanh toÃ¡n thÃ nh cÃ´ng.';
  }
  if (profile?.isFreePlan) {
    return `B?n ?ang ? g?i Free v?i gi?i h?n c? b?n: ${getSmeProjectLimit(profile)} v? ${getSmeBudgetLimit(profile)}. N?ng c?p ?? m? AI Matching v? v?n h?nh project ng?n s?ch cao h?n.`;
  }
  return 'Mua gÃ³i SME AI Growth Ä‘á»ƒ má»Ÿ AI Matching, tÄƒng giá»›i háº¡n dá»± Ã¡n Ä‘ang má»Ÿ vÃ  váº­n hÃ nh pipeline tuyá»ƒn chá»n rÃµ rÃ ng hÆ¡n.';
}

function getSmePlanDescription(featuredPackage) {
  if (featuredPackage?.code === 'SME_AI_MATCHING_30D' || featuredPackage?.code === 'SME_GROWTH_30D') {
    return 'Má»Ÿ AI Matching trong 30 ngÃ y Ä‘á»ƒ gá»£i Ã½ Student phÃ¹ há»£p hÆ¡n, Ä‘á»“ng thá»i tÄƒng giá»›i háº¡n sá»‘ dá»± Ã¡n Ä‘ang má»Ÿ cho SME.';
  }
  if (featuredPackage?.description) return featuredPackage.description;
  return 'GÃ³i tráº£ phÃ­ dÃ nh cho SME muá»‘n má»Ÿ AI Matching vÃ  váº­n hÃ nh nhiá»u dá»± Ã¡n Ä‘ang má»Ÿ hÆ¡n trong cÃ¹ng má»™t giai Ä‘oáº¡n.';
}

function SmeBillingSummary({ profile, activeEntitlement, latestPurchase, featuredPackage }) {
  const status = buildSmeSummaryStatus(profile, activeEntitlement, latestPurchase);

  return (
    <BillingSummaryHero
      badges={[
        { tone: status.tone, label: status.label },
        { tone: 'info', label: 'AI Matching', icon: <ThunderboltOutlined /> },
        { tone: 'neutral', label: getSmeProjectLimit(profile), icon: <RocketOutlined /> },
        { tone: 'neutral', label: getSmeBudgetLimit(profile), icon: <FileSearchOutlined /> },
      ]}
      title={getSmePlanName(profile, activeEntitlement, featuredPackage)}
      description={getSmeSummaryDescription(profile, activeEntitlement, latestPurchase)}
      stats={[
        { label: 'Tráº¡ng thÃ¡i', value: status.label },
        { label: 'GiÃ¡ gÃ³i', value: getSmePlanPrice(profile, activeEntitlement, featuredPackage) },
        { label: 'Hiá»‡u lá»±c Ä‘áº¿n', value: getSmeExpiry(profile, activeEntitlement, latestPurchase) },
        { label: 'Dá»± Ã¡n Ä‘ang má»Ÿ', value: getSmeProjectLimit(profile) },
        { label: 'Ngân sách tối đa', value: getSmeBudgetLimit(profile) },
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
      title={featuredPackage.name || 'SME AI Growth 30 ngÃ y'}
      description={getSmePlanDescription(featuredPackage)}
      features={[
        {
          icon: <ThunderboltOutlined />,
          label: 'Má»Ÿ khÃ³a AI Matching cho doanh nghiá»‡p',
          description: 'DÃ¹ng gá»£i Ã½ AI trÃªn tá»«ng dá»± Ã¡n Ä‘á»ƒ tÃ¬m Student phÃ¹ há»£p nhanh hÆ¡n vÃ  giáº£m thá»i gian lá»c há»“ sÆ¡ thá»§ cÃ´ng.',
        },
        {
          icon: <PlusCircleOutlined />,
          label: 'TÄƒng giá»›i háº¡n dá»± Ã¡n Ä‘ang má»Ÿ',
          description: `Cho phÃ©p váº­n hÃ nh tá»‘i Ä‘a ${featuredPackage.maxActiveOpenProjectsOverride || 10} dá»± Ã¡n Ä‘ang má»Ÿ cÃ¹ng lÃºc trong thá»i háº¡n gÃ³i.`,
        },
        {
          icon: <SafetyCertificateOutlined />,
          label: 'Chá»‰ kÃ­ch hoáº¡t sau khi thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n',
          description: 'Há»‡ thá»‘ng chá»‰ má»Ÿ quyá»n dÃ¹ng gÃ³i khi giao dá»‹ch Ä‘Æ°á»£c xÃ¡c nháº­n thÃ nh cÃ´ng, khÃ´ng kÃ­ch hoáº¡t theo tráº¡ng thÃ¡i táº¡m.',
        },
      ]}
      metrics={[
        { icon: billingIcons.duration, label: 'Hiá»‡u lá»±c', value: `${featuredPackage.durationDays ?? 30} ngÃ y` },
        { icon: <FileSearchOutlined />, label: 'Project limit', value: `${featuredPackage.maxActiveOpenProjectsOverride || 10} dá»± Ã¡n` },
        { icon: billingIcons.payment, label: 'Thanh toÃ¡n', value: latestPurchase?.paymentStatus || 'ChÆ°a cÃ³' },
      ]}
      sideLabel="GiÃ¡ gÃ³i"
      sideValue={formatCurrency(featuredPackage.price, featuredPackage.currency)}
      sideSuffix="/30 ngÃ y"
      sideStatusLabel="Tráº¡ng thÃ¡i hiá»‡n táº¡i"
      sideStatusValue={status.label}
      sideStatusTone={status.tone}
      sideHighlights={[
        'AI Matching cho tá»«ng dá»± Ã¡n SME',
        `Tá»‘i Ä‘a ${featuredPackage.maxActiveOpenProjectsOverride || 10} dá»± Ã¡n Ä‘ang má»Ÿ cÃ¹ng lÃºc`,
        'Tá»± cáº­p nháº­t ngay sau khi thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n',
      ]}
      extraContent={(
        <div className="rounded-2xl border border-d4u-border/70 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-d4u-text-3">Äiá»u kiá»‡n kÃ­ch hoáº¡t</p>
            {activeEntitlement?.expiresAt ? <BillingPill tone="success">Hiá»‡u lá»±c Ä‘áº¿n {formatDate(activeEntitlement.expiresAt)}</BillingPill> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-d4u-text-2">
            Sau khi thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n, quyá»n dÃ¹ng AI Matching vÃ  giá»›i háº¡n dá»± Ã¡n Ä‘ang má»Ÿ má»›i Ä‘Æ°á»£c cáº­p nháº­t vÃ o tÃ i khoáº£n SME.
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
          Mua gÃ³i
        </Button>
      ) : null}

      {shouldShowBillingRetryPurchase(latestPurchase) ? (
        <Button
          className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
          loading={actingPurchaseId === latestPurchase.id}
          onClick={() => onReopenPurchasePayment(latestPurchase)}
        >
          {buildBillingPurchaseActionLabel(latestPurchase, {
            defaultLabel: 'Mua gÃ³i',
            reopenLabel: 'Má»Ÿ láº¡i PayOS',
            retryLabel: 'Thanh toÃ¡n láº¡i',
          })}
        </Button>
      ) : null}
    </BillingPlanCard>
  );
}

function SmeBillingHistory({ purchases, loading, actingPurchaseId, onReopenPurchasePayment }) {
  return (
    <BillingHistorySection
      eyebrow="Lá»‹ch sá»­ thanh toÃ¡n"
      title="Lá»‹ch sá»­ mua gÃ³i"
      description="Theo dÃµi giao dá»‹ch gáº§n nháº¥t cá»§a SME Ä‘á»ƒ biáº¿t gÃ³i nÃ o Ä‘Ã£ kÃ­ch hoáº¡t, gÃ³i nÃ o Ä‘ang chá» xÃ¡c nháº­n vÃ  giao dá»‹ch nÃ o cáº§n má»Ÿ láº¡i thanh toÃ¡n."
      purchases={purchases}
      loading={loading}
      emptyText="ChÆ°a cÃ³ giao dá»‹ch mua gÃ³i nÃ o."
      columns={[
        {
          title: 'GÃ³i',
          dataIndex: 'packageName',
          width: 240,
          render: (value, row) => renderBillingPrimaryCell(value, row.createdAt ? `Mua ngÃ y ${formatDate(row.createdAt)}` : null),
        },
        {
          title: 'Tráº¡ng thÃ¡i',
          dataIndex: 'status',
          width: 150,
          render: (value) => {
            const mapped = buildBillingStatusMap(value, 'purchase');
            return <BillingPill tone={mapped.tone}>{mapped.label}</BillingPill>;
          },
        },
        {
          title: 'Thanh toÃ¡n',
          dataIndex: 'paymentStatus',
          width: 170,
          render: (value) => {
            const mapped = buildBillingStatusMap(value, 'payment');
            return <BillingPill tone={mapped.tone}>{mapped.label}</BillingPill>;
          },
        },
        {
          title: 'Sá»‘ tiá»n',
          dataIndex: 'price',
          width: 150,
          render: (value, row) => <span className="text-[15px] font-bold text-d4u-teal-deep">{formatCurrency(value, row.currency)}</span>,
        },
        {
          title: 'Háº¡n dÃ¹ng',
          dataIndex: 'expiresAt',
          width: 180,
          render: (value) => renderBillingDateCell(value, 'ChÆ°a kÃ­ch hoáº¡t'),
        },
        {
          title: 'Thao tÃ¡c',
          width: 170,
          render: (_, row) => (
            shouldShowBillingRetryPurchase(row) ? (
              <Button
                className="!rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                loading={actingPurchaseId === row.id}
                onClick={() => onReopenPurchasePayment(row)}
              >
                {buildBillingPurchaseActionLabel(row, {
                  defaultLabel: 'Mua gÃ³i',
                  reopenLabel: 'Má»Ÿ láº¡i PayOS',
                  retryLabel: 'Thanh toÃ¡n láº¡i',
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
      setError(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u gÃ³i SME.'));
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
      message.success('ÄÃ£ táº¡o giao dá»‹ch thanh toÃ¡n cho gÃ³i SME AI Growth.');
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ táº¡o giao dá»‹ch mua gÃ³i.'));
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
      setError(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ má»Ÿ láº¡i thanh toÃ¡n cho gÃ³i.'));
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
        title="GÃ³i & thanh toÃ¡n"
        description="Quáº£n lÃ½ gÃ³i Free vÃ  gÃ³i tráº£ phÃ­ cá»§a SME Ä‘á»ƒ má»Ÿ AI Matching, theo dÃµi giá»›i háº¡n dá»± Ã¡n Ä‘ang má»Ÿ vÃ  xem láº¡i cÃ¡c giao dá»‹ch gáº§n nháº¥t."
        extra={<BillingRefreshButton onClick={loadData} />}
      />

      {!profile ? (
        <BillingInfoAlert
          message="Báº¡n váº«n cÃ³ thá»ƒ xem gÃ³i vÃ  giao dá»‹ch ngay tá»« bÃ¢y giá»."
          description="Äá»ƒ dÃ¹ng Ä‘áº§y Ä‘á»§ workflow SME nhÆ° táº¡o dá»± Ã¡n, theo dÃµi offer vÃ  váº­n hÃ nh dashboard, báº¡n váº«n cáº§n hoÃ n thiá»‡n há»“ sÆ¡ doanh nghiá»‡p."
        />
      ) : null}

      {activeEntitlement ? (
        <BillingSuccessAlert
          message="GÃ³i SME cá»§a báº¡n Ä‘ang hoáº¡t Ä‘á»™ng."
          description={`AI Matching vÃ  giá»›i háº¡n váº­n hÃ nh má»Ÿ rá»™ng hiá»‡n cÃ³ hiá»‡u lá»±c Ä‘áº¿n ${formatDate(activeEntitlement.expiresAt)}.`}
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus === 'PENDING' ? (
        <BillingInfoAlert
          message="Thanh toÃ¡n cá»§a báº¡n Ä‘ang chá» xÃ¡c nháº­n."
          description="GÃ³i chá»‰ Ä‘Æ°á»£c kÃ­ch hoáº¡t sau khi thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n thÃ nh cÃ´ng. Náº¿u cáº§n, báº¡n cÃ³ thá»ƒ má»Ÿ láº¡i phiÃªn thanh toÃ¡n hiá»‡n táº¡i."
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus !== 'PENDING' ? (
        <BillingInfoAlert
          message={profile?.isFreePlan ? 'Báº¡n Ä‘ang dÃ¹ng gÃ³i Free.' : 'Hiá»‡n chÆ°a cÃ³ gÃ³i SME Ä‘ang hoáº¡t Ä‘á»™ng.'}
          description={`B?n c? th? ti?p t?c d?ng g?i Free v?i gi?i h?n c? b?n: ${getSmeProjectLimit(profile)} v? ${getSmeBudgetLimit(profile)}. N?ng c?p ?? m? AI Matching v? t?ng kh? n?ng publish project.`}
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
          <BillingPill tone="neutral">Free hi?n t?i ph? h?p ?? b?t ??u: t?i ?a 2 d? ?n ?ang m? v? budget 5.000.000? cho m?i project.</BillingPill>
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
