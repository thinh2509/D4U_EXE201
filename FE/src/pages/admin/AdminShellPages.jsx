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
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách yêu cầu rút tiền.'));
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
          ? 'Đã nhận xử lý yêu cầu rút tiền.'
          : decision === 'COMPLETED'
            ? 'Đã xác nhận chuyển khoản.'
            : 'Đã đánh dấu yêu cầu rút tiền thất bại.'
      );
      closeDecision();
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xử lý yêu cầu rút tiền.'));
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  const columns = [
    { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    {
      title: 'Tài khoản',
      render: (_, row) => (
        <div>
          <strong>{row.accountHolderName}</strong>
          <div className="muted-text">{row.maskedAccountNumber}</div>
        </div>
      )
    },
    { title: 'Số tiền', dataIndex: 'amount', render: (value) => formatCurrency(value) },
    { title: 'Phí', dataIndex: 'feeAmount', render: (value) => formatCurrency(value) },
    { title: 'Chuyển thực tế', dataIndex: 'netAmount', render: (value) => formatCurrency(value) },
    { title: 'Ngày yêu cầu', dataIndex: 'requestedAt', render: formatDate },
    { title: 'Bắt đầu xử lý', dataIndex: 'processingStartedAt', render: formatDate },
    { title: 'Mã GD ngân hàng', dataIndex: 'bankTransactionReference' },
    { title: 'Xử lý lúc', dataIndex: 'processedAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Space wrap>
          {row.status === 'PENDING' && (
            <Button type="primary" onClick={() => openDecision(row, 'PROCESSING')}>
              Nhận xử lý
            </Button>
          )}
          {row.status === 'PROCESSING' && (
            <>
              <Button type="primary" onClick={() => openDecision(row, 'COMPLETED')}>
                Đã chuyển khoản
              </Button>
              <Button danger onClick={() => openDecision(row, 'FAILED')}>
                Thất bại
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
        title="Xử lý rút tiền"
        description="Admin/Finance cập nhật kết quả sau khi chuyển khoản thủ công ngoài hệ thống."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
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
            ? 'Nhận xử lý yêu cầu rút tiền'
            : decision === 'COMPLETED'
              ? 'Xác nhận đã chuyển khoản'
              : 'Đánh dấu yêu cầu rút tiền thất bại'
        }
        open={Boolean(actingRow)}
        onCancel={closeDecision}
        okText="Lưu"
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submitDecision}>
          <p className="muted-text">
            Yêu cầu {actingRow ? formatCurrency(actingRow.amount) : ''}; số tiền thực chuyển {actingRow ? formatCurrency(actingRow.netAmount) : ''}.
          </p>
          {decision === 'FAILED' && (
            <Form.Item name="failureReason" label="Lý do thất bại" rules={[{ required: true, message: 'Nhập lý do thất bại.' }]}>
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
          )}
          {decision === 'COMPLETED' && (
            <>
              <Form.Item
                name="bankTransactionReference"
                label="Mã giao dịch ngân hàng"
                rules={[{ required: true, message: 'Nhập mã giao dịch ngân hàng.' }]}
              >
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item
                name="transferredAt"
                label="Thời gian chuyển khoản"
                rules={[{ required: true, message: 'Nhập thời gian chuyển khoản.' }]}
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
