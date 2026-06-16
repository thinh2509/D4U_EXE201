import { CreditCardOutlined, ReloadOutlined, SafetyCertificateOutlined, TeamOutlined, UnlockOutlined, UserDeleteOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Drawer, Empty, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

const roleOptions = [
  { label: 'Tất cả vai trò', value: 'ALL' },
  { label: 'Sinh viên', value: 'STUDENT' },
  { label: 'SME', value: 'SME' },
  { label: 'Admin', value: 'ADMIN' }
];

const statusOptions = [
  { label: 'Tất cả trạng thái', value: 'ALL' },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Tạm khóa', value: 'SUSPENDED' },
  { label: 'Chờ kích hoạt', value: 'PENDING' }
];

function buildQueryParams(filters) {
  return {
    role: filters.role !== 'ALL' ? filters.role : undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    keyword: filters.keyword?.trim() || undefined
  };
}

function SummaryCard({ label, value, helper, accent = false }) {
  return (
    <Card className={accent ? 'dashboard-metric-card admin-users-summary-card admin-users-summary-card-accent' : 'dashboard-metric-card admin-users-summary-card'}>
      <div className="admin-users-summary-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <p>{helper}</p> : null}
      </div>
    </Card>
  );
}

function MetaField({ label, value }) {
  return (
    <div className="admin-users-meta-field rounded-card border border-d4u-border/70 bg-d4u-soft/35 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">{label}</div>
      <div className="mt-2 text-sm font-semibold text-d4u-text-1">{value ?? 'Chưa có'}</div>
    </div>
  );
}

export function AdminUsersManagementPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ role: 'ALL', status: 'ALL', keyword: '' });
  const [keywordInput, setKeywordInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRows = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminApi.listUsers(buildQueryParams(nextFilters)));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách người dùng.'));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (userId) => {
    setDetailLoading(true);
    try {
      setDetail(await adminApi.getUserDetail(userId));
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tải chi tiết người dùng.'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRows(filters);
  }, [filters.role, filters.status, filters.keyword]);

  const openDrawer = async (userId) => {
    setDrawerOpen(true);
    await loadDetail(userId);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDetail(null);
  };

  const handleLifecycleAction = (type) => {
    if (!detail) return;

    let reason = '';
    modal.confirm({
      title: type === 'suspend' ? 'Tạm khóa tài khoản này?' : 'Mở lại tài khoản này?',
      content: (
        <div className="grid gap-3">
          <Typography.Text>
            {type === 'suspend'
              ? 'Tài khoản sẽ không thể tiếp tục đăng nhập hoặc gọi các API cần xác thực.'
              : 'Tài khoản sẽ được đưa về trạng thái hoạt động để người dùng tiếp tục thao tác bình thường.'}
          </Typography.Text>
          <Input.TextArea rows={3} placeholder="Ghi chú nội bộ (không bắt buộc)" onChange={(event) => { reason = event.target.value; }} />
        </div>
      ),
      okText: type === 'suspend' ? 'Tạm khóa' : 'Mở lại',
      cancelText: 'Đóng',
      async onOk() {
        setActionLoading(true);
        try {
          if (type === 'suspend') {
            await adminApi.suspendUser(detail.id, { reason });
            message.success('Đã tạm khóa tài khoản.');
          } else {
            await adminApi.reactivateUser(detail.id, { reason });
            message.success('Đã mở lại tài khoản.');
          }

          await Promise.all([loadRows(), loadDetail(detail.id)]);
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái tài khoản.'));
          throw requestError;
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const summary = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === 'ACTIVE').length,
    suspended: rows.filter((row) => row.status === 'SUSPENDED').length,
    students: rows.filter((row) => row.role === 'STUDENT').length,
    smes: rows.filter((row) => row.role === 'SME').length
  }), [rows]);

  if (error) {
    return <ErrorState description={error} onRetry={() => loadRows()} />;
  }

  return (
    <div className="admin-users-page grid gap-6">
      <PageHeader
        icon={<TeamOutlined />}
        title="Quản lý người dùng"
        description="Tra cứu tài khoản theo vai trò, theo dõi mức độ hoàn thiện hồ sơ và xử lý nhanh các trường hợp cần tạm khóa hoặc mở lại."
        extra={(
          <Space wrap className="admin-users-actions">
            <Button className="admin-users-secondary-button" icon={<ReloadOutlined />} onClick={() => loadRows()}>
              Làm mới
            </Button>
            <Button className="admin-users-soft-button" onClick={() => navigate('/admin/dashboard')}>
              Về dashboard
            </Button>
          </Space>
        )}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard label="Tổng người dùng" value={summary.total} helper="Tổng số tài khoản trong bộ lọc hiện tại" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard label="Đang hoạt động" value={summary.active} helper="Có thể đăng nhập và sử dụng hệ thống" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard label="Tạm khóa" value={summary.suspended} helper="Cần admin mở lại để tiếp tục truy cập" accent={summary.suspended > 0} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <SummaryCard label="Sinh viên / SME" value={`${summary.students} / ${summary.smes}`} helper="Phân bổ tài khoản theo hai nhóm chính" />
        </Col>
      </Row>

      <Card className="table-card admin-users-table-card">
        <div className="admin-users-filter-bar mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Space wrap className="admin-users-filter-controls">
            <Select
              value={filters.role}
              options={roleOptions}
              onChange={(value) => setFilters((current) => ({ ...current, role: value }))}
              style={{ minWidth: 190 }}
              placeholder="Chọn vai trò"
            />
            <Select
              value={filters.status}
              options={statusOptions}
              onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
              style={{ minWidth: 190 }}
              placeholder="Chọn trạng thái"
            />
          </Space>
          <Input.Search
            allowClear
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onSearch={(value) => setFilters((current) => ({ ...current, keyword: value }))}
            placeholder="Tìm theo tên, email hoặc tên đăng nhập"
            style={{ width: '100%', maxWidth: 380 }}
            className="admin-users-search"
          />
        </div>

        <Table
          className="admin-users-table"
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1120 }}
          locale={{ emptyText: <Empty description="Chưa có người dùng phù hợp với bộ lọc hiện tại." /> }}
          onRow={(record) => ({
            onClick: () => openDrawer(record.id),
            style: { cursor: 'pointer' }
          })}
          columns={[
            {
              title: 'Người dùng',
              render: (_, row) => (
                <div className="table-title-cell">
                  <strong>{row.fullName}</strong>
                  <div className="table-subtext">{row.email}</div>
                  <div className="table-subtext">@{row.username}</div>
                </div>
              )
            },
            { title: 'Vai trò', dataIndex: 'role', render: (value) => <StatusBadge status={value} /> },
            { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
            {
              title: 'Email',
              dataIndex: 'emailVerifiedAt',
              render: (value) => value ? <Tag color="success">Đã xác minh</Tag> : <Tag>Chưa xác minh</Tag>
            },
            { title: 'Đăng nhập gần nhất', dataIndex: 'lastLoginAt', render: formatDate },
            { title: 'Tạo lúc', dataIndex: 'createdAt', render: formatDate }
          ]}
        />
      </Card>

      <Drawer
        className="admin-users-drawer"
        width={720}
        title="Chi tiết người dùng"
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        extra={detail ? (
          <Space wrap className="admin-users-actions">
            {detail.status === 'SUSPENDED' ? (
              <Button
                type="primary"
                className="admin-users-primary-button"
                icon={<UnlockOutlined />}
                loading={actionLoading}
                onClick={() => handleLifecycleAction('reactivate')}
              >
                Mở lại
              </Button>
            ) : (
              <Button
                danger
                className="admin-users-danger-button"
                icon={<UserDeleteOutlined />}
                loading={actionLoading}
                onClick={() => handleLifecycleAction('suspend')}
              >
                Tạm khóa
              </Button>
            )}
          </Space>
        ) : null}
      >
        {detailLoading ? (
          <div className="withdrawal-empty">Đang tải chi tiết người dùng...</div>
        ) : !detail ? (
          <Empty description="Chưa chọn người dùng." />
        ) : (
          <div className="grid gap-4">
            {detail.status === 'SUSPENDED' ? (
              <Alert
                type="warning"
                showIcon
                message="Tài khoản đang bị tạm khóa"
                description="Người dùng sẽ không thể tiếp tục đăng nhập hay gọi các API cần xác thực cho đến khi admin mở lại."
              />
            ) : null}

            <Card className="admin-users-detail-card">
              <div className="grid gap-4">
                <div>
                  <Typography.Title level={4} className="!mb-1">{detail.fullName}</Typography.Title>
                  <Space wrap>
                    <StatusBadge status={detail.role} />
                    <StatusBadge status={detail.status} />
                    {detail.emailVerifiedAt ? <Tag color="success">Email đã xác minh</Tag> : <Tag>Email chưa xác minh</Tag>}
                  </Space>
                </div>
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}><MetaField label="Email" value={detail.email} /></Col>
                  <Col xs={24} md={12}><MetaField label="Tên đăng nhập" value={`@${detail.username}`} /></Col>
                  <Col xs={24} md={12}><MetaField label="Tạo lúc" value={formatDate(detail.createdAt) || 'Chưa có'} /></Col>
                  <Col xs={24} md={12}><MetaField label="Đăng nhập gần nhất" value={formatDate(detail.lastLoginAt) || 'Chưa có'} /></Col>
                </Row>
              </div>
            </Card>

            <Card className="admin-users-detail-card" title="Tổng quan hồ sơ">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <MetaField
                    label="Hồ sơ sinh viên"
                    value={detail.studentProfile ? `${detail.studentProfile.displayName} • ${detail.studentProfile.secondaryLine}` : 'Chưa tạo'}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <MetaField
                    label="Hồ sơ SME"
                    value={detail.smeProfile ? `${detail.smeProfile.displayName} • ${detail.smeProfile.secondaryLine}` : 'Chưa tạo'}
                  />
                </Col>
              </Row>
              <Space wrap className="mt-4">
                {detail.studentProfile?.verificationStatus ? <StatusBadge status={detail.studentProfile.verificationStatus} /> : null}
                {detail.studentProfile?.onboardingStatus ? <Tag color="processing">{detail.studentProfile.onboardingStatus}</Tag> : null}
                {detail.smeProfile?.onboardingStatus ? <Tag color="cyan">{detail.smeProfile.onboardingStatus}</Tag> : null}
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card className="admin-users-detail-card" title="Gói và entitlement">
                  <div className="grid gap-3">
                    <MetaField label="Tổng lượt mua" value={detail.packageSummary.totalPurchases} />
                    <MetaField label="Chờ xử lý / Đang hoạt động / Lỗi" value={`${detail.packageSummary.pendingPurchases} / ${detail.packageSummary.activePurchases} / ${detail.packageSummary.failedPurchases}`} />
                    <MetaField label="Entitlement đang hoạt động" value={detail.packageSummary.activeEntitlements} />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="admin-users-detail-card" title="Rút tiền và dự án">
                  <div className="grid gap-3">
                    <MetaField label="Rút tiền chờ xử lý / đang xử lý" value={`${detail.withdrawalSummary.pendingRequests} / ${detail.withdrawalSummary.processingRequests}`} />
                    <MetaField label="Dự án đang mở / đang thực hiện" value={`${detail.projectSummary.openProjects} / ${detail.projectSummary.inProgressProjects}`} />
                    <MetaField label="Admin review / hoàn thành" value={`${detail.projectSummary.adminReviewProjects} / ${detail.projectSummary.completedProjects}`} />
                  </div>
                </Card>
              </Col>
            </Row>

            <Card className="admin-users-detail-card" title="Điều hướng nhanh">
              <Space wrap className="admin-users-quick-actions">
                {detail.studentProfile ? (
                  <Button className="admin-users-secondary-button" icon={<SafetyCertificateOutlined />} onClick={() => navigate('/admin/verifications')}>
                    Duyệt xác thực
                  </Button>
                ) : null}
                {(detail.packageSummary.totalPurchases > 0 || detail.packageSummary.activeEntitlements > 0) ? (
                  <Button className="admin-users-secondary-button" icon={<CreditCardOutlined />} onClick={() => navigate('/admin/package-support')}>
                    Package support
                  </Button>
                ) : null}
                {detail.withdrawalSummary.totalRequests > 0 ? (
                  <Button className="admin-users-secondary-button" icon={<WalletOutlined />} onClick={() => navigate('/admin/withdrawals')}>
                    Rút tiền
                  </Button>
                ) : null}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
