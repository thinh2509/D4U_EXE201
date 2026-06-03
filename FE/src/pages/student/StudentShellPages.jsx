import { FileDoneOutlined, FolderOpenOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Statistic, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { walletApi } from '../../services/walletApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { FeatureShellPage } from '../shared/MvpShellPage.jsx';

export function StudentApplicationsPage() {
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

  const columns = [
    {
      title: 'Dự án',
      dataIndex: 'projectTitle',
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="muted-text">{row.coverLetter?.slice(0, 90)}{row.coverLetter?.length > 90 ? '...' : ''}</div>
        </div>
      )
    },
    { title: 'Giá đề xuất', dataIndex: 'proposedPrice', render: (value) => formatCurrency(value) },
    { title: 'Application', dataIndex: 'applicationStatus', render: (value) => <StatusBadge status={value} /> },
    { title: 'Offer', dataIndex: 'offerStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Escrow', dataIndex: 'escrowStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Ngày gửi', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Space wrap>
          <Button type="primary" ghost onClick={() => navigate(`/student/projects/${row.projectId}`)}>
            Xem dự án
          </Button>
          {row.offerStatus === 'WAITING_ACCEPTANCE' ? (
            <Button type="primary" onClick={() => navigate('/student/offers')}>
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
          rowKey="applicationId"
          loading={loading}
          columns={columns}
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

  const columns = [
    {
      title: 'Dự án',
      dataIndex: 'projectTitle',
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="muted-text">Offer: {formatCurrency(row.offeredAmount)}</div>
        </div>
      )
    },
    { title: 'Offer', dataIndex: 'offerStatus', render: (value) => <StatusBadge status={value} /> },
    { title: 'Payment', dataIndex: 'paymentStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Escrow', dataIndex: 'escrowStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Space wrap>
          <Button
            type="primary"
            disabled={row.offerStatus !== 'WAITING_ACCEPTANCE'}
            loading={acting === row.offerId}
            onClick={() => accept(row.offerId)}
          >
            Chấp nhận
          </Button>
          <Button
            danger
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
          rowKey="offerId"
          loading={loading}
          columns={columns}
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

  const columns = [
    { title: 'Dự án', dataIndex: 'projectTitle' },
    { title: 'Trạng thái', dataIndex: 'projectStatus', render: (value) => <StatusBadge status={value} /> },
    { title: 'Ngân sách', dataIndex: 'budgetAmount', render: (value, row) => formatCurrency(value, row.currency) },
    { title: 'Escrow', dataIndex: 'escrowStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Deadline', dataIndex: 'totalDeadlineAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Button type="primary" ghost onClick={() => navigate(`/projects/${row.projectId}/execution`)}>
          Theo dõi
        </Button>
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
          rowKey="projectId"
          loading={loading}
          columns={columns}
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

export function StudentWalletPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [withdrawalForm] = Form.useForm();
  const withdrawalAmount = Number(Form.useWatch('amount', withdrawalForm) ?? 0);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [error, setError] = useState(null);
  const [sectionErrors, setSectionErrors] = useState({});

  const loadWallet = async () => {
    setLoading(true);
    setError(null);
    setSectionErrors({});
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
      setError(getApiErrorMessage(requestError, 'Không thể tải ví D4U.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const createPaymentMethod = async (values) => {
    setSavingMethod(true);
    try {
      await walletApi.createPaymentMethod({
        accountHolderName: values.accountHolderName,
        accountNumber: values.accountNumber,
        isDefault: true
      });
      message.success('Đã lưu tài khoản nhận tiền.');
      form.resetFields();
      await loadWallet();
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
    { title: 'Loại', dataIndex: 'type', render: (value) => <StatusBadge status={value} /> },
    { title: 'Số tiền', dataIndex: 'amount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Số dư sau GD', dataIndex: 'balanceAfter', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Ghi chú', dataIndex: 'description' },
    { title: 'Thời gian', dataIndex: 'createdAt', render: formatDate }
  ];

  const withdrawalColumns = [
    { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Số tiền', dataIndex: 'amount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Phí', dataIndex: 'feeAmount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Thực nhận', dataIndex: 'netAmount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Tài khoản', dataIndex: 'maskedAccountNumber' },
    { title: 'Ngày yêu cầu', dataIndex: 'requestedAt', render: formatDate },
    { title: 'Bắt đầu xử lý', dataIndex: 'processingStartedAt', render: formatDate },
    { title: 'Mã giao dịch NH', dataIndex: 'bankTransactionReference' },
    { title: 'Lý do thất bại', dataIndex: 'failureReason' }
  ];
  const hasActiveWithdrawal = withdrawals.some((withdrawal) => ['PENDING', 'PROCESSING'].includes(withdrawal.status));
  const activePaymentMethods = paymentMethods.filter((method) => method.status === 'ACTIVE');
  const withdrawalFee = withdrawalAmount > 0 ? 5000 : 0;
  const withdrawalNetAmount = Math.max(0, withdrawalAmount - withdrawalFee);
  const hasEnoughBalance = wallet ? wallet.availableBalance >= withdrawalAmount : false;
  const canRequestWithdrawal = activePaymentMethods.length > 0 &&
    !hasActiveWithdrawal &&
    withdrawalAmount >= 50000 &&
    hasEnoughBalance;

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
          <Card loading={loading}>
            <Statistic title="Có thể rút" value={wallet?.availableBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="Đang khóa" value={wallet?.lockedBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="Trạng thái ví" value={wallet?.status ?? 'ACTIVE'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="section-grid">
        <Col xs={24} lg={12}>
          <Card title="Tài khoản nhận tiền">
            {sectionErrors.methods ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.methods} /> : null}
            <Form form={form} layout="vertical" onFinish={createPaymentMethod}>
              <Form.Item name="accountHolderName" label="Chủ tài khoản" rules={[{ required: true, message: 'Nhập tên chủ tài khoản.' }]}>
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item name="accountNumber" label="Số tài khoản" rules={[{ required: true, message: 'Nhập số tài khoản.' }]}>
                <Input maxLength={40} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingMethod}>Lưu tài khoản</Button>
            </Form>
            <Table
              className="embedded-table"
              size="small"
              rowKey="id"
              dataSource={activePaymentMethods}
              columns={[
                { title: 'Chủ TK', dataIndex: 'accountHolderName' },
                { title: 'Số TK', dataIndex: 'maskedAccountNumber' },
                { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tạo yêu cầu rút tiền">
            {hasActiveWithdrawal && (
              <Alert
                type="warning"
                showIcon
                className="form-alert"
                message="Bạn đang có một yêu cầu rút tiền chờ xử lý. Hãy chờ Admin/Finance hoàn tất trước khi tạo yêu cầu mới."
              />
            )}
            {activePaymentMethods.length === 0 ? (
              <Alert type="warning" showIcon className="form-alert" message="Bạn cần lưu tài khoản ngân hàng trước khi rút tiền." />
            ) : null}
            <Form form={withdrawalForm} layout="vertical" onFinish={createWithdrawal}>
              <Form.Item name="paymentMethodId" label="Tài khoản nhận" rules={[{ required: true, message: 'Chọn tài khoản nhận.' }]}>
                <Select
                  placeholder="Chọn tài khoản"
                  options={activePaymentMethods.map((method) => ({
                    value: method.id,
                    label: `${method.accountHolderName} - ${method.maskedAccountNumber}`
                  }))}
                />
              </Form.Item>
              <Form.Item name="amount" label="Số tiền rút" rules={[{ required: true, message: 'Nhập số tiền rút.' }]}>
                <InputNumber min={50000} step={50000} style={{ width: '100%' }} />
              </Form.Item>
              <Alert
                type={withdrawalAmount > 0 && !hasEnoughBalance ? 'error' : 'info'}
                showIcon
                className="form-alert"
                message={`Phí rút tiền: ${formatCurrency(withdrawalFee, wallet?.currency)}. Thực nhận: ${formatCurrency(withdrawalNetAmount, wallet?.currency)}.`}
              />
              <Button type="primary" htmlType="submit" loading={requestingWithdrawal} disabled={!canRequestWithdrawal}>
                Gửi yêu cầu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card className="table-card" title="Yêu cầu rút tiền">
        {sectionErrors.withdrawals ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.withdrawals} /> : null}
        <Table rowKey="id" loading={loading} columns={withdrawalColumns} dataSource={withdrawals} scroll={{ x: 900 }} />
      </Card>
      <Card className="table-card" title="Ledger">
        {sectionErrors.transactions ? <Alert type="warning" showIcon className="form-alert" message={sectionErrors.transactions} /> : null}
        <Table
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
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Đánh giá"
      description="Đánh giá SME sau khi dự án hoàn thành trong thời hạn cho phép."
      role="Student"
      endpoint="GET /api/v1/ratings/me"
      backTo="/student/dashboard"
    />
  );
}
