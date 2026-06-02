import { AuditOutlined, StarOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { walletApi } from '../../services/walletApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { FeatureShellPage } from '../shared/MvpShellPage.jsx';

export function AdminPortfolioPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Portfolio moderation"
      description="Ẩn các portfolio item không phù hợp khi cần, không phải mạng xã hội portfolio nâng cao."
      role="Admin"
      endpoint="POST /api/v1/admin/portfolio-items/{id}/hide"
      backTo="/admin/dashboard"
    />
  );
}

export function AdminWithdrawalsShellPage() {
  return (
    <FeatureShellPage
      icon={<WalletOutlined />}
      title="Xử lý rút tiền"
      description="Admin/Finance cập nhật trạng thái sau khi chuyển khoản thủ công ngoài hệ thống."
      role="Admin"
      endpoint="POST /api/v1/admin/withdrawal-requests/{id}/process"
      notes={['Không automatic bank payout trong MVP.', 'Không đồng bộ số dư ngân hàng thật.']}
      backTo="/admin/dashboard"
    />
  );
}

export function AdminWithdrawalsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingRow, setActingRow] = useState(null);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await walletApi.listAdminWithdrawalRequests());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Khong the tai danh sach withdrawal.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const openDecision = (row, nextDecision) => {
    setActingRow(row);
    setDecision(nextDecision);
    form.resetFields();
  };

  const closeDecision = () => {
    setActingRow(null);
    setDecision(null);
    form.resetFields();
  };

  const submitDecision = async (values) => {
    if (!actingRow || !decision) return;

    try {
      await walletApi.processWithdrawal(actingRow.id, {
        decision,
        failureReason: values.failureReason,
        bankTransactionReference: values.bankTransactionReference,
        transferredAt: values.transferredAt ? new Date(values.transferredAt).toISOString() : null
      });
      message.success(
        decision === 'PROCESSING'
          ? 'Da nhan xu ly withdrawal.'
          : decision === 'COMPLETED'
            ? 'Da xac nhan withdrawal.'
            : 'Da danh dau withdrawal failed.'
      );
      closeDecision();
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the xu ly withdrawal.'));
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  const columns = [
    { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    {
      title: 'Tai khoan',
      render: (_, row) => (
        <div>
          <strong>{row.accountHolderName}</strong>
          <div className="muted-text">{row.maskedAccountNumber}</div>
        </div>
      )
    },
    { title: 'So tien', dataIndex: 'amount', render: (value) => formatCurrency(value) },
    { title: 'Phi', dataIndex: 'feeAmount', render: (value) => formatCurrency(value) },
    { title: 'Chuyen thuc te', dataIndex: 'netAmount', render: (value) => formatCurrency(value) },
    { title: 'Ngay yeu cau', dataIndex: 'requestedAt', render: formatDate },
    { title: 'Bat dau xu ly', dataIndex: 'processingStartedAt', render: formatDate },
    { title: 'Ma GD ngan hang', dataIndex: 'bankTransactionReference' },
    { title: 'Xu ly luc', dataIndex: 'processedAt', render: formatDate },
    {
      title: 'Hanh dong',
      render: (_, row) => (
        <Space wrap>
          {row.status === 'PENDING' && (
            <Button type="primary" onClick={() => openDecision(row, 'PROCESSING')}>
              Nhan xu ly
            </Button>
          )}
          {row.status === 'PROCESSING' && (
            <>
              <Button type="primary" onClick={() => openDecision(row, 'COMPLETED')}>
                Da chuyen khoan
              </Button>
              <Button danger onClick={() => openDecision(row, 'FAILED')}>
                That bai
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<WalletOutlined />}
        title="Xu ly rut tien"
        description="Admin/Finance cap nhat ket qua sau khi chuyen khoan thu cong ngoai he thong."
        extra={<Button onClick={loadRows}>Lam moi</Button>}
      />
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1120 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      <Modal
        title={
          decision === 'PROCESSING'
            ? 'Nhan xu ly withdrawal'
            : decision === 'COMPLETED'
              ? 'Xac nhan da chuyen khoan'
              : 'Danh dau withdrawal that bai'
        }
        open={Boolean(actingRow)}
        onCancel={closeDecision}
        okText="Luu"
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submitDecision}>
          <p className="muted-text">
            Yeu cau {actingRow ? formatCurrency(actingRow.amount) : ''}; so tien thuc chuyen {actingRow ? formatCurrency(actingRow.netAmount) : ''}.
          </p>
          {decision === 'FAILED' && (
            <Form.Item name="failureReason" label="Ly do that bai" rules={[{ required: true, message: 'Nhap ly do that bai.' }]}>
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
          )}
          {decision === 'COMPLETED' && (
            <>
              <Form.Item
                name="bankTransactionReference"
                label="Ma giao dich ngan hang"
                rules={[{ required: true, message: 'Nhap ma giao dich ngan hang.' }]}
              >
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item
                name="transferredAt"
                label="Thoi gian chuyen khoan"
                rules={[{ required: true, message: 'Nhap thoi gian chuyen khoan.' }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
}

export function AdminUsersPage() {
  return (
    <FeatureShellPage
      icon={<TeamOutlined />}
      title="Người dùng"
      description="Không gian vận hành để tra cứu và hỗ trợ user khi backend API sẵn sàng."
      role="Admin"
      endpoint="GET /api/v1/admin/users"
      backTo="/admin/dashboard"
    />
  );
}

export function AdminAuditLogsPage() {
  return (
    <FeatureShellPage
      icon={<AuditOutlined />}
      title="Audit logs"
      description="Theo dõi hành động quan trọng như payment webhook, portfolio moderation và withdrawal processing."
      role="Admin"
      endpoint="GET /api/v1/admin/audit-logs"
      backTo="/admin/dashboard"
    />
  );
}
