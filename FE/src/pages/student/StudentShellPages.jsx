import { FileDoneOutlined, FolderOpenOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
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
        <Button type="primary" ghost onClick={() => navigate(`/student/projects/${row.projectId}`)}>
          Xem dự án
        </Button>
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

export function StudentWalletPage() {
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
