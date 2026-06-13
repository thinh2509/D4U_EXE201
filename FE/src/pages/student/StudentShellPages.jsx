import { CheckCircleFilled, FileDoneOutlined, FolderOpenOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Form, Input, InputNumber, Select, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StudentReadinessGate } from '../../components/StudentReadinessGate.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { walletApi } from '../../services/walletApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { FeatureShellPage } from '../shared/MvpShellPage.jsx';
import { MyRatingsPage } from '../shared/RatingPages.jsx';

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="table-title-cell">
      <strong>{title}</strong>
      {subtitle ? <div className="table-subtext">{subtitle}</div> : null}
    </div>
  );
}

function renderDateCell(value) {
  return <span className="table-date-cell">{formatDate(value)}</span>;
}

function renderDeadlineCell(row) {
  return (
    <div className="table-deadline-cell">
      <div><strong>Sketch:</strong><span>{formatDate(row.sketchDeadlineAt)}</span></div>
      <div><strong>Final:</strong><span>{formatDate(row.finalDeadlineAt)}</span></div>
      <div><strong>Review:</strong><span>{formatDate(row.totalDeadlineAt)}</span></div>
    </div>
  );
}

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="table-subtext">Chưa có</span>;
}

function getOfferSourceLabel(row) {
  return row.applicationId ? 'Từ ứng tuyển' : 'Từ AI Matching';
}

export function StudentApplicationsPage() {
  return (
    <StudentReadinessGate
      requireApproved
      approvedTitle="Hoàn tất xác thực trước khi theo dõi ứng tuyển"
      approvedDescription="Khi hồ sơ sinh viên đã được xác thực, D4U mới mở phần ứng tuyển, offer và các trạng thái liên quan đến marketplace của bạn."
    >
      <StudentApplicationsPageContent />
    </StudentReadinessGate>
  );
}

