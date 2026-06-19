import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Timeline,
  Typography
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const statusOptions = [
  { label: 'Tất cả trạng thái', value: 'ALL' },
  { label: 'Đang mở', value: 'OPEN' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Chờ review', value: 'FINAL_REVIEW' },
  { label: 'Admin review', value: 'ADMIN_REVIEW' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' }
];

const compactToneByStatus = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'warning',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
  FUNDED: 'success',
  RELEASE_PENDING: 'warning',
  RELEASED: 'success',
  REFUND_PENDING: 'warning',
  REFUNDED: 'success',
  SUBMITTED: 'info',
  VALID: 'info',
  APPROVED: 'success',
  REVISION_REQUESTED: 'warning',
  INVALID_REPORTED: 'warning'
};

const compactLabelByStatus = {
  PENDING: 'Chờ xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  FUNDED: 'Đã giữ tiền',
  RELEASE_PENDING: 'Chờ giải ngân',
  RELEASED: 'Đã giải ngân',
  REFUND_PENDING: 'Chờ refund',
  REFUNDED: 'Đã refund',
  SUBMITTED: 'Chờ review',
  VALID: 'Đã xác thực',
  APPROVED: 'Đã duyệt',
  REVISION_REQUESTED: 'Yêu cầu sửa',
  INVALID_REPORTED: 'Báo file lỗi'
};

function buildQueryParams(filters) {
  return {
    status: filters.status !== 'ALL' ? filters.status : undefined,
    keyword: filters.keyword?.trim() || undefined
  };
}

function MetaField({ label, value }) {
  return (
    <div className="rounded-card border border-d4u-border/70 bg-d4u-soft/35 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">{label}</div>
      <div className="mt-2 text-sm font-semibold leading-6 text-d4u-text-1">{value ?? 'Chưa có'}</div>
    </div>
  );
}

function SoftTag({ text, tone = 'neutral' }) {
  const toneClass = {
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-d4u-cyan/20 bg-d4u-soft text-d4u-teal-deep',
    neutral: 'border-d4u-border bg-white text-d4u-text-2'
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass[tone] || toneClass.neutral}`}>
      {text}
    </span>
  );
}

function getAttentionState(row) {
  if (row.status === 'ADMIN_REVIEW') {
    return {
      label: 'Admin cần can thiệp',
      tone: 'warning',
      helper: 'Case đang ở bước admin review.'
    };
  }

  if (row.paymentStatus === 'FAILED') {
    return {
      label: 'Thanh toán lỗi',
      tone: 'warning',
      helper: 'Cần kiểm tra giao dịch trước khi đi tiếp.'
    };
  }

  if (row.paymentStatus === 'PENDING') {
    return {
      label: 'Chờ thanh toán',
      tone: 'info',
      helper: 'Đang chờ xác nhận payment.'
    };
  }

  if (row.escrowStatus === 'REFUND_PENDING') {
    return {
      label: 'Chờ refund',
      tone: 'warning',
      helper: 'Admin nên kiểm tra quy trình hoàn tiền.'
    };
  }

  if (row.latestSubmissionStatus === 'SUBMITTED' || row.latestSubmissionStatus === 'VALID') {
    return {
      label: 'Đang chờ review',
      tone: 'info',
      helper: 'Đã có bài nộp chờ SME hoặc admin xem.'
    };
  }

  return {
    label: 'Ổn định',
    tone: 'success',
    helper: 'Dự án không có tín hiệu bất thường.'
  };
}

function SummaryCard({ icon, label, value, helper, tone = 'neutral' }) {
  const toneClass = {
    warning: 'border-amber-200 bg-amber-50',
    success: 'border-emerald-200 bg-emerald-50',
    info: 'border-d4u-cyan/20 bg-d4u-soft/55',
    neutral: 'border-d4u-border/80 bg-white'
  };

  const valueClass = {
    warning: 'text-amber-700',
    success: 'text-emerald-700',
    info: 'text-d4u-teal-deep',
    neutral: 'text-d4u-text-1'
  };

  return (
    <Card className={`h-full border ${toneClass[tone] || toneClass.neutral}`}>
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <Typography.Text type="secondary">{label}</Typography.Text>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/85 text-d4u-cyan shadow-soft">
            {icon}
          </div>
        </div>
        <Typography.Title level={3} className={`!mb-0 ${valueClass[tone] || valueClass.neutral}`}>
          {value}
        </Typography.Title>
        <p className="mb-0 text-sm leading-6 text-d4u-text-2">{helper}</p>
      </div>
    </Card>
  );
}

function CompactStatePill({ value }) {
  if (!value) {
    return <span className="text-xs text-d4u-text-3">Chưa có</span>;
  }

  const tone = compactToneByStatus[value] || 'neutral';
  const label = compactLabelByStatus[value] || value;

  return <SoftTag text={label} tone={tone} />;
}

function PipelineCell({ row }) {
  const items = [
    { key: 'payment', label: 'Payment', value: row.paymentStatus },
    { key: 'escrow', label: 'Escrow', value: row.escrowStatus },
    { key: 'submission', label: 'Submission', value: row.latestSubmissionStatus }
  ];

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between gap-3 rounded-card border border-d4u-border/70 bg-white px-3 py-2.5"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-d4u-text-3">{item.label}</span>
          <CompactStatePill value={item.value} />
        </div>
      ))}
    </div>
  );
}

function ParticipantCard({ detail }) {
  return (
    <Card title="Người tham gia" className="h-full">
      <div className="grid gap-3">
        <MetaField label="SME" value={`${detail.sme.companyName || detail.sme.fullName} • ${detail.sme.fullName}`} />
        <MetaField
          label="Student"
          value={detail.student ? `${detail.student.fullName} • ${detail.student.verificationStatus || 'Chưa rõ'}` : 'Chưa gán Student'}
        />
      </div>
    </Card>
  );
}

function ExecutionCard({ detail }) {
  return (
    <Card title="Execution snapshot" className="h-full">
      <div className="grid gap-3">
        <MetaField label="Applications / Offers" value={`${detail.execution.totalApplications} / ${detail.execution.totalOffers}`} />
        <MetaField label="Payment" value={compactLabelByStatus[detail.execution.paymentStatus] || detail.execution.paymentStatus || 'Chưa có'} />
        <MetaField label="Escrow" value={compactLabelByStatus[detail.execution.escrowStatus] || detail.execution.escrowStatus || 'Chưa có'} />
        <MetaField
          label="Submission gần nhất"
          value={detail.execution.latestSubmissionAt ? formatDate(detail.execution.latestSubmissionAt) : 'Chưa có'}
        />
      </div>
    </Card>
  );
}

export function AdminProjectModerationPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', keyword: '' });
  const [keywordInput, setKeywordInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRows = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      setRows(await adminApi.listProjects(buildQueryParams(nextFilters)));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách dự án của admin.'));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (projectId) => {
    setDetailLoading(true);

    try {
      setDetail(await adminApi.getProjectDetail(projectId));
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tải chi tiết dự án.'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRows(filters);
  }, [filters.status, filters.keyword]);

  const openDrawer = async (projectId) => {
    setDrawerOpen(true);
    await loadDetail(projectId);
  };

  const handleModeration = (type) => {
    if (!detail) return;

    let reason = '';

    modal.confirm({
      title: type === 'force-complete' ? 'Xác nhận force complete dự án?' : 'Xác nhận hủy dự án?',
      content: (
        <div className="grid gap-3">
          <Typography.Text>
            {type === 'force-complete'
              ? 'Chỉ dùng khi admin đã xác nhận case này có thể khép lại và chuyển sang hoàn thành.'
              : 'Chỉ dùng khi dự án cần dừng ở mức moderation và không thể tiếp tục theo flow bình thường.'}
          </Typography.Text>
          <Input.TextArea
            rows={3}
            placeholder="Lý do moderation"
            onChange={(event) => {
              reason = event.target.value;
            }}
          />
        </div>
      ),
      okText: type === 'force-complete' ? 'Force complete' : 'Hủy dự án',
      cancelText: 'Đóng',
      async onOk() {
        setActionLoading(true);

        try {
          if (type === 'force-complete') {
            await adminApi.forceCompleteProject(detail.id, { reason });
            message.success('Đã force complete dự án.');
          } else {
            await adminApi.cancelProjectInReview(detail.id, { reason });
            message.success('Đã hủy dự án ở mức admin.');
          }

          await Promise.all([loadRows(), loadDetail(detail.id)]);
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể thực hiện moderation cho dự án.'));
          throw requestError;
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const summary = useMemo(() => {
    const attentionCount = rows.filter((row) => getAttentionState(row).tone !== 'success').length;

    return {
      total: rows.length,
      open: rows.filter((row) => row.status === 'OPEN').length,
      inProgress: rows.filter((row) => ['IN_PROGRESS', 'SKETCH_REVIEW', 'FINAL_REVIEW'].includes(row.status)).length,
      attentionCount
    };
  }, [rows]);

  if (error) {
    return <ErrorState description={error} onRetry={() => loadRows()} />;
  }

  return (
    <>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Quản lý dự án"
        description="Admin theo dõi toàn bộ dự án, nhìn nhanh case cần chú ý và mở chi tiết để audit hoặc can thiệp khi cần."
        extra={(
          <Space wrap size={[10, 10]} className="w-full justify-start sm:justify-end">
            <Button icon={<ReloadOutlined />} onClick={() => loadRows()}>
              Làm mới
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')}>Về dashboard</Button>
          </Space>
        )}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard
            icon={<FolderOpenOutlined />}
            label="Tổng dự án"
            value={summary.total}
            helper="Toàn bộ dự án trong bộ lọc hiện tại."
            tone="neutral"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard
            icon={<ClockCircleOutlined />}
            label="Đang mở"
            value={summary.open}
            helper="Các dự án vẫn đang mở để nhận ứng tuyển."
            tone="info"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard
            icon={<TeamOutlined />}
            label="Đang thực hiện"
            value={summary.inProgress}
            helper="Bao gồm execution và các bước review đang diễn ra."
            tone="success"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard
            icon={<SafetyCertificateOutlined />}
            label="Cần chú ý"
            value={summary.attentionCount}
            helper="Các case admin nên kiểm tra kỹ hơn."
            tone={summary.attentionCount > 0 ? 'warning' : 'success'}
          />
        </Col>
      </Row>

      <Card className="table-card overflow-hidden">
        <div className="border-b border-d4u-border/70 bg-gradient-to-r from-d4u-soft/30 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-d4u-text-3">Bộ lọc vận hành</span>
              <p className="m-0 max-w-2xl text-sm leading-6 text-d4u-text-2">
                Ưu tiên các dự án đang chờ review, chờ thanh toán hoặc nằm ở bước <span className="font-semibold text-d4u-text-1">ADMIN_REVIEW</span>.
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row xl:w-auto xl:min-w-[520px]">
              <Select
                value={filters.status}
                options={statusOptions}
                onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
                className="sm:max-w-[230px] sm:min-w-[230px]"
              />
              <Input.Search
                allowClear
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onSearch={(value) => setFilters((current) => ({ ...current, keyword: value }))}
                placeholder="Tìm theo tên dự án, brief hoặc SME"
                prefix={<SearchOutlined className="text-d4u-text-3" />}
              />
            </div>
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: <Empty description="Chưa có dự án nào trong bộ lọc này." /> }}
          rowClassName={(row) => {
            const tone = getAttentionState(row).tone;
            if (tone === 'warning') return 'bg-amber-50/40';
            if (tone === 'info') return 'bg-sky-50/30';
            return '';
          }}
          onRow={(record) => ({
            onClick: () => openDrawer(record.id),
            className: 'cursor-pointer'
          })}
          columns={[
            {
              title: 'Dự án',
              width: '31%',
              render: (_, row) => (
                <div className="grid gap-3 py-1">
                  <div className="table-title-cell">
                    <strong className="text-[15px] leading-7 text-d4u-text-1">{row.title}</strong>
                    <div className="table-subtext strong">{row.designCategoryName}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-d4u-text-3">
                    <SoftTag text={formatCurrency(row.budgetAmount, row.currency)} tone="neutral" />
                    <span>Cập nhật {formatDate(row.updatedAt)}</span>
                  </div>
                </div>
              )
            },
            {
              title: 'Trạng thái & chú ý',
              width: '19%',
              render: (_, row) => {
                const attention = getAttentionState(row);
                return (
                  <div className="grid gap-3 py-1">
                    <StatusBadge status={row.status} />
                    <div className="grid gap-1">
                      <SoftTag text={attention.label} tone={attention.tone} />
                      <span className="text-xs leading-5 text-d4u-text-3">{attention.helper}</span>
                    </div>
                  </div>
                );
              }
            },
            {
              title: 'Người tham gia',
              width: '24%',
              render: (_, row) => (
                <div className="grid gap-3 py-1">
                  <div className="grid gap-1">
                    <strong className="text-sm text-d4u-text-1">{row.smeCompanyName || row.smeFullName}</strong>
                    <span className="text-sm text-d4u-text-2">SME: {row.smeFullName}</span>
                  </div>
                  <div className="rounded-card border border-d4u-border/70 bg-d4u-soft/35 px-3 py-2.5">
                    <span className="text-sm text-d4u-text-2">
                      Student: <span className="font-semibold text-d4u-text-1">{row.studentFullName || 'Chưa gán'}</span>
                    </span>
                  </div>
                </div>
              )
            },
            {
              title: 'Pipeline vận hành',
              width: '26%',
              render: (_, row) => (
                <div className="py-1">
                  <PipelineCell row={row} />
                </div>
              )
            }
          ]}
        />
      </Card>

      <Drawer
        width={820}
        title="Chi tiết dự án"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDetail(null);
        }}
        destroyOnClose
        extra={detail?.canModerate ? (
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={actionLoading}
              onClick={() => handleModeration('force-complete')}
            >
              Force complete
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              loading={actionLoading}
              onClick={() => handleModeration('cancel')}
            >
              Hủy dự án
            </Button>
          </Space>
        ) : null}
      >
        {detailLoading ? (
          <div className="withdrawal-empty">Đang tải chi tiết dự án...</div>
        ) : !detail ? (
          <Empty description="Chưa chọn dự án." />
        ) : (
          <div className="grid gap-4">
            {detail.canModerate ? (
              <Alert
                type="warning"
                showIcon
                message="Case này đang ở ADMIN_REVIEW"
                description={
                  detail.execution.adminReviewReason ||
                  'Admin có thể force complete hoặc hủy nếu case này không thể quay lại flow thông thường.'
                }
              />
            ) : null}

            <Card className="overflow-hidden border border-d4u-border/80 shadow-soft">
              <div className="grid gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SoftTag text="Audit workspace" tone="info" />
                      <StatusBadge status={detail.status} />
                    </div>
                    <Typography.Title level={4} className="!mb-0">
                      {detail.title}
                    </Typography.Title>
                    <p className="m-0 max-w-3xl text-sm leading-6 text-d4u-text-2">
                      Admin dùng màn này để xem nhanh tình trạng dự án, người tham gia, bước execution hiện tại và các dấu hiệu cần can thiệp.
                    </p>
                  </div>
                  <div className="grid min-w-[220px] gap-2 rounded-card border border-d4u-border/70 bg-d4u-soft/35 p-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Ngân sách</span>
                    <strong className="text-[28px] font-bold leading-none tracking-tight text-d4u-teal-deep">
                      {formatCurrency(detail.budgetAmount, detail.currency)}
                    </strong>
                    <span className="text-xs text-d4u-text-2">Hạn hoàn tất review: {formatDate(detail.totalDeadlineAt)}</span>
                  </div>
                </div>

                <div className="rounded-card border border-d4u-border/70 bg-white p-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Brief dự án</span>
                  <Typography.Paragraph className="!mb-0 mt-3 text-sm leading-7 text-d4u-text-1">
                    {detail.brief}
                  </Typography.Paragraph>
                </div>
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <ParticipantCard detail={detail} />
              </Col>
              <Col xs={24} lg={12}>
                <ExecutionCard detail={detail} />
              </Col>
            </Row>

            <Card title="Metadata & mốc thời gian">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <MetaField label="Danh mục" value={detail.designCategoryName} />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField label="Loại dự án" value={detail.projectType} />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField label="Hạn Sketch" value={formatDate(detail.sketchDeadlineAt)} />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField label="Hạn Final" value={formatDate(detail.finalDeadlineAt)} />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField label="Published" value={detail.publishedAt ? formatDate(detail.publishedAt) : 'Chưa publish'} />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField label="Revision" value={`${detail.currentRevisionRound} / ${detail.maxRevisionRounds}`} />
                </Col>
              </Row>
            </Card>

            <Card title="Timeline moderation">
              {detail.timeline.length === 0 ? (
                <Empty description="Chưa có timeline moderation." />
              ) : (
                <Timeline
                  items={detail.timeline.map((item) => ({
                    children: (
                      <div className="grid gap-1">
                        <Space wrap>
                          <Typography.Text strong>{item.action}</Typography.Text>
                          <Typography.Text type="secondary">{formatDate(item.createdAt)}</Typography.Text>
                        </Space>
                        <Typography.Text type="secondary">{item.actorName || 'System'}</Typography.Text>
                        {item.note ? <Typography.Paragraph className="!mb-0">{item.note}</Typography.Paragraph> : null}
                      </div>
                    )
                  }))}
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
}
