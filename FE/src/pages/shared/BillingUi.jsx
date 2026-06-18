import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Progress, Table, Typography } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const { Paragraph, Title } = Typography;

export const BILLING_UNLIMITED_USAGE_THRESHOLD = 2147483647;

export function BillingPill({ tone = 'neutral', children }) {
  const toneClass = {
    success: 'bg-emerald-50/90 text-emerald-700 ring-emerald-100',
    info: 'bg-cyan-50/90 text-cyan-700 ring-cyan-100',
    warning: 'bg-amber-50/90 text-amber-700 ring-amber-100',
    neutral: 'bg-slate-50 text-slate-600 ring-slate-200/90',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1 text-xs font-semibold ring-1 ${toneClass}`}>
      {children}
    </span>
  );
}

export function BillingStatusPill({ tone = 'neutral', label }) {
  return <BillingPill tone={tone}>{label}</BillingPill>;
}

export function BillingSummaryStat({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-d4u-border/70 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[13px] font-medium text-d4u-text-2">{label}</span>
      <span className="text-right text-[15px] font-semibold leading-6 text-d4u-text-1">{value}</span>
    </div>
  );
}

export function BillingMetricPill({ icon, label, value }) {
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

export function BillingSummaryHero({ badges = [], title, description, stats = [] }) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft via-white to-sky-50" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {badges.map((badge) => (
                <BillingPill key={`${badge.tone}-${badge.label}`} tone={badge.tone}>
                  {badge.icon}
                  {badge.label}
                </BillingPill>
              ))}
            </div>
            <Title level={3} className="!mb-2 !font-display !text-[30px] !font-bold !tracking-tight !text-d4u-teal-deep sm:!text-[34px]">
              {title}
            </Title>
            <Paragraph className="!mb-0 max-w-3xl !text-[15px] !leading-7 !text-d4u-text-2">
              {description}
            </Paragraph>
          </div>

          <div className="rounded-card border border-white/80 bg-white/95 p-5 shadow-sm">
            {stats.map((stat) => (
              <BillingSummaryStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BillingUsagePanel({
  title = 'Mức sử dụng',
  summary,
  description,
  percent,
  premiumLabel,
}) {
  return (
    <div className="rounded-2xl border border-d4u-border/70 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.04em] text-d4u-text-3">{title}</p>
        {premiumLabel ? <BillingPill tone="info">{premiumLabel}</BillingPill> : null}
      </div>
      <p className="mt-2 text-base font-semibold text-d4u-text-1">{summary}</p>
      {typeof percent === 'number' ? (
        <Progress
          percent={percent}
          showInfo={false}
          strokeColor="#08a3e6"
          trailColor="#dbeafe"
          className="mt-3 [&_.ant-progress-bg]:!h-2.5 [&_.ant-progress-inner]:!rounded-full"
        />
      ) : null}
      {description ? <p className="mt-3 text-sm leading-6 text-d4u-text-2">{description}</p> : null}
    </div>
  );
}

export function BillingPlanCard({
  status,
  audienceLabel,
  title,
  description,
  features,
  metrics = [],
  sideLabel = 'Giá gói',
  sideValue,
  sideStatusLabel = 'Trạng thái hiện tại',
  sideStatusValue,
  children,
  extraContent = null,
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft transition-shadow duration-200 hover:shadow-card">
      <div className="border-b border-d4u-border/60 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {status ? <BillingStatusPill label={status.label} tone={status.tone} /> : null}
          {audienceLabel ? <BillingPill tone="neutral">{audienceLabel}</BillingPill> : null}
        </div>
        <Title level={4} className="!mb-1 !mt-3 !font-display !text-[26px] !font-bold !tracking-tight !text-d4u-teal-deep">
          {title}
        </Title>
        <Paragraph className="!mb-0 !text-[15px] !leading-7 !text-d4u-text-2">
          {description}
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl bg-d4u-soft/70 p-4">
            <p className="text-xs font-semibold tracking-[0.04em] text-d4u-text-3">Bạn nhận được gì</p>
            <div className="mt-3 grid gap-3">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-start gap-3 rounded-xl bg-white/75 px-3.5 py-3 ring-1 ring-white/70">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-d4u-surface text-d4u-teal-deep ring-1 ring-d4u-border/70">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-d4u-text-1">{feature.label}</p>
                    <p className="mt-1 text-sm leading-6 text-d4u-text-2">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {metrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <BillingMetricPill key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} />
              ))}
            </div>
          ) : null}

          {extraContent}
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white/90 p-4 ring-1 ring-d4u-border/70">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-d4u-text-2">
              <CreditCardOutlined className="text-d4u-teal-deep" />
              <span className="font-medium">{sideLabel}</span>
            </div>
            <p className="text-[28px] font-bold leading-none tracking-tight text-d4u-teal-deep">
              {sideValue}
            </p>

            <div className="flex items-center gap-3 pt-2 text-sm text-d4u-text-2">
              <ClockCircleOutlined className="text-d4u-teal-deep" />
              <span className="font-medium">{sideStatusLabel}</span>
            </div>
            <p className="text-[15px] font-semibold text-d4u-text-1">{sideStatusValue}</p>
          </div>

          <div className="flex flex-col gap-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BillingHistorySection({
  eyebrow = 'Lịch sử thanh toán',
  title = 'Lịch sử giao dịch',
  description,
  purchases,
  loading,
  columns,
  emptyText,
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="border-b border-d4u-border/60 px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">{eyebrow}</p>
        <Title level={4} className="!mb-1 !mt-2 !font-display !text-d4u-teal-deep">
          {title}
        </Title>
        {description ? (
          <Paragraph className="!mb-0 !text-[15px] !leading-7 !text-d4u-text-2">
            {description}
          </Paragraph>
        ) : null}
      </div>

      <div className="px-2 py-2 sm:px-3 sm:py-3">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          scroll={{ x: 760 }}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText }}
          columns={columns}
          className="dashboard-data-table"
        />
      </div>
    </section>
  );
}

export function renderBillingDateCell(value, fallback = 'Chưa có') {
  return value
    ? <span className="text-sm font-medium text-d4u-text-2">{formatDate(value)}</span>
    : <span className="text-sm text-d4u-text-3">{fallback}</span>;
}

export function renderBillingStatusOrFallback(value, fallback = 'Chưa có') {
  return value ? <StatusBadge status={value} /> : <span className="text-sm text-d4u-text-3">{fallback}</span>;
}

export function renderBillingPrimaryCell(title, subtitle) {
  return (
    <div className="min-w-0">
      <strong className="block truncate text-[15px] font-semibold text-d4u-text-1">{title}</strong>
      {subtitle ? <div className="mt-1 text-xs font-medium text-d4u-text-2">{subtitle}</div> : null}
    </div>
  );
}

export function buildBillingPurchaseActionLabel(purchase, options = {}) {
  const {
    defaultLabel = 'Mua gói',
    reopenLabel = 'Mở lại PayOS',
    retryLabel = 'Thanh toán lại',
  } = options;

  if (!purchase) return defaultLabel;
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return reopenLabel;
  return retryLabel;
}

export function shouldShowBillingRetryPurchase(purchase) {
  return Boolean(purchase && ['PENDING', 'FAILED'].includes(purchase.paymentStatus));
}

export function buildGenericBillingStatus(activeFlag, latestPurchase, expiredFlag = false) {
  if (activeFlag) return { label: 'Đang hoạt động', tone: 'success' };
  if (latestPurchase?.paymentStatus === 'PENDING') return { label: 'Chờ xác nhận', tone: 'warning' };
  if (expiredFlag || latestPurchase?.status === 'EXPIRED' || latestPurchase?.entitlementStatus === 'EXPIRED') {
    return { label: 'Hết hiệu lực', tone: 'neutral' };
  }

  return { label: 'Chưa kích hoạt', tone: 'neutral' };
}

export function buildBillingStatusMap(status, type = 'purchase') {
  const maps = {
    purchase: {
      ACTIVE: { label: 'Đã kích hoạt', tone: 'success' },
      PENDING: { label: 'Đang chờ', tone: 'warning' },
      FAILED: { label: 'Thất bại', tone: 'warning' },
      CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
      EXPIRED: { label: 'Hết hiệu lực', tone: 'neutral' },
    },
    payment: {
      SUCCESS: { label: 'Đã thanh toán', tone: 'success' },
      PENDING: { label: 'Chờ thanh toán', tone: 'warning' },
      FAILED: { label: 'Thanh toán thất bại', tone: 'warning' },
      CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
      EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
    },
    entitlement: {
      ACTIVE: { label: 'Đang hoạt động', tone: 'success' },
      EXPIRED: { label: 'Hết hiệu lực', tone: 'neutral' },
      CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
    },
  };

  return maps[type]?.[status] || { label: status || 'Chưa có', tone: 'neutral' };
}

export function BillingRefreshButton({ onClick, loading = false }) {
  return (
    <Button
      className="!h-11 !rounded-btn !border-d4u-border !px-5 !font-semibold !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
      icon={<ReloadOutlined />}
      onClick={onClick}
      loading={loading}
    >
      Làm mới
    </Button>
  );
}

export function BillingSuccessAlert({ message, description }) {
  return (
    <Alert
      type="success"
      showIcon
      className="form-alert"
      icon={<CheckCircleFilled />}
      message={message}
      description={description}
    />
  );
}

export function BillingInfoAlert({ message, description, icon = <HistoryOutlined /> }) {
  return (
    <Alert
      type="info"
      showIcon
      className="form-alert"
      icon={icon}
      message={message}
      description={description}
    />
  );
}

export function BillingErrorAlert({ message }) {
  return message ? <Alert type="error" showIcon className="form-alert" message={message} /> : null;
}

export const billingIcons = {
  ai: <ThunderboltOutlined />,
  payment: <SafetyCertificateOutlined />,
  duration: <RocketOutlined />,
  history: <HistoryOutlined />,
  price: <CreditCardOutlined />,
};
