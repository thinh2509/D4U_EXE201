import { FileDoneOutlined, FolderOpenOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Table, Tag } from 'antd';
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
      render: (value, row) => renderPrimaryCell(value, `Offer: ${formatCurrency(row.offeredAmount)}`)
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
        description="Chấp nhận hoặc từ chối offer trước. Sau khi bạn chấp nhận, SME mới thanh toán escrow qua PayOS."
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

const isValidPaymentMethod = (method) => method?.status === 'ACTIVE' && method?.bankName && method?.hasFullAccountNumber;

const isRecreateRequiredPaymentMethod = (method) => method?.status === 'ACTIVE' && method?.bankName && !method?.hasFullAccountNumber;

const getPaymentMethodIssue = (method) => {
  if (method?.status !== 'ACTIVE') return 'Tài khoản chưa active';
  if (!method?.bankName) return 'Thiếu ngân hàng';
  if (isRecreateRequiredPaymentMethod(method)) return 'Tài khoản cũ cần tạo lại';
  if (!method?.hasFullAccountNumber) return 'Thiếu số tài khoản đầy đủ';
  return null;
};

const getPaymentMethodLabel = (method) => [
  method?.bankName || 'Thiếu ngân hàng',
  method?.accountHolderName || 'Thiếu chủ tài khoản',
  method?.maskedAccountNumber || 'Thiếu số TK'
].join(' - ');

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
  const selectedPaymentMethodId = Form.useWatch('paymentMethodId', withdrawalForm);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
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
      const [walletResult, transactionResult, methodResult, withdrawalResult] = await Promise.allSettled([
        walletApi.getMyWallet(),
        walletApi.listTransactions(),
        walletApi.listPaymentMethods(),
        walletApi.listWithdrawalRequests()
      ]);

      if (walletResult.status === 'rejected') {
        throw walletResult.reason;
      }

      setWallet(walletResult.value);
      setTransactions(transactionResult.status === 'fulfilled' ? transactionResult.value : []);
      setPaymentMethods(methodResult.status === 'fulfilled' ? methodResult.value : []);
      setWithdrawals(withdrawalResult.status === 'fulfilled' ? withdrawalResult.value : []);
      setSectionErrors({
        transactions: transactionResult.status === 'rejected'
          ? getApiErrorMessage(transactionResult.reason, 'Không thể tải ledger.')
          : null,
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
    if (!selectedPaymentMethodId) return;
    const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId);
    if (selectedMethod && !isValidPaymentMethod(selectedMethod)) {
      withdrawalForm.setFieldsValue({ paymentMethodId: undefined });
    }
  }, [paymentMethods, selectedPaymentMethodId, withdrawalForm]);

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
      if (isValidPaymentMethod(savedMethod)) {
        withdrawalForm.setFieldsValue({ paymentMethodId: savedMethod.id });
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
        paymentMethodId: values.paymentMethodId,
        amount: values.amount
      });
      message.success('Đã tạo yêu cầu rút tiền.');
      withdrawalForm.resetFields();
      await loadWallet();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tạo yêu cầu rút tiền.'));
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadWallet} />;

  const transactionColumns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value, wallet?.currency)
    },
    {
      title: 'Số dư sau GD',
      dataIndex: 'balanceAfter',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value, wallet?.currency)
    },
    {
      title: 'Ghi chú',
      dataIndex: 'description',
      render: (value) => <span className="table-subtext strong">{value || 'Không có'}</span>
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    }
  ];

  const withdrawalColumns = [
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
      title: 'Phí',
      dataIndex: 'feeAmount',
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
      title: 'Tài khoản',
      width: 220,
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
    },
    {
      title: 'Bắt đầu xử lý',
      dataIndex: 'processingStartedAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Thời gian chuyển',
      dataIndex: 'transferredAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Mã giao dịch NH',
      dataIndex: 'bankTransactionReference',
      render: (value) => <span className="table-subtext strong">{value || 'Chưa có'}</span>
    },
    {
      title: 'Lý do thất bại',
      dataIndex: 'failureReason',
      render: (value) => <span className="table-subtext strong">{value || 'Không có'}</span>
    }
  ];

  const paymentMethodColumns = [
    {
      title: 'Ngân hàng',
      dataIndex: 'bankName',
      render: (value, row) => renderPrimaryCell(value || 'Thiếu ngân hàng', row.accountHolderName)
    },
    {
      title: 'Số TK',
      dataIndex: 'maskedAccountNumber',
      render: (value) => <span className="table-subtext strong">{value || 'Thiếu số TK'}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Ghi chú',
      render: (_, row) => {
        const issue = getPaymentMethodIssue(row);
        return issue ? <Tag className="status-badge" color="warning">{issue}</Tag> : <Tag className="status-badge" color="success">Có thể rút</Tag>;
      }
    }
  ];

  const hasActiveWithdrawal = withdrawals.some((withdrawal) => ['PENDING', 'PROCESSING'].includes(withdrawal.status));
  const highlightedWithdrawalId = searchParams.get('withdrawalId');
  const validPaymentMethods = paymentMethods.filter(isValidPaymentMethod);
  const invalidPaymentMethods = paymentMethods.filter((method) => !isValidPaymentMethod(method));
  const recreateRequiredMethods = invalidPaymentMethods.filter(isRecreateRequiredPaymentMethod);
  const selectedPaymentMethod = validPaymentMethods.find((method) => method.id === selectedPaymentMethodId);
  const paymentMethodOptions = [
    ...validPaymentMethods.map((method) => ({
      value: method.id,
      label: getPaymentMethodLabel(method)
    })),
    ...invalidPaymentMethods.map((method) => ({
      value: method.id,
      label: `${getPaymentMethodLabel(method)} (${getPaymentMethodIssue(method)})`,
      disabled: true
    }))
  ];
  const minimumWithdrawalAmount = 50000;
  const withdrawalFee = 5000;
  const withdrawalNetAmount = Math.max(0, withdrawalAmount - withdrawalFee);
  const hasEnoughBalance = wallet ? wallet.availableBalance >= withdrawalAmount : false;
  const canRequestWithdrawal = validPaymentMethods.length > 0 &&
    Boolean(selectedPaymentMethod) &&
    !hasActiveWithdrawal &&
    withdrawalAmount >= minimumWithdrawalAmount &&
    hasEnoughBalance;
  const withdrawalBlockingMessage = (() => {
    if (validPaymentMethods.length === 0 && recreateRequiredMethods.length > 0) {
      return 'Tài khoản nhận tiền cũ không còn đủ dữ liệu để dùng tiếp. Vui lòng tạo lại tài khoản mới trước khi rút tiền.';
    }
    if (validPaymentMethods.length === 0) return 'Bạn cần lưu tài khoản ngân hàng có đầy đủ số tài khoản trước khi rút tiền.';
    if (!selectedPaymentMethod) return 'Chọn tài khoản nhận tiền hợp lệ.';
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
        description="Theo dõi tiền nhận sau khi escrow release và tạo yêu cầu rút tiền thủ công."
        extra={<Button onClick={loadWallet}>Làm mới</Button>}
      />
      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="D4U ghi nhận số dư nội bộ. Admin/Finance sẽ chuyển khoản thủ công ngoài hệ thống khi duyệt yêu cầu rút tiền."
        description="Sau khi SME duyệt Final, hệ thống release escrow vào ví Student. Bạn có thể tạo yêu cầu rút tiền khi số dư khả dụng đủ tối thiểu 50,000 VND."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="wallet-summary-card" loading={loading}>
            <Statistic title="Có thể rút" value={wallet?.availableBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="wallet-summary-card" loading={loading}>
            <Statistic title="Đang khóa" value={wallet?.lockedBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="wallet-summary-card" loading={loading}>
            <Statistic title="Trạng thái ví" value={wallet?.status ?? 'ACTIVE'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="section-grid">
        <Col xs={24} lg={12}>
          <Card className="wallet-card" title="Tài khoản nhận tiền">
            {sectionErrors.methods ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.methods} /> : null}
            {recreateRequiredMethods.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                className="form-alert"
                message="Có tài khoản nhận tiền cũ cần tạo lại."
                description="Một hoặc nhiều tài khoản đã lưu không còn đủ dữ liệu mã hóa để tiếp tục rút tiền. Bạn chỉ cần tạo lại tài khoản mới, không phải do bạn nhập thiếu ở lần trước."
              />
            ) : null}
            <Form form={form} layout="vertical" onFinish={createPaymentMethod}>
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
              <Button type="primary" htmlType="submit" loading={savingMethod}>Lưu tài khoản</Button>
            </Form>
            <Table
              className="dashboard-data-table embedded-table"
              size="small"
              rowKey="id"
              dataSource={paymentMethods}
              columns={paymentMethodColumns}
              scroll={{ x: 720 }}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="wallet-card" title="Tạo yêu cầu rút tiền">
            {hasActiveWithdrawal && (
              <Alert
                type="warning"
                showIcon
                className="form-alert"
                message="Bạn đang có một yêu cầu rút tiền chờ xử lý. Hãy chờ Admin/Finance hoàn tất trước khi tạo yêu cầu mới."
              />
            )}
            {validPaymentMethods.length === 0 && recreateRequiredMethods.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                className="form-alert"
                message="Tài khoản nhận tiền cũ không còn dùng được."
                description="Hãy tạo lại một tài khoản nhận tiền mới ở cột bên trái rồi chọn lại tài khoản trước khi tạo yêu cầu rút tiền."
              />
            ) : null}
            {validPaymentMethods.length === 0 && recreateRequiredMethods.length === 0 ? (
              <Alert type="warning" showIcon className="form-alert" message="Bạn cần lưu tài khoản ngân hàng có đầy đủ số tài khoản trước khi rút tiền." />
            ) : null}
            <Form form={withdrawalForm} layout="vertical" onFinish={createWithdrawal}>
              <Form.Item name="paymentMethodId" label="Tài khoản nhận" rules={[{ required: true, message: 'Chọn tài khoản nhận.' }]}>
                <Select
                  placeholder="Chọn tài khoản"
                  options={paymentMethodOptions}
                />
              </Form.Item>
              <Form.Item
                name="amount"
                label="Số tiền rút"
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
              <div className="muted-text form-alert">
                <div>Phí rút tiền: <strong>{formatCurrency(withdrawalFee, wallet?.currency)}</strong></div>
                <div>Thực nhận: <strong>{formatCurrency(withdrawalNetAmount, wallet?.currency)}</strong></div>
                <div>{withdrawalBlockingMessage ?? 'Phí rút tiền cố định là 5,000 VND cho mỗi yêu cầu.'}</div>
              </div>
              <Button type="primary" htmlType="submit" loading={requestingWithdrawal} disabled={!canRequestWithdrawal}>
                Gửi yêu cầu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card className="table-card wallet-card" title="Yêu cầu rút tiền">
        {sectionErrors.withdrawals ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.withdrawals} /> : null}
        <Table
          className="dashboard-data-table"
          rowKey="id"
          loading={loading}
          columns={withdrawalColumns}
          dataSource={withdrawals}
          scroll={{ x: 1180 }}
          rowClassName={(row) => row.id === highlightedWithdrawalId ? 'withdrawal-row-highlight' : ''}
        />
      </Card>
      <Card className="table-card wallet-card" title="Ledger">
        {sectionErrors.transactions ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.transactions} /> : null}
        <Table
          className="dashboard-data-table"
          rowKey="id"
          loading={loading}
          columns={transactionColumns}
          dataSource={transactions}
          scroll={{ x: 980 }}
          expandable={{
            rowExpandable: (row) => row.grossAmount != null,
            expandedRowRender: (row) => (
              <Space wrap size="large">
                <span>Gross: <strong>{formatCurrency(row.grossAmount, wallet?.currency)}</strong></span>
                <span>Phí nền tảng: <strong>{formatCurrency(row.feeAmount, wallet?.currency)}</strong></span>
                <span>Student nhận: <strong>{formatCurrency(row.netAmount, wallet?.currency)}</strong></span>
              </Space>
            )
          }}
        />
      </Card>
    </>
  );
}

export function StudentRatingsPage() {
  return <MyRatingsPage role="STUDENT" />;
}
