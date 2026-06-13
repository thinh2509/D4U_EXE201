import {
  CheckCircleFilled,
  CreditCardOutlined,
  ReloadOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { Alert, App, Button, Card, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { packageApi } from '../../services/packageApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const { Paragraph, Title } = Typography;
const STUDENT_PACKAGE_CODE = 'STUDENT_AI_MATCHING_30D';
const STUDENT_ENTITLEMENT_CODE = 'STUDENT_AI_MATCHING';
const AI_UNLIMITED_USAGE_THRESHOLD = 2147483647;

function renderDateCell(value) {
  return value
    ? <span className="text-sm font-medium text-d4u-text-2">{formatDate(value)}</span>
    : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="text-sm text-d4u-text-3">Chưa có</span>;
}

function buildPurchaseActionLabel(purchase) {
  if (!purchase) return 'Mua gói AI';
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return 'Mở lại thanh toán';
  return 'Thanh toán lại';
}

function shouldShowRetryPurchase(purchase) {
  if (!purchase) return false;
  return purchase.paymentStatus === 'PENDING' || purchase.paymentStatus === 'FAILED';
}

function formatRemainingUsage(entitlement) {
  if (!entitlement) return 'Chưa kích hoạt';
  if (entitlement.usageLimit == null || entitlement.usageLimit >= AI_UNLIMITED_USAGE_THRESHOLD) return 'AI Pro';

  const remaining = Math.max(0, entitlement.usageLimit - entitlement.usageConsumed);
  return `Còn ${remaining} lượt`;
}

function formatUsageDetail(entitlement) {
  if (!entitlement) return '30 lượt / 30 ngày sau khi kích hoạt';
  if (entitlement.usageLimit == null || entitlement.usageLimit >= AI_UNLIMITED_USAGE_THRESHOLD) return 'Không giới hạn';

  const remaining = Math.max(0, entitlement.usageLimit - entitlement.usageConsumed);
  return `${entitlement.usageConsumed}/${entitlement.usageLimit} lượt đã dùng · còn ${remaining} lượt`;
}

function getPlanDisplayName(aiPackage) {
  return aiPackage?.name || 'Gói AI Student 30 ngày';
}

function StudentAiStatusBadge({ activeEntitlement, latestPurchase }) {
  if (activeEntitlement) {
    return <Tag color="success" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">Đang hoạt động</Tag>;
  }

  if (latestPurchase?.paymentStatus === 'PENDING') {
    return <Tag color="processing" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">Chờ xác nhận</Tag>;
  }

  return <Tag color="default" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">Chưa kích hoạt</Tag>;
}

function SummaryStat({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-d4u-border/70 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-sm text-d4u-text-2">{label}</span>
      <span className="text-right text-sm font-semibold text-d4u-text-1">{value}</span>
    </div>
  );
}

function StudentAiPlanSummaryCard({
  aiPackage,
  activeEntitlement,
  latestPurchase,
  actingPackageId,
  actingPurchaseId,
  onStartPurchase,
  onReopenPurchasePayment
}) {
  const isPendingPurchase = latestPurchase?.paymentStatus === 'PENDING';

  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="relative p-6 sm:p-7">
        <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft via-white to-sky-50" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StudentAiStatusBadge activeEntitlement={activeEntitlement} latestPurchase={latestPurchase} />
              <Tag color="processing" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">AI Proposal Writer</Tag>
            </div>

            <Title level={3} className="!mb-2 !font-display !text-d4u-teal-deep">
              {getPlanDisplayName(aiPackage)}
            </Title>

            <Paragraph className="!mb-4 max-w-2xl !text-sm !leading-6 !text-d4u-text-2">
              {activeEntitlement
                ? `Gói hiện có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}. Bạn có thể tiếp tục dùng AI Proposal Writer để tạo bản nháp proposal trực tiếp trong luồng ứng tuyển.`
                : isPendingPurchase
                  ? 'Thanh toán đã được tạo và đang chờ PayOS xác nhận. Sau khi webhook cập nhật thành công, gói AI sẽ tự động mở khóa cho Student.'
                  : 'Mở khóa AI Proposal Writer trong 30 ngày để tạo proposal nháp nhanh hơn, bám sát brief dự án và dữ liệu hồ sơ năng lực của bạn.'}
            </Paragraph>

            <div className="flex flex-wrap items-center gap-3">
              {!activeEntitlement ? (
                <Button
                  type="primary"
                  className="!h-11 !rounded-btn !px-5 !font-semibold"
                  loading={actingPackageId === aiPackage?.id}
                  disabled={!aiPackage}
                  onClick={onStartPurchase}
                >
                  Mua gói AI
                </Button>
              ) : null}

              {shouldShowRetryPurchase(latestPurchase) ? (
                <Button
                  className="!h-11 !rounded-btn !border-d4u-border !px-5 !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                  loading={actingPurchaseId === latestPurchase.id}
                  onClick={() => onReopenPurchasePayment(latestPurchase)}
                >
                  {buildPurchaseActionLabel(latestPurchase)}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-card border border-white/80 bg-white/90 p-5 shadow-sm">
            <SummaryStat label="Trạng thái" value={activeEntitlement ? 'Đang hoạt động' : isPendingPurchase ? 'Chờ xác nhận' : 'Chưa kích hoạt'} />
            <SummaryStat label="Hiệu lực đến" value={activeEntitlement ? formatDate(activeEntitlement.expiresAt) : 'Hiện chưa có gói hoạt động'} />
            <SummaryStat label="AI usage" value={formatRemainingUsage(activeEntitlement)} />
            <SummaryStat label="Chi tiết usage" value={formatUsageDetail(activeEntitlement)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentAiPlanDetailsCard({
  aiPackage,
  activeEntitlement,
  latestPurchase,
  actingPackageId,
  actingPurchaseId,
  onStartPurchase,
  onReopenPurchasePayment
}) {
  return (
    <Card className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft" bodyStyle={{ padding: 0 }}>
      <div className="border-b border-d4u-border/60 px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Gói dành cho Student</p>
        <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
          {getPlanDisplayName(aiPackage)}
        </Title>
        <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
          {aiPackage
            ? `${formatCurrency(aiPackage.price, aiPackage.currency)}/30 ngày · ${aiPackage.usageLimit ?? 30} lượt tạo proposal bằng AI`
            : 'Gói AI 30 ngày dành cho Student'}
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <Paragraph className="!mb-4 !text-sm !leading-6 !text-d4u-text-2">
            Mở khóa AI Proposal Writer để tạo proposal nháp sát brief hơn, tận dụng dữ liệu kỹ năng, portfolio và hồ sơ học tập của bạn mà không thay đổi luồng ứng tuyển hiện tại.
          </Paragraph>

          <div className="rounded-2xl bg-d4u-soft/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Quyền lợi chính</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-d4u-text-2">
              <li>Tạo proposal nháp bằng AI ngay trong modal ứng tuyển.</li>
              <li>Dựa trên brief dự án, kỹ năng và portfolio để viết nội dung sát hơn.</li>
              <li>Bạn vẫn chủ động chỉnh sửa proposal trước khi gửi cho SME.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white/90 p-4 ring-1 ring-d4u-border/70">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-d4u-text-2">
              <CreditCardOutlined className="text-d4u-teal-deep" />
              <span>Giá gói</span>
            </div>
            <p className="text-lg font-semibold text-d4u-text-1">
              {aiPackage ? formatCurrency(aiPackage.price, aiPackage.currency) : 'Chưa có'}
            </p>

            <div className="flex items-center gap-3 pt-2 text-sm text-d4u-text-2">
              <ThunderboltOutlined className="text-d4u-teal-deep" />
              <span>Trạng thái hiện tại</span>
            </div>
            <p className="text-sm font-semibold text-d4u-text-1">
              {activeEntitlement ? 'Đang hoạt động' : latestPurchase?.paymentStatus === 'PENDING' ? 'Chờ xác nhận thanh toán' : 'Chưa kích hoạt'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
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

            {shouldShowRetryPurchase(latestPurchase) ? (
              <Button
                className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
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

function StudentAiPurchaseHistorySection({ purchases, loading, actingPurchaseId, onReopenPurchasePayment }) {
  const latestRetryablePurchaseId = purchases.find((purchase) => shouldShowRetryPurchase(purchase))?.id;

  return (
    <Card
      className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft"
      bodyStyle={{ padding: 0 }}
    >
      <div className="border-b border-d4u-border/60 px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Lịch sử thanh toán</p>
        <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
          Lịch sử mua gói
        </Title>
        <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
          Giữ lại những trạng thái quan trọng nhất để bạn biết lần thanh toán nào đã kích hoạt gói và lần nào cần mở lại PayOS.
        </Paragraph>
      </div>

      <div className="px-2 py-2 sm:px-3 sm:py-3">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: 'Bạn chưa có giao dịch mua gói AI nào.' }}
          columns={[
            {
              title: 'Gói',
              dataIndex: 'packageName',
              width: 260,
              render: (value, row) => (
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-d4u-text-1">{value}</strong>
                  <div className="mt-1 text-xs text-d4u-text-3">
                    {formatDate(row.createdAt)}
                  </div>
                </div>
              )
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 140,
              render: (value) => <StatusBadge status={value} />
            },
            {
              title: 'Thanh toán',
              dataIndex: 'paymentStatus',
              width: 140,
              render: (value) => renderStatusOrFallback(value)
            },
            {
              title: 'Hiệu lực đến',
              dataIndex: 'expiresAt',
              width: 170,
              render: renderDateCell
            },
            {
              title: 'Số tiền',
              dataIndex: 'price',
              width: 150,
              render: (value, row) => <span className="text-sm font-semibold text-d4u-text-1">{formatCurrency(value, row.currency)}</span>
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
                    {buildPurchaseActionLabel(row)}
                  </Button>
                ) : null
              )
            }
          ]}
        />
      </div>
    </Card>
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
        packageApi.listMyEntitlements()
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
      message.success('Đã tạo giao dịch PayOS cho gói AI Student 30 ngày.');
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
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán PayOS cho gói AI.'));
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
        description="Quản lý một gói AI duy nhất dành cho Student để mở AI Proposal Writer và theo dõi usage hiện tại."
        extra={(
          <Button
            className="!h-11 !rounded-btn !border-d4u-border !px-5 !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
            icon={<ReloadOutlined />}
            onClick={loadData}
          >
            Làm mới
          </Button>
        )}
      />

      {!activeEntitlement && latestPurchase?.paymentStatus !== 'PENDING' ? (
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message={latestPurchase ? 'Gói AI đã hết hạn hoặc chưa được kích hoạt.' : 'Hiện chưa có gói AI hoạt động.'}
          description="Khi cần dùng lại AI Proposal Writer, bạn có thể mua gói AI mới. Nếu vừa thanh toán xong, hãy bấm Làm mới để kiểm tra trạng thái entitlement mới nhất."
        />
      ) : null}

      {error ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <StudentAiPlanSummaryCard
        aiPackage={aiPackage}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
        actingPackageId={actingPackageId}
        actingPurchaseId={actingPurchaseId}
        onStartPurchase={startPurchase}
        onReopenPurchasePayment={reopenPurchasePayment}
      />

      <StudentAiPlanDetailsCard
        aiPackage={aiPackage}
        activeEntitlement={activeEntitlement}
        latestPurchase={latestPurchase}
        actingPackageId={actingPackageId}
        actingPurchaseId={actingPurchaseId}
        onStartPurchase={startPurchase}
        onReopenPurchasePayment={reopenPurchasePayment}
      />

      <StudentAiPurchaseHistorySection
        purchases={purchases}
        loading={loading}
        actingPurchaseId={actingPurchaseId}
        onReopenPurchasePayment={reopenPurchasePayment}
      />
    </>
  );
}
