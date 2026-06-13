import {
  CheckCircleFilled,
  CreditCardOutlined,
  HistoryOutlined,
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

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="min-w-0">
      <strong className="block truncate text-sm font-semibold text-d4u-text-1">{title}</strong>
      {subtitle ? <div className="mt-1 text-xs text-d4u-text-3">{subtitle}</div> : null}
    </div>
  );
}

function buildPurchaseActionLabel(purchase) {
  if (!purchase) return 'Mua gói AI';
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return 'Mở lại thanh toán';
  return 'Thanh toán lại';
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
      setPurchases(purchaseRows.filter((purchase) => purchase.role === 'STUDENT'));
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

  const latestPurchase = useMemo(
    () => purchases
      .filter((purchase) => !aiPackage || purchase.packageId === aiPackage.id)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null,
    [aiPackage, purchases]
  );

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
        description="Mua và theo dõi gói AI dành cho Student để mở khóa AI Proposal Writer trong 30 ngày."
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

      {activeEntitlement ? (
        <section className="overflow-hidden rounded-panel border border-emerald-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-50 via-white to-d4u-soft px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Tag color="success" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">Gói đang hoạt động</Tag>
                <Tag color="processing" className="m-0 rounded-full px-3 py-1 text-xs font-semibold">AI Proposal Writer</Tag>
              </div>
              <Title level={4} className="!mb-1 !font-display !text-emerald-700">
                Bạn đang dùng gói AI Student 30 ngày
              </Title>
              <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
                Gói hiện có hiệu lực đến <span className="font-semibold text-d4u-text-1">{formatDate(activeEntitlement.expiresAt)}</span>.
                Bạn có thể dùng AI Proposal Writer để tạo bản nháp proposal trực tiếp trong luồng ứng tuyển.
              </Paragraph>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[480px]">
              <MetricPill icon={<CreditCardOutlined />} label="Gói" value="Đang hoạt động" />
              <MetricPill icon={<ThunderboltOutlined />} label="AI còn lại" value={formatRemainingUsage(activeEntitlement)} />
              <MetricPill icon={<CheckCircleFilled />} label="Hết hạn" value={formatDate(activeEntitlement.expiresAt)} />
            </div>
          </div>
        </section>
      ) : (
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message="Gói AI chỉ được kích hoạt sau khi PayOS webhook xác nhận thanh toán thành công."
          description="Nếu bạn vừa thanh toán xong, hãy bấm Làm mới để kiểm tra entitlement mới nhất trước khi quay lại dùng AI Proposal Writer."
        />
      )}

      {error ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft" bodyStyle={{ padding: 0 }}>
          <div className="border-b border-d4u-border bg-gradient-to-r from-d4u-soft via-white to-white px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Gói dành cho Student</p>
            <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
              {aiPackage?.name || 'Gói AI Student 30 ngày'}
            </Title>
            <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
              Mở khóa AI Proposal Writer trong 30 ngày, kèm {aiPackage?.usageLimit ?? 30} lượt tạo proposal bằng AI để bạn chuẩn bị hồ sơ ứng tuyển nhanh và sát brief hơn.
            </Paragraph>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricPill icon={<RocketOutlined />} label="Tính năng" value="AI Proposal Writer" />
                <MetricPill icon={<CreditCardOutlined />} label="Giá gói" value={aiPackage ? `${formatCurrency(aiPackage.price, aiPackage.currency)}/30 ngày` : 'Chưa có'} />
                <MetricPill icon={<ThunderboltOutlined />} label="Lượt AI" value={aiPackage?.usageLimit ? `${aiPackage.usageLimit} lượt` : 'AI Pro'} />
                <MetricPill icon={<CheckCircleFilled />} label="Trạng thái" value={activeEntitlement ? 'Đang hoạt động' : 'Chưa kích hoạt'} />
              </div>

              <div className="rounded-2xl border border-d4u-border bg-d4u-soft/60 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Quyền lợi</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-d4u-text-2">
                  <li>Tạo proposal nháp bằng AI ngay trong modal ứng tuyển.</li>
                  <li>Dùng dữ liệu từ brief dự án, kỹ năng và portfolio để viết proposal sát hơn.</li>
                  <li>Student vẫn chủ động chỉnh sửa nội dung trước khi gửi ứng tuyển.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-d4u-border bg-white/90 p-4 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">Trạng thái hiện tại</p>
                <p className="mt-2 text-base font-semibold text-d4u-text-1">
                  {activeEntitlement ? 'Đã kích hoạt' : 'Chưa có gói hoạt động'}
                </p>
                <p className="mt-2 text-sm leading-6 text-d4u-text-2">
                  {activeEntitlement
                    ? `Usage hiện tại: ${formatUsageDetail(activeEntitlement)}`
                    : 'Mua gói để mở AI Proposal Writer và bắt đầu tạo proposal trực tiếp từ project detail.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="primary"
                  className="!h-11 !rounded-btn !font-semibold"
                  loading={actingPackageId === aiPackage?.id}
                  disabled={!aiPackage}
                  onClick={startPurchase}
                >
                  {activeEntitlement ? 'Gia hạn gói AI' : 'Mua gói AI'}
                </Button>
                {latestPurchase && !activeEntitlement ? (
                  <Button
                    className="!h-11 !rounded-btn !border-d4u-border !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
                    loading={actingPurchaseId === latestPurchase.id}
                    onClick={() => reopenPurchasePayment(latestPurchase)}
                  >
                    {buildPurchaseActionLabel(latestPurchase)}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft" bodyStyle={{ padding: 0 }}>
          <div className="border-b border-d4u-border bg-gradient-to-r from-d4u-soft via-white to-white px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">Tóm tắt gói</p>
            <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
              AI usage & trạng thái
            </Title>
            <Paragraph className="!mb-0 !text-sm !leading-6 !text-d4u-text-2">
              Theo dõi lượt AI còn lại, lần mua gần nhất và trạng thái thanh toán mới nhất ở một nơi ngắn gọn hơn.
            </Paragraph>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:p-6">
            <MetricPill icon={<ThunderboltOutlined />} label="AI còn lại" value={formatRemainingUsage(activeEntitlement)} />
            <MetricPill icon={<HistoryOutlined />} label="Đã mua" value={`${purchases.length} giao dịch`} />
            <MetricPill icon={<CheckCircleFilled />} label="Hiệu lực đến" value={activeEntitlement ? formatDate(activeEntitlement.expiresAt) : 'Chưa kích hoạt'} />
            <MetricPill icon={<CreditCardOutlined />} label="Thanh toán gần nhất" value={latestPurchase?.paymentStatus || 'Chưa có'} />
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
          scroll={{ x: 920 }}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: 'Bạn chưa có giao dịch mua gói AI nào.' }}
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
