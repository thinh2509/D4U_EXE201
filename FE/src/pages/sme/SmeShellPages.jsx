import { BulbOutlined, CreditCardOutlined, FileDoneOutlined, MessageOutlined, StarOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { paymentApi } from '../../services/paymentApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { FeatureShellPage } from '../shared/MvpShellPage.jsx';

export function SmeApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listMyApplications());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách ứng tuyển.'));
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
          <div className="muted-text">Ứng viên: {row.studentFullName}</div>
        </div>
      )
    },
    { title: 'Giá đề xuất', dataIndex: 'proposedPrice', render: (value) => formatCurrency(value) },
    { title: 'Thời gian', dataIndex: 'estimatedDurationDays', render: (value) => value ? `${value} ngày` : 'Chưa có' },
    { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Ngày gửi', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Button type="primary" ghost onClick={() => navigate(`/sme/projects/${row.projectId}/applications`)}>
          Xem & tạo offer
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<FileDoneOutlined />}
        title="Ứng tuyển"
        description="Tổng hợp application theo tất cả dự án của SME. Mở project để tạo offer và chờ sinh viên xác nhận."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="Luồng PayOS chỉ bắt đầu sau khi sinh viên chấp nhận offer."
      />
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 920 }}
          expandable={{ expandedRowRender: (row) => <p className="expanded-copy">{row.coverLetter}</p> }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có ứng tuyển nào.' }}
        />
      </Card>
    </>
  );
}

export function SmeOffersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listSmeOffers());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách offer.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const reopenPayment = async (row) => {
    if (row.checkoutUrl) {
      window.open(row.checkoutUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setReopening(row.offerId);
    try {
      const payment = await paymentApi.createOfferPayment(row.offerId);
      if (payment.checkoutUrl) {
        window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán PayOS.'));
    } finally {
      setReopening(null);
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
          <div className="muted-text">Sinh viên: {row.studentFullName}</div>
        </div>
      )
    },
    { title: 'Offer', dataIndex: 'offerStatus', render: (value) => <StatusBadge status={value} /> },
    { title: 'Số tiền', dataIndex: 'offeredAmount', render: (value) => formatCurrency(value) },
    { title: 'Payment', dataIndex: 'paymentStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Escrow', dataIndex: 'escrowStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chưa có' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Space wrap>
          <Button type="primary" ghost onClick={() => window.location.assign(`/projects/${row.projectId}/execution`)}>
            Workspace & escrow
          </Button>
          <Button
            disabled={!['ACCEPTED', 'PAYMENT_FAILED'].includes(row.offerStatus) || row.paymentStatus === 'SUCCESS'}
            loading={reopening === row.offerId}
            onClick={() => reopenPayment(row)}
          >
            Thanh toán PayOS
          </Button>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<MessageOutlined />}
        title="Đề nghị"
        description="Theo dõi offer, trạng thái sinh viên xác nhận, PayOS payment-in và escrow."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Alert
        type="warning"
        showIcon
        className="form-alert"
        message="Chỉ mở thanh toán escrow khi sinh viên đã chấp nhận offer. Project chỉ bắt đầu sau khi PayOS webhook xác nhận thanh toán thành công."
      />
      <Card className="table-card">
        <Table
          rowKey="offerId"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1160 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có offer nào.' }}
        />
      </Card>
    </>
  );
}

export function SmeAiBriefPage() {
  const navigate = useNavigate();
  return (
    <FeatureShellPage
      icon={<BulbOutlined />}
      title="AI Brief Assistant"
      description="AI brief hiện nằm trong form tạo dự án để SME review và chỉnh sửa trước khi lưu."
      role="SME"
      endpoint="POST /api/v1/ai/project-brief-assistant"
      notes={['AI không publish dự án tự động.', 'AI không định giá cuối cùng hoặc chọn sinh viên.']}
      backTo="/sme/dashboard"
    >
      <Button type="primary" onClick={() => navigate('/sme/projects/new')}>Tạo dự án với AI</Button>
    </FeatureShellPage>
  );
}

export function SmeAiMatchingPage() {
  return (
    <FeatureShellPage
      icon={<TeamOutlined />}
      title="AI Matching"
      description="Gợi ý sinh viên phù hợp cho dự án khi SME có entitlement từ gói đã mua."
      role="SME"
      endpoint="POST /api/v1/ai/matching/projects/{id}/students"
      notes={['AI chỉ gợi ý, không auto-invite hoặc auto-select.', 'Cần backend entitlement trước khi gọi matching.']}
      backTo="/sme/dashboard"
    />
  );
}

export function SmeBillingPage() {
  return (
    <FeatureShellPage
      icon={<CreditCardOutlined />}
      title="Gói & thanh toán"
      description="Mua gói tính năng qua payment-in provider thật để mở khóa AI Matching và giới hạn nâng cao."
      role="SME"
      endpoint="GET /api/v1/feature-packages"
      notes={['Sandbox chỉ dùng local dev/test.', 'UI chờ backend xác nhận thanh toán trước khi active entitlement.']}
      backTo="/sme/dashboard"
    />
  );
}

export function SmeRatingsPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Đánh giá"
      description="Đánh giá sinh viên sau khi dự án hoàn thành."
      role="SME"
      endpoint="GET /api/v1/ratings/me"
      backTo="/sme/dashboard"
    />
  );
}
