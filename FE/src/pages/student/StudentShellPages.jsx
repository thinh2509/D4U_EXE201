import { FileDoneOutlined, FolderOpenOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Statistic, Table } from 'antd';
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
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [error, setError] = useState(null);

  const loadWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletResponse, transactionRows, methodRows, withdrawalRows] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.listTransactions(),
        walletApi.listPaymentMethods(),
        walletApi.listWithdrawalRequests()
      ]);
      setWallet(walletResponse);
      setTransactions(transactionRows);
      setPaymentMethods(methodRows);
      setWithdrawals(withdrawalRows);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Khong the tai vi D4U.'));
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
      message.success('Da luu phuong thuc nhan tien.');
      form.resetFields();
      await loadWallet();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the luu phuong thuc nhan tien.'));
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
      message.success('Da tao yeu cau rut tien.');
      withdrawalForm.resetFields();
      await loadWallet();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the tao yeu cau rut tien.'));
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadWallet} />;

  const transactionColumns = [
    { title: 'Loai', dataIndex: 'type', render: (value) => <StatusBadge status={value} /> },
    { title: 'So tien', dataIndex: 'amount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'So du sau GD', dataIndex: 'balanceAfter', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Ghi chu', dataIndex: 'description' },
    { title: 'Thoi gian', dataIndex: 'createdAt', render: formatDate }
  ];

  const withdrawalColumns = [
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'So tien', dataIndex: 'amount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Phi', dataIndex: 'feeAmount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Nhan thuc te', dataIndex: 'netAmount', render: (value) => formatCurrency(value, wallet?.currency) },
    { title: 'Tai khoan', dataIndex: 'maskedAccountNumber' },
    { title: 'Ngay yeu cau', dataIndex: 'requestedAt', render: formatDate }
  ];

  return (
    <>
      <PageHeader
        icon={<WalletOutlined />}
        title="Vi D4U"
        description="Theo doi ledger noi bo, nhan tien sau khi escrow release va tao yeu cau rut tien thu cong."
        extra={<Button onClick={loadWallet}>Lam moi</Button>}
      />
      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="D4U chi ghi nhan so du noi bo. Admin/Finance se chuyen khoan thu cong ben ngoai he thong khi duyet withdrawal."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="Co the rut" value={wallet?.availableBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="Dang khoa" value={wallet?.lockedBalance ?? 0} formatter={(value) => formatCurrency(value, wallet?.currency)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading}>
            <Statistic title="Trang thai vi" value={wallet?.status ?? 'ACTIVE'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="section-grid">
        <Col xs={24} lg={12}>
          <Card title="Phuong thuc nhan tien">
            <Form form={form} layout="vertical" onFinish={createPaymentMethod}>
              <Form.Item name="accountHolderName" label="Chu tai khoan" rules={[{ required: true, message: 'Nhap ten chu tai khoan.' }]}>
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item name="accountNumber" label="So tai khoan" rules={[{ required: true, message: 'Nhap so tai khoan.' }]}>
                <Input maxLength={40} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingMethod}>Luu tai khoan</Button>
            </Form>
            <Table
              className="embedded-table"
              size="small"
              rowKey="id"
              dataSource={paymentMethods}
              columns={[
                { title: 'Chu TK', dataIndex: 'accountHolderName' },
                { title: 'So TK', dataIndex: 'maskedAccountNumber' },
                { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tao yeu cau rut tien">
            <Form form={withdrawalForm} layout="vertical" onFinish={createWithdrawal}>
              <Form.Item name="paymentMethodId" label="Tai khoan nhan" rules={[{ required: true, message: 'Chon tai khoan nhan.' }]}>
                <select className="native-select">
                  <option value="">Chon tai khoan</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>{method.accountHolderName} - {method.maskedAccountNumber}</option>
                  ))}
                </select>
              </Form.Item>
              <Form.Item name="amount" label="So tien rut" rules={[{ required: true, message: 'Nhap so tien rut.' }]}>
                <InputNumber min={50000} step={50000} style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={requestingWithdrawal} disabled={paymentMethods.length === 0}>
                Gui yeu cau
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card className="table-card" title="Yeu cau rut tien">
        <Table rowKey="id" loading={loading} columns={withdrawalColumns} dataSource={withdrawals} scroll={{ x: 900 }} />
      </Card>
      <Card className="table-card" title="Ledger">
        <Table rowKey="id" loading={loading} columns={transactionColumns} dataSource={transactions} scroll={{ x: 980 }} />
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