function StudentApplicationsPageContent() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listStudentApplications());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải ứng tuyển của bạn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  const tableColumns = [
    {
      title: 'Dự án',
      dataIndex: 'projectTitle',
      width: 280,
      render: (value, row) =>
        renderPrimaryCell(
          value,
          `${row.coverLetter?.slice(0, 90) || ''}${row.coverLetter?.length > 90 ? '...' : ''}`
        )
    },
    {
      title: 'Giá đề xuất',
      dataIndex: 'proposedPrice',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Application',
      dataIndex: 'applicationStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Offer',
      dataIndex: 'offerStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => renderStatusOrFallback(value)
    },
    {
      title: 'Escrow',
      dataIndex: 'escrowStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => renderStatusOrFallback(value)
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'submittedAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Hành động',
      width: 188,
      align: 'right',
      className: 'table-cell-actions',
      render: (_, row) => (
        <Space direction="vertical" size={8} className="table-actions-stack">
          <Button className="table-action-button" type="primary" ghost onClick={() => navigate(`/student/projects/${row.projectId}`)}>
            Xem dự án
          </Button>
          {row.offerStatus === 'WAITING_ACCEPTANCE' ? (
            <Button className="table-action-button" type="primary" onClick={() => navigate('/student/offers')}>
              Xử lý offer
            </Button>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title="Ứng tuyển của tôi"
        description="Theo dõi application đã gửi, offer liên quan và trạng thái escrow nếu SME đã chọn bạn."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Card className="table-card">
        <Table
          className="dashboard-data-table"
          rowKey="applicationId"
          loading={loading}
          columns={tableColumns}
          dataSource={rows}
          scroll={{ x: 1040 }}
          expandable={{ expandedRowRender: (row) => <p className="expanded-copy">{row.coverLetter}</p> }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Bạn chưa gửi ứng tuyển nào.' }}
        />
      </Card>
    </>
  );
}

export function StudentOffersPage() {
  return (
    <StudentReadinessGate
      requireApproved
      approvedTitle="Cần xác thực trước khi xử lý offer"
      approvedDescription="Offer chỉ hiển thị đầy đủ khi hồ sơ sinh viên đã được xác thực để SME có thể yên tâm gửi đề nghị và mở escrow."
    >
      <StudentOffersPageContent />
    </StudentReadinessGate>
  );
}

function StudentOffersPageContent() {
  const { message } = App.useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listStudentOffers());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải offer của bạn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const accept = async (offerId) => {
    setActing(offerId);
    try {
      await projectApi.acceptOffer(offerId);
      message.success('Đã chấp nhận offer. SME cần thanh toán escrow trước khi dự án bắt đầu.');
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể chấp nhận offer.'));
    } finally {
      setActing(null);
    }
  };

  const reject = async (offerId) => {
    setActing(offerId);
    try {
      await projectApi.rejectOffer(offerId);
      message.success('Đã từ chối offer.');
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể từ chối offer.'));
    } finally {
      setActing(null);
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  const tableColumns = [
    {
      title: 'Dự án',
      dataIndex: 'projectTitle',
      width: 248,
      render: (value, row) => renderPrimaryCell(value, `${getOfferSourceLabel(row)} • Offer: ${formatCurrency(row.offeredAmount)}`)
    },
    {
      title: 'Offer',
      dataIndex: 'offerStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => renderStatusOrFallback(value)
    },
    {
      title: 'Escrow',
      dataIndex: 'escrowStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => renderStatusOrFallback(value)
    },
    {
      title: 'Deadline',
      width: 220,
      className: 'table-cell-deadline',
      render: (_, row) => renderDeadlineCell(row)
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Hành động',
      width: 176,
      align: 'center',
      className: 'table-cell-actions',
      render: (_, row) => (
        <Space direction="vertical" size={8} className="table-actions-stack">
          <Button
            type="primary"
            className="table-action-button"
            disabled={row.offerStatus !== 'WAITING_ACCEPTANCE'}
            loading={acting === row.offerId}
            onClick={() => accept(row.offerId)}
          >
            Chấp nhận
          </Button>
          <Button
            danger
            className="table-action-button"
            disabled={row.offerStatus !== 'WAITING_ACCEPTANCE'}
            loading={acting === row.offerId}
            onClick={() => reject(row.offerId)}
          >
            Từ chối
          </Button>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title="Đề nghị"
        description="Chấp nhận hoặc từ chối đề nghị từ SME. Sau khi bạn chấp nhận, SME mới thanh toán escrow qua PayOS."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="Offer đã chấp nhận vẫn chưa bắt đầu ngay. Project chỉ chuyển sang đang thực hiện sau khi PayOS xác nhận escrow đã được thanh toán."
      />
      <Card className="table-card">
        <Table
          className="dashboard-data-table"
          rowKey="offerId"
          loading={loading}
          columns={tableColumns}
          dataSource={rows}
          scroll={{ x: 1080 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Bạn chưa có offer nào.' }}
        />
      </Card>
    </>
  );
}

export function StudentMyProjectsPage() {
  return (
    <StudentReadinessGate
      requireApproved
      approvedTitle="Bạn cần xác thực trước khi vào workspace dự án"
      approvedDescription="D4U chỉ mở danh sách dự án đã nhận sau khi hồ sơ sinh viên được xác thực và quá trình marketplace đã sẵn sàng."
    >
      <StudentMyProjectsPageContent />
    </StudentReadinessGate>
  );
}

function StudentMyProjectsPageContent() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listStudentProjects());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dự án của bạn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  const tableColumns = [
    {
      title: 'Dự án',
      dataIndex: 'projectTitle',
      width: 280,
      render: (value) => renderPrimaryCell(value)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'projectStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Ngân sách',
      dataIndex: 'budgetAmount',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value, row) => formatCurrency(value, row.currency)
    },
    {
      title: 'Escrow',
      dataIndex: 'escrowStatus',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => renderStatusOrFallback(value)
    },
    {
      title: 'Review',
      dataIndex: 'totalDeadlineAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Hành động',
      width: 160,
      align: 'center',
      className: 'table-cell-actions',
      render: (_, row) => (
        <div className="table-actions-stack single">
          <Button className="table-action-button" type="primary" ghost onClick={() => navigate(`/projects/${row.projectId}/execution`)}>
            Theo dõi
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dự án của tôi"
        description="Các dự án đã được bạn chấp nhận sau khi escrow được thanh toán."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Card className="table-card">
        <Table
          className="dashboard-data-table"
          rowKey="projectId"
          loading={loading}
          columns={tableColumns}
          dataSource={rows}
          scroll={{ x: 920 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Bạn chưa có dự án đang thực hiện.' }}
        />
      </Card>
    </>
  );
}

export function StudentPortfolioPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Portfolio Builder"
      description="Tạo portfolio item từ nội dung được phép công khai và quản lý trạng thái public/private."
      role="Student"
      endpoint="GET /api/v1/students/me/portfolio"
      notes={[
        'Không hiển thị dữ liệu mẫu.',
        'Chỉ cho publish output dự án khi dự án không bảo mật và cho phép portfolio.'
      ]}
      backTo="/student/dashboard"
    />
  );
}

export function StudentWalletShellPage() {
  return (
    <FeatureShellPage
      icon={<WalletOutlined />}
      title="Ví D4U"
      description="Ví là ledger nội bộ của D4U. Rút tiền được Admin/Finance xử lý thủ công sau chuyển khoản ngoài hệ thống."
      role="Student"
      endpoint="GET /api/v1/wallets/me"
      notes={['Không thiết kế automatic bank payout.', 'Không đồng bộ số dư ngân hàng thật trong MVP.']}
      backTo="/student/dashboard"
    />
  );
}

const isUsablePaymentMethod = (method) => {
  if (typeof method?.isUsableForWithdrawal === 'boolean') {
    return method.isUsableForWithdrawal;
  }

  return method?.status === 'ACTIVE' && method?.bankName && method?.hasFullAccountNumber;
};

const requiresPaymentMethodRecreation = (method) => {
  if (typeof method?.requiresRecreation === 'boolean') {
    return method.requiresRecreation;
  }

  return method?.status === 'ACTIVE' && method?.bankName && !method?.hasFullAccountNumber;
};

const getPaymentMethodIssue = (method) => {
  if (method?.validationIssueMessage) return method.validationIssueMessage;
  if (method?.status !== 'ACTIVE') return 'Tài khoản chưa hoạt động';
  if (!method?.bankName) return 'Thiếu ngân hàng';
  if (!method?.accountHolderName) return 'Thiếu chủ tài khoản';
  if (requiresPaymentMethodRecreation(method)) return 'Tài khoản cũ cần tạo lại';
  if (!method?.hasFullAccountNumber) return 'Thiếu số tài khoản đầy đủ';
  return null;
};

const getPaymentMethodLabel = (method) => [
  method?.bankName || 'Thiếu ngân hàng',
  method?.accountHolderName || 'Thiếu chủ tài khoản',
  method?.maskedAccountNumber || 'Thiếu số TK'
].join(' - ');

function getWalletStatusMeta(status) {
  switch (status) {
    case 'ACTIVE':
      return {
        title: 'Hoạt động bình thường',
        helper: 'Bạn có thể gửi yêu cầu rút tiền khi đủ số dư và đã lưu tài khoản nhận tiền.',
        badge: 'ACTIVE'
      };
    case 'SUSPENDED':
      return {
        title: 'Tạm ngưng',
        helper: 'Ví đang tạm ngưng nên chưa thể tạo yêu cầu rút tiền.',
        badge: 'SUSPENDED'
      };
    default:
      return {
        title: status || 'Chưa có',
        helper: 'Trạng thái ví sẽ ảnh hưởng đến khả năng tạo yêu cầu rút tiền.',
        badge: status || null
      };
  }
}

function WalletHeroInfo() {
  return (
    <div className="wallet-info-strip">
      <div>
        <strong>Ví D4U là số dư nội bộ của nền tảng.</strong>
        <span> Số dư này không phải tài khoản ngân hàng và chỉ tăng sau khi dự án được release escrow.</span>
      </div>
      <div>
        <strong>Rút tiền vẫn được duyệt thủ công.</strong>
        <span> Admin/Finance sẽ xử lý chuyển khoản ngoài hệ thống sau khi yêu cầu được xác nhận.</span>
      </div>
    </div>
  );
}

function WalletSummaryCards({ wallet, loading }) {
  const walletStatus = getWalletStatusMeta(wallet?.status ?? 'ACTIVE');
  const summaries = [
    {
      label: 'Có thể rút',
      value: formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency),
      helper: 'Số dư khả dụng để gửi yêu cầu rút tiền ngay.'
    },
    {
      label: 'Đang khóa',
      value: formatCurrency(wallet?.lockedBalance ?? 0, wallet?.currency),
      helper: 'Khoản tiền đang gắn với yêu cầu rút tiền chờ xử lý.'
    }
  ];

  return (
    <div className="wallet-summary-grid-refined">
      {summaries.map((item) => (
        <Card key={item.label} className="wallet-balance-card" loading={loading}>
          <span className="wallet-balance-label">{item.label}</span>
          <strong className="wallet-balance-value">{item.value}</strong>
          <p className="wallet-balance-helper">{item.helper}</p>
        </Card>
      ))}

      <Card className="wallet-status-card" loading={loading}>
        <span className="wallet-balance-label">Trạng thái ví</span>
        <div className="wallet-status-main">
          <strong className="wallet-status-title">{walletStatus.title}</strong>
          {walletStatus.badge ? <StatusBadge status={walletStatus.badge} /> : null}
        </div>
        <p className="wallet-balance-helper">{walletStatus.helper}</p>
      </Card>
    </div>
  );
}

function SavedPayoutAccountsSection({
  sectionError,
  paymentMethods,
  selectedPayoutAccountId,
  usablePaymentMethods,
  recreateRequiredMethods,
  onSelectAccount,
  form,
  savingMethod,
  onSubmit
}) {
  const hasUsableAccounts = usablePaymentMethods.length > 0;

  return (
    <Card className="wallet-card wallet-section-card" title="Tài khoản nhận tiền">
      {sectionError ? <Alert type="warning" showIcon className="form-alert" message={sectionError} /> : null}
      {!hasUsableAccounts && recreateRequiredMethods.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Các tài khoản đã lưu hiện chưa dùng được để rút tiền."
          description="Hãy thêm một tài khoản nhận tiền mới đầy đủ thông tin để tiếp tục tạo yêu cầu rút tiền."
        />
      ) : null}

      <div className="wallet-section-block">
        <div className="wallet-section-heading">
          <div>
            <h3>Tài khoản đã lưu</h3>
            <p>Chọn nhanh một tài khoản hợp lệ để dùng cho yêu cầu rút tiền ở cột bên phải.</p>
          </div>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="wallet-empty-block">
            <strong>Chưa có tài khoản nhận tiền nào được lưu.</strong>
            <span>Thêm tài khoản đầu tiên của bạn để có thể tạo yêu cầu rút tiền.</span>
          </div>
        ) : (
          <div className="payout-account-list">
            {paymentMethods.map((method) => {
              const issue = getPaymentMethodIssue(method);
              const isSelected = method.id === selectedPayoutAccountId;
              const isUsable = isUsablePaymentMethod(method);

              return (
                <div
                  key={method.id}
                  className={`payout-account-item${isSelected ? ' is-selected' : ''}${!isUsable ? ' is-disabled' : ''}`}
                >
                  <div className="payout-account-main">
                    <div className="payout-account-header">
                      <strong>{method.bankName || 'Thiếu ngân hàng'}</strong>
                      <div className="payout-account-badges">
                        {method.isDefault ? <Tag className="status-badge" color="processing">Mặc định</Tag> : null}
                        {isUsable ? <Tag className="status-badge" color="success">Dùng được</Tag> : null}
                        {issue && !isUsable ? (
                          <Tag className="status-badge" color={method.requiresRecreation ? 'warning' : 'default'}>
                            {method.requiresRecreation ? 'Cần cập nhật' : 'Chưa sẵn sàng'}
                          </Tag>
                        ) : null}
                      </div>
                    </div>
                    <div className="payout-account-meta">
                      <span>{method.maskedAccountNumber || 'Thiếu số TK'}</span>
                      <span>{method.accountHolderName || 'Thiếu chủ tài khoản'}</span>
                    </div>
                    {issue && !isUsable ? (
                      <p className="payout-account-issue">{issue}</p>
                    ) : (
                      <p className="payout-account-issue">Có thể dùng lại trực tiếp cho yêu cầu rút tiền mới.</p>
                    )}
                  </div>

                  <div className="payout-account-action">
                    <Button
                      type={isSelected ? 'default' : 'primary'}
                      className={isSelected ? 'wallet-inline-button wallet-inline-button-selected' : 'wallet-inline-button'}
                      disabled={!isUsable || isSelected}
                      onClick={() => onSelectAccount(method.id)}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn để rút'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="wallet-section-block wallet-section-block-form">
        <div className="wallet-section-heading">
          <div>
            <h3>Thêm tài khoản mới</h3>
            <p>Lưu thêm tài khoản nhận tiền mới nếu bạn muốn rút về ngân hàng khác.</p>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <div className="wallet-account-form-grid">
            <Form.Item name="bankName" label="Ngân hàng" rules={[{ required: true, message: 'Nhập tên ngân hàng.' }]}>
              <Input maxLength={120} placeholder="Ví dụ: Vietcombank, MB Bank, Techcombank" />
            </Form.Item>
            <Form.Item name="bankCode" label="Mã ngân hàng" tooltip="Không bắt buộc trong MVP. Có thể dùng mã như VCB, MB, TCB nếu biết.">
              <Input maxLength={30} placeholder="Không bắt buộc" />
            </Form.Item>
            <Form.Item name="accountHolderName" label="Chủ tài khoản" rules={[{ required: true, message: 'Nhập tên chủ tài khoản.' }]}>
              <Input maxLength={120} />
            </Form.Item>
            <Form.Item
              name="accountNumber"
              label="Số tài khoản"
              rules={[
                { required: true, message: 'Nhập số tài khoản.' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const digits = String(value).replace(/\D/g, '');
                    return digits.length >= 4
                      ? Promise.resolve()
                      : Promise.reject(new Error('Số tài khoản phải có ít nhất 4 chữ số.'));
                  }
                }
              ]}
            >
              <Input maxLength={40} inputMode="numeric" />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" loading={savingMethod}>
            Lưu tài khoản
          </Button>
        </Form>
      </div>
    </Card>
  );
}

function WithdrawalRequestCard({
  hasActiveWithdrawal,
  usablePaymentMethods,
  recreateRequiredMethods,
  withdrawalForm,
  createWithdrawal,
  paymentMethodOptions,
  minimumWithdrawalAmount,
  withdrawalFee,
  withdrawalNetAmount,
  wallet,
  withdrawalBlockingMessage,
  requestingWithdrawal,
  canRequestWithdrawal
}) {
  return (
    <Card className="wallet-card wallet-section-card" title="Tạo yêu cầu rút tiền">
      {hasActiveWithdrawal ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Bạn đang có một yêu cầu rút tiền chờ xử lý."
        />
      ) : null}

      {!usablePaymentMethods.length && recreateRequiredMethods.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Hãy thêm tài khoản nhận tiền mới ở cột bên trái trước khi gửi yêu cầu rút tiền."
        />
      ) : null}

      {!usablePaymentMethods.length && recreateRequiredMethods.length === 0 ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Bạn cần lưu ít nhất một tài khoản nhận tiền hợp lệ trước khi rút tiền."
        />
      ) : null}

      <Form form={withdrawalForm} layout="vertical" onFinish={createWithdrawal}>
        <Form.Item
          name="payoutAccountId"
          label="1. Chọn tài khoản nhận tiền"
          rules={[{ required: true, message: 'Chọn tài khoản nhận tiền.' }]}
        >
          <Select
            placeholder="Chọn tài khoản đã lưu"
            options={paymentMethodOptions}
          />
        </Form.Item>
        <Form.Item
          name="amount"
          label="2. Nhập số tiền rút"
          rules={[
            { required: true, message: 'Nhập số tiền rút.' },
            {
              validator: (_, value) => {
                if (value == null || value === '') return Promise.resolve();
                return Number(value) >= minimumWithdrawalAmount
                  ? Promise.resolve()
                  : Promise.reject(new Error('Số tiền rút tối thiểu là 50.000 VND.'));
              }
            }
          ]}
        >
          <InputNumber min={0} step={10000} style={{ width: '100%' }} />
        </Form.Item>

        <div className="wallet-settlement-box">
          <div className="wallet-settlement-row">
            <span>3. Phí rút tiền</span>
            <strong>{formatCurrency(withdrawalFee, wallet?.currency)}</strong>
          </div>
          <div className="wallet-settlement-row wallet-settlement-row-emphasis">
            <span>4. Thực nhận</span>
            <strong>{formatCurrency(withdrawalNetAmount, wallet?.currency)}</strong>
          </div>
          <div className="wallet-settlement-note">
            <CheckCircleFilled />
            <span>{withdrawalBlockingMessage ?? 'Phí rút tiền cố định là 5,000 VND cho mỗi yêu cầu.'}</span>
          </div>
        </div>

        <Button type="primary" htmlType="submit" loading={requestingWithdrawal} disabled={!canRequestWithdrawal}>
          5. Gửi yêu cầu
        </Button>
      </Form>
    </Card>
  );
}

function WithdrawalHistorySection({ sectionError, withdrawals, loading, highlightedWithdrawalId, wallet }) {
  const columns = [
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => (value === 'COMPLETED' ? <Tag className="status-badge" color="success">Đã chuyển khoản</Tag> : <StatusBadge status={value} />)
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value, wallet?.currency)
    },
    {
      title: 'Thực nhận',
      dataIndex: 'netAmount',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value, wallet?.currency)
    },
    {
      title: 'Tài khoản nhận',
      width: 260,
      render: (_, row) => renderPrimaryCell(
        row.bankName || 'Thiếu ngân hàng',
        `${row.accountHolderName || 'Thiếu chủ tài khoản'} • ${row.maskedAccountNumber || 'Thiếu số TK'}`
      )
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'requestedAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    }
  ];

  return (
    <Card className="table-card wallet-card wallet-section-card" title="Lịch sử rút tiền">
      {sectionError ? <Alert type="warning" showIcon className="form-alert" message={sectionError} /> : null}
      <Table
        className="dashboard-data-table withdrawal-history-table"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={withdrawals}
        scroll={{ x: 920 }}
        locale={{ emptyText: 'Bạn chưa có yêu cầu rút tiền nào.' }}
        rowClassName={(row) => row.id === highlightedWithdrawalId ? 'withdrawal-row-highlight withdrawal-row-soft-highlight' : ''}
        expandable={{
          expandedRowRender: (row) => (
            <div className="withdrawal-history-expanded">
              <div>
                <span>Bắt đầu xử lý</span>
                <strong>{row.processingStartedAt ? formatDate(row.processingStartedAt) : 'Chưa có'}</strong>
              </div>
              <div>
                <span>Thời gian chuyển</span>
                <strong>{row.transferredAt ? formatDate(row.transferredAt) : 'Chưa có'}</strong>
              </div>
              <div>
                <span>Mã giao dịch NH</span>
                <strong>{row.bankTransactionReference || 'Chưa có'}</strong>
              </div>
              <div>
                <span>Lý do thất bại</span>
                <strong>{row.failureReason || 'Không có'}</strong>
              </div>
            </div>
          )
        }}
      />
    </Card>
  );
}

export function StudentWalletPage() {
  return (
    <StudentReadinessGate
      profileTitle="Tạo hồ sơ sinh viên trước khi dùng ví D4U"
      profileDescription="Ví D4U cần hồ sơ sinh viên để khởi tạo ledger nội bộ, lưu tài khoản nhận tiền và theo dõi các yêu cầu rút tiền của bạn."
    >
      <StudentWalletPageContent />
    </StudentReadinessGate>
  );
}

function StudentWalletPageContent() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [withdrawalForm] = Form.useForm();
  const withdrawalAmount = Number(Form.useWatch('amount', withdrawalForm) ?? 0);
  const selectedPayoutAccountId = Form.useWatch('payoutAccountId', withdrawalForm);
  const [wallet, setWallet] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [error, setError] = useState(null);
  const [sectionErrors, setSectionErrors] = useState({});

  const loadWallet = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
      setSectionErrors({});
    }
    try {
      const [walletResult, methodResult, withdrawalResult] = await Promise.allSettled([
        walletApi.getMyWallet(),
        walletApi.listPaymentMethods(),
        walletApi.listWithdrawalRequests()
      ]);

      if (walletResult.status === 'rejected') {
        throw walletResult.reason;
      }

      setWallet(walletResult.value);
      setPaymentMethods(methodResult.status === 'fulfilled' ? methodResult.value : []);
      setWithdrawals(withdrawalResult.status === 'fulfilled' ? withdrawalResult.value : []);
      setSectionErrors({
        methods: methodResult.status === 'rejected'
          ? getApiErrorMessage(methodResult.reason, 'Không thể tải tài khoản nhận tiền.')
          : null,
        withdrawals: withdrawalResult.status === 'rejected'
          ? getApiErrorMessage(withdrawalResult.reason, 'Không thể tải yêu cầu rút tiền.')
          : null
      });
    } catch (requestError) {
      if (!silent) {
        setError(getApiErrorMessage(requestError, 'Không thể tải ví D4U.'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const hasActiveRequest = withdrawals.some((withdrawal) => ['PENDING', 'PROCESSING'].includes(withdrawal.status));
    if (!hasActiveRequest) return undefined;

    const timerId = window.setInterval(() => loadWallet({ silent: true }), 30000);
    return () => window.clearInterval(timerId);
  }, [withdrawals]);

  useEffect(() => {
    const refreshVisibleWallet = () => {
      if (document.visibilityState === 'visible') {
        loadWallet({ silent: true });
      }
    };

    window.addEventListener('focus', refreshVisibleWallet);
    document.addEventListener('visibilitychange', refreshVisibleWallet);
    return () => {
      window.removeEventListener('focus', refreshVisibleWallet);
      document.removeEventListener('visibilitychange', refreshVisibleWallet);
    };
  }, []);

  useEffect(() => {
    const selectedMethod = paymentMethods.find((method) => method.id === selectedPayoutAccountId);
    if (selectedMethod && isUsablePaymentMethod(selectedMethod)) {
      return;
    }

    const nextUsableMethod = paymentMethods.find((method) => method.isDefault && isUsablePaymentMethod(method)) ??
      paymentMethods.find(isUsablePaymentMethod);

    withdrawalForm.setFieldsValue({ payoutAccountId: nextUsableMethod?.id });
  }, [paymentMethods, selectedPayoutAccountId, withdrawalForm]);

  const createPaymentMethod = async (values) => {
    setSavingMethod(true);
    try {
      const savedMethod = await walletApi.createPaymentMethod({
        bankName: values.bankName,
        bankCode: values.bankCode,
        accountHolderName: values.accountHolderName,
        accountNumber: values.accountNumber,
        isDefault: true
      });
      message.success('Đã lưu tài khoản nhận tiền.');
      form.resetFields();
      await loadWallet();
      if (isUsablePaymentMethod(savedMethod)) {
        withdrawalForm.setFieldsValue({ payoutAccountId: savedMethod.id });
      }
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu tài khoản nhận tiền.'));
    } finally {
      setSavingMethod(false);
    }
  };

  const createWithdrawal = async (values) => {
    setRequestingWithdrawal(true);
    try {
      await walletApi.createWithdrawalRequest({
        paymentMethodId: values.payoutAccountId,
        amount: values.amount
      });
      message.success('Đã tạo yêu cầu rút tiền.');
      withdrawalForm.setFieldsValue({ amount: undefined });
      await loadWallet();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tạo yêu cầu rút tiền.'));
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadWallet} />;

  const hasActiveWithdrawal = withdrawals.some((withdrawal) => ['PENDING', 'PROCESSING'].includes(withdrawal.status));
  const highlightedWithdrawalId = searchParams.get('withdrawalId');
  const usablePaymentMethods = paymentMethods.filter(isUsablePaymentMethod);
  const unusablePaymentMethods = paymentMethods.filter((method) => !isUsablePaymentMethod(method));
  const recreateRequiredMethods = unusablePaymentMethods.filter(requiresPaymentMethodRecreation);
  const selectedPayoutAccount = usablePaymentMethods.find((method) => method.id === selectedPayoutAccountId);
  const paymentMethodOptions = usablePaymentMethods.map((method) => ({
      value: method.id,
      label: getPaymentMethodLabel(method)
    }));
  const minimumWithdrawalAmount = 50000;
  const withdrawalFee = 5000;
  const withdrawalNetAmount = Math.max(0, withdrawalAmount - withdrawalFee);
  const hasEnoughBalance = wallet ? wallet.availableBalance >= withdrawalAmount : false;
  const canRequestWithdrawal = usablePaymentMethods.length > 0 &&
    Boolean(selectedPayoutAccount) &&
    !hasActiveWithdrawal &&
    withdrawalAmount >= minimumWithdrawalAmount &&
    hasEnoughBalance;
  const withdrawalBlockingMessage = (() => {
    if (usablePaymentMethods.length === 0 && recreateRequiredMethods.length > 0) {
      return 'Tài khoản nhận tiền cũ không còn đủ dữ liệu để dùng tiếp. Vui lòng tạo lại tài khoản mới trước khi rút tiền.';
    }
    if (usablePaymentMethods.length === 0) return 'Bạn cần lưu một tài khoản nhận tiền hợp lệ trước khi rút tiền.';
    if (!selectedPayoutAccount) return 'Chọn tài khoản nhận tiền hợp lệ.';
    if (hasActiveWithdrawal) return 'Bạn đang có yêu cầu rút tiền chờ xử lý.';
    if (!withdrawalAmount) return 'Nhập số tiền muốn rút. Số tiền tối thiểu là 50.000 VND.';
    if (withdrawalAmount < minimumWithdrawalAmount) return 'Số tiền rút tối thiểu là 50.000 VND.';
    if (!hasEnoughBalance) return `Số dư có thể rút hiện tại chỉ còn ${formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}.`;
    return null;
  })();

  return (
    <>
      <PageHeader
        icon={<WalletOutlined />}
        title="Ví D4U"
        description="Theo dõi số dư khả dụng và gửi yêu cầu rút tiền từ ví nội bộ của bạn."
        extra={<Button onClick={loadWallet}>Làm mới</Button>}
      />
      <WalletHeroInfo />
      <WalletSummaryCards wallet={wallet} loading={loading} />

      <div className="wallet-workbench-grid">
        <SavedPayoutAccountsSection
          sectionError={sectionErrors.methods}
          paymentMethods={paymentMethods}
          selectedPayoutAccountId={selectedPayoutAccountId}
          usablePaymentMethods={usablePaymentMethods}
          recreateRequiredMethods={recreateRequiredMethods}
          onSelectAccount={(accountId) => withdrawalForm.setFieldsValue({ payoutAccountId: accountId })}
          form={form}
          savingMethod={savingMethod}
          onSubmit={createPaymentMethod}
        />

        <WithdrawalRequestCard
          hasActiveWithdrawal={hasActiveWithdrawal}
          usablePaymentMethods={usablePaymentMethods}
          recreateRequiredMethods={recreateRequiredMethods}
          withdrawalForm={withdrawalForm}
          createWithdrawal={createWithdrawal}
          paymentMethodOptions={paymentMethodOptions}
          minimumWithdrawalAmount={minimumWithdrawalAmount}
          withdrawalFee={withdrawalFee}
          withdrawalNetAmount={withdrawalNetAmount}
          wallet={wallet}
          withdrawalBlockingMessage={withdrawalBlockingMessage}
          requestingWithdrawal={requestingWithdrawal}
          canRequestWithdrawal={canRequestWithdrawal}
        />
      </div>

      <WithdrawalHistorySection
        sectionError={sectionErrors.withdrawals}
        withdrawals={withdrawals}
        loading={loading}
        highlightedWithdrawalId={highlightedWithdrawalId}
        wallet={wallet}
      />
    </>
  );
}

export function StudentRatingsPage() {
  return <MyRatingsPage role="STUDENT" />;
}
