import {
  CreditCardOutlined,
  EditOutlined,
  HistoryOutlined,
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
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import {
  BILLING_UNLIMITED_USAGE_THRESHOLD,
  BillingErrorAlert,
  BillingHistorySection,
  BillingInfoAlert,
  BillingPlanCard,
  BillingRefreshButton,
  BillingSuccessAlert,
  BillingSummaryHero,
  BillingUsagePanel,
  buildBillingPurchaseActionLabel,
  buildBillingStatusMap,
  buildGenericBillingStatus,
  billingIcons,
  renderBillingDateCell,
  renderBillingPrimaryCell,
  renderBillingStatusOrFallback,
  shouldShowBillingRetryPurchase,
} from '../shared/BillingUi.jsx';

const STUDENT_PACKAGE_CODE = 'STUDENT_AI_MATCHING_30D';
const STUDENT_ENTITLEMENT_CODE = 'STUDENT_AI_MATCHING';

function formatStudentUsageSummary(entitlement) {
  if (!entitlement) return 'Chưa kích hoạt';
  if (entitlement.usageLimit == null || entitlement.usageLimit >= BILLING_UNLIMITED_USAGE_THRESHOLD) {
    return 'AI Pro';
  }

  const remaining = Math.max(0, entitlement.usageLimit - entitlement.usageConsumed);
  return `Còn ${remaining} lượt`;
}

function formatStudentUsageDetail(entitlement) {
  if (!entitlement) return '30 lượt trong 30 ngày sau khi gói được kích hoạt.';
  if (entitlement.usageLimit == null || entitlement.usageLimit >= BILLING_UNLIMITED_USAGE_THRESHOLD) {
    return 'Bạn đang ở trạng thái AI Pro, không áp dụng giới hạn lượt dùng hiển thị trên màn này.';
  }

  const remaining = Math.max(0, entitlement.usageLimit - entitlement.usageConsumed);
  return `Đã dùng ${entitlement.usageConsumed}/${entitlement.usageLimit} lượt. Bạn còn ${remaining} lượt để tạo proposal nháp bằng AI.`;
}

function getStudentUsageProgress(entitlement) {
  if (!entitlement || entitlement.usageLimit == null || entitlement.usageLimit >= BILLING_UNLIMITED_USAGE_THRESHOLD) {
    return null;
  }

  if (entitlement.usageLimit <= 0) return 0;
  return Math.min(100, Math.round((entitlement.usageConsumed / entitlement.usageLimit) * 100));
}

function getStudentPackageName(aiPackage) {
  return aiPackage?.name || 'Gói AI Student 30 ngày';
}

function getStudentSummaryDescription(activeEntitlement, latestPurchase) {
  if (activeEntitlement) {
    return `Gói hiện có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}. Bạn có thể tiếp tục dùng AI Proposal Writer để tạo proposal nháp ngay trong luồng ứng tuyển.`;
  }

  if (latestPurchase?.paymentStatus === 'PENDING') {
    return 'Giao dịch của bạn đang chờ xác nhận thanh toán. Quyền dùng AI sẽ được cập nhật tự động ngay sau khi hệ thống ghi nhận thanh toán thành công.';
  }

  return 'Mở khóa AI Proposal Writer trong 30 ngày để lên proposal nháp nhanh hơn, bám sát brief dự án và tận dụng dữ liệu hồ sơ năng lực của bạn.';
}

function StudentBillingSummary({ aiPackage, activeEntitlement, latestPurchase }) {
  const status = buildGenericBillingStatus(Boolean(activeEntitlement), latestPurchase);

  return (
    <BillingSummaryHero
      badges={[
        { tone: status.tone, label: status.label },
        { tone: 'info', label: 'AI Proposal Writer', icon: <ThunderboltOutlined /> },
        { tone: 'neutral', label: `${aiPackage?.durationDays ?? 30} ngày`, icon: <RocketOutlined /> },
      ]}
      title={getStudentPackageName(aiPackage)}
      description={getStudentSummaryDescription(activeEntitlement, latestPurchase)}
      stats={[
        { label: 'Trạng thái', value: status.label },
        { label: 'Giá gói', value: aiPackage ? `${formatCurrency(aiPackage.price, aiPackage.currency)}/30 ngày` : 'Chưa có' },
        { label: 'Hiệu lực đến', value: activeEntitlement ? formatDate(activeEntitlement.expiresAt) : 'Hiện chưa có gói hoạt động' },
        { label: 'Lượt AI còn lại', value: formatStudentUsageSummary(activeEntitlement) },
      ]}
    />
  );
}

function StudentBillingPlanCard({
  aiPackage,
  activeEntitlement,
  latestPurchase,
  actingPackageId,
  actingPurchaseId,
  onStartPurchase,
  onReopenPurchasePayment,
}) {
  const status = buildGenericBillingStatus(Boolean(activeEntitlement), latestPurchase);

  return (
    <BillingPlanCard
      status={status}
      audienceLabel="Student AI"
      title={getStudentPackageName(aiPackage)}
      description="Gói này dành cho Student muốn chuẩn bị proposal nhanh hơn nhưng vẫn giữ toàn quyền chỉnh sửa trước khi gửi cho SME."
      features={[
        {
          icon: <ThunderboltOutlined />,
          label: 'Tạo proposal nháp trong luồng ứng tuyển',
          description: 'Bạn có thể gọi AI ngay khi ứng tuyển để lấy bản nháp đầu tiên, không cần rời khỏi flow hiện tại.',
        },
        {
          icon: <EditOutlined />,
          label: 'Nội dung vẫn do bạn quyết định',
          description: 'AI chỉ hỗ trợ bản nháp. Bạn luôn là người chỉnh sửa, chọn giọng điệu và gửi phiên bản cuối cùng.',
        },
        {
          icon: <SafetyCertificateOutlined />,
          label: 'Kích hoạt sau khi thanh toán được xác nhận',
          description: 'Quyền dùng AI chỉ mở khi hệ thống xác nhận thanh toán thành công, không kích hoạt sớm.',
        },
      ]}
      metrics={[
        { icon: billingIcons.duration, label: 'Hiệu lực', value: `${aiPackage?.durationDays ?? 30} ngày` },
        { icon: billingIcons.ai, label: 'Usage', value: formatStudentUsageSummary(activeEntitlement) },
        { icon: billingIcons.payment, label: 'Thanh toán', value: latestPurchase?.paymentStatus || 'Chưa có' },
      ]}
      sideLabel="Giá gói"
      sideValue={aiPackage ? formatCurrency(aiPackage.price, aiPackage.currency) : 'Chưa có'}
      sideStatusLabel="Trạng thái hiện tại"
      sideStatusValue={status.label}
      extraContent={(
        <BillingUsagePanel
          title="Mức sử dụng AI"
          summary={formatStudentUsageSummary(activeEntitlement)}
          description={formatStudentUsageDetail(activeEntitlement)}
          percent={getStudentUsageProgress(activeEntitlement)}
          premiumLabel={
            activeEntitlement?.usageLimit == null || activeEntitlement?.usageLimit >= BILLING_UNLIMITED_USAGE_THRESHOLD
              ? activeEntitlement
                ? 'AI Pro'
                : null
              : null
          }
        />
      )}
    >
      {!activeEntitlement ? (
        <Button
          type="primary"
          className="!h-11 !rounded-btn !font-semibold"
          loading={actingPackageId === aiPackage?.id}
          disabled={!aiPackage}
          onClick={onStartPurchase}
        >
          Mua gói AI
        </Button>
      ) : null}

      {shouldShowBillingRetryPurchase(latestPurchase) ? (
        <Button
          className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
          loading={actingPurchaseId === latestPurchase.id}
          onClick={() => onReopenPurchasePayment(latestPurchase)}
        >
          {buildBillingPurchaseActionLabel(latestPurchase, {
            defaultLabel: 'Mua gói AI',
            reopenLabel: 'Mở lại PayOS',
            retryLabel: 'Thanh toán lại',
          })}
        </Button>
      ) : null}
    </BillingPlanCard>
  );
}

function StudentBillingHistory({ purchases, loading, actingPurchaseId, onReopenPurchasePayment }) {
  const latestRetryablePurchaseId = purchases.find((purchase) => shouldShowBillingRetryPurchase(purchase))?.id;

  return (
    <BillingHistorySection
      eyebrow="Lịch sử thanh toán"
      title="Lịch sử mua gói"
      description="Theo dõi các giao dịch gần nhất để biết gói nào đã được kích hoạt và giao dịch nào cần mở lại thanh toán."
      purchases={purchases}
      loading={loading}
      emptyText="Bạn chưa có giao dịch mua gói AI nào."
      columns={[
        {
          title: 'Gói',
          dataIndex: 'packageName',
          width: 260,
          render: (value, row) => renderBillingPrimaryCell(value, formatDate(row.createdAt)),
        },
        {
          title: 'Trạng thái gói',
          dataIndex: 'status',
          width: 150,
          render: (value) => renderBillingStatusOrFallback(value),
        },
        {
          title: 'Thanh toán',
          dataIndex: 'paymentStatus',
          width: 150,
          render: (value) => renderBillingStatusOrFallback(value),
        },
        {
          title: 'Hiệu lực đến',
          dataIndex: 'expiresAt',
          width: 170,
          render: (value) => renderBillingDateCell(value, 'Chưa kích hoạt'),
        },
        {
          title: 'Số tiền',
          dataIndex: 'price',
          width: 150,
          render: (value, row) => <span className="text-sm font-semibold text-d4u-text-1">{formatCurrency(value, row.currency)}</span>,
        },
        {
          title: '',
          width: 180,
          align: 'right',
          render: (_, row) => (
            row.id === latestRetryablePurchaseId ? (
              <Button
                className="!rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                loading={actingPurchaseId === row.id}
                onClick={() => onReopenPurchasePayment(row)}
              >
                {buildBillingPurchaseActionLabel(row, {
                  defaultLabel: 'Mua gói AI',
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

export function StudentBillingPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
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
      const [packageRows, purchaseRows, entitlementRows] = await Promise.all([
        packageApi.listPackages('STUDENT'),
        packageApi.listMyPurchases(),
        packageApi.listMyEntitlements(),
      ]);
      setPackages(packageRows.filter((pkg) => pkg.role === 'STUDENT'));
      setPurchases(
        purchaseRows
          .filter((purchase) => purchase.role === 'STUDENT')
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      );
      setEntitlements(entitlementRows.filter((item) => item.entitlementCode === STUDENT_ENTITLEMENT_CODE));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu gói AI của Student.'));
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

  const aiPackage = useMemo(
    () => packages.find((pkg) => pkg.code === STUDENT_PACKAGE_CODE) || packages[0] || null,
    [packages]
  );

  const activeEntitlement = useMemo(
    () => entitlements.find((item) => item.status === 'ACTIVE') || null,
    [entitlements]
  );

  const latestPurchase = purchases[0] || null;

  const openCheckout = (checkoutUrl) => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const startPurchase = async () => {
    if (!aiPackage) return;

    setActingPackageId(aiPackage.id);
    setError(null);
    try {
      const purchase = await packageApi.purchasePackage(aiPackage.id);
      const payment = await packageApi.createPurchasePayment(purchase.id);
      openCheckout(payment.checkoutUrl);
      message.success('Đã tạo giao dịch thanh toán cho gói AI Student 30 ngày.');
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tạo giao dịch mua gói AI.'));
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
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán cho gói AI.'));
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
        title="Gói AI"
        description="Quản lý gói AI của Student để mở AI Proposal Writer, theo dõi mức sử dụng và xem lại các giao dịch thanh toán gần nhất."
        extra={<BillingRefreshButton onClick={loadData} />}
      />

      {activeEntitlement ? (
        <BillingSuccessAlert
          message="Gói AI của bạn đang hoạt động."
          description={`Quyền dùng AI hiện có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}. Bạn có thể dùng AI Proposal Writer ngay trong luồng ứng tuyển.`}
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus === 'PENDING' ? (
        <BillingInfoAlert
          message="Thanh toán của bạn đang chờ xác nhận."
          description="Quyền dùng AI sẽ cập nhật tự động sau khi hệ thống ghi nhận thanh toán thành công. Nếu cần, bạn có thể mở lại phiên thanh toán hiện tại."
        />
      ) : null}

      {!activeEntitlement && latestPurchase?.paymentStatus !== 'PENDING' ? (
        <BillingInfoAlert
          message={latestPurchase ? 'Gói AI chưa hoạt động hoặc đã hết hiệu lực.' : 'Hiện chưa có gói AI hoạt động.'}
          description="Khi cần dùng lại AI Proposal Writer, bạn có thể mua gói mới. Nếu vừa thanh toán xong, hãy bấm Làm mới để kiểm tra trạng thái mới nhất."
          icon={<HistoryOutlined />}
        />
      ) : null}

      <BillingErrorAlert message={error} />

      <StudentBillingSummary
        aiPackage={aiPackage}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
      />

      <StudentBillingPlanCard
        aiPackage={aiPackage}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
        actingPackageId={actingPackageId}
        actingPurchaseId={actingPurchaseId}
        onStartPurchase={startPurchase}
        onReopenPurchasePayment={reopenPurchasePayment}
      />

      <StudentBillingHistory
        purchases={purchases}
        loading={loading}
        actingPurchaseId={actingPurchaseId}
        onReopenPurchasePayment={reopenPurchasePayment}
      />
    </>
  );
}
