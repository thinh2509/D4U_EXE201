import { AuditOutlined, CopyOutlined, StarOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Empty, Form, Input, Modal, Segmented, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
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
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [refundRows, setRefundRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [actingRow, setActingRow] = useState(null);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const [withdrawals, refunds] = await Promise.all([
        walletApi.listAdminWithdrawalRequests(),
        walletApi.listAdminRefunds()
      ]);
      setRows(withdrawals);
      setRefundRows(refunds);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách yêu cầu rút tiền.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!rows.some((row) => row.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

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

  const copyText = async (value, successText = 'Đã copy.') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      message.success(successText);
    } catch {
      message.warning('Không thể copy tự động. Hãy copy thủ công.');
    }
  };

  const markRefundCompleted = (refund) => {
    let reference = '';
    modal.confirm({
      title: 'Xác nhận đã hoàn SME?',
      content: (
        <div>
          <p>Admin/Finance xác nhận đã hoàn thủ công {formatCurrency(refund.amount, refund.currency)} cho SME ngoài hệ thống.</p>
          <Input placeholder="Mã giao dịch / ghi chú hoàn tiền" onChange={(event) => { reference = event.target.value; }} />
        </div>
      ),
      okText: 'Đã hoàn SME',
      cancelText: 'Đóng',
      async onOk() {
        try {
          await walletApi.markRefundCompleted(refund.id, {
            manualRefundReference: reference || null,
            processedAt: new Date().toISOString()
          });
          message.success('Đã đánh dấu refund hoàn SME thủ công.');
          await loadRows();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể cập nhật refund.'));
        }
      }
    });
  };

  const summary = useMemo(() => ({
    PENDING: rows.filter((row) => row.status === 'PENDING').length,
    PROCESSING: rows.filter((row) => row.status === 'PROCESSING').length,
    COMPLETED: rows.filter((row) => row.status === 'COMPLETED').length,
    FAILED: rows.filter((row) => row.status === 'FAILED').length
  }), [rows]);

  const filteredRows = rows.filter((row) => statusFilter === 'ALL' || row.status === statusFilter);
  const selectedRow = filteredRows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null;

  const canTransfer = (row) => Boolean(row?.hasFullAccountNumber && row?.accountNumber);

  const TransferCopyField = ({ label, value, copyLabel, strong = false }) => (
    <div className="withdrawal-detail-field">
      <span>{label}</span>
      <div>
        {value ? (
          <Space size={6}>
            <Typography.Text strong={strong}>{value}</Typography.Text>
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyText(value, copyLabel)}
            />
          </Space>
        ) : (
          <Typography.Text type="secondary">Chưa có</Typography.Text>
        )}
      </div>
    </div>
  );

  const renderActions = (row, compact = false) => {
    if (!row) return null;
    const transferReady = canTransfer(row);

    if (row.status === 'PENDING') {
      return (
        <Button
          type="primary"
          block={compact}
          disabled={!transferReady}
          title={transferReady ? undefined : 'Tài khoản nhận tiền này không còn đủ dữ liệu để xử lý. Student cần tạo lại tài khoản mới.'}
          onClick={() => openDecision(row, 'PROCESSING')}
        >
          Nhận xử lý
        </Button>
      );
    }

    if (row.status === 'PROCESSING') {
      return (
        <Space direction={compact ? 'vertical' : 'horizontal'} className="withdrawal-action-group">
          <Button
            type="primary"
            block={compact}
            disabled={!transferReady}
            title={transferReady ? undefined : 'Tài khoản nhận tiền này không còn đủ dữ liệu để xác nhận chuyển khoản. Student cần tạo lại tài khoản mới.'}
            onClick={() => openDecision(row, 'COMPLETED')}
          >
            Đã chuyển khoản
          </Button>
          <Button danger block={compact} onClick={() => openDecision(row, 'FAILED')}>
            Thất bại
          </Button>
        </Space>
      );
    }

    return <Typography.Text type="secondary">Không còn hành động cần xử lý.</Typography.Text>;
  };

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        icon={<WalletOutlined />}
        title="Xử lý rút tiền"
        description="Admin/Finance cập nhật kết quả sau khi chuyển khoản thủ công ngoài hệ thống."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <div className="withdrawal-summary-grid">
        {[
          ['Chờ xử lý', 'PENDING', summary.PENDING],
          ['Đang xử lý', 'PROCESSING', summary.PROCESSING],
          ['Đã hoàn tất', 'COMPLETED', summary.COMPLETED],
          ['Thất bại', 'FAILED', summary.FAILED]
        ].map(([label, status, count]) => (
          <Card key={status} className="withdrawal-summary-card">
            <span>{label}</span>
            <strong>{count}</strong>
            <StatusBadge status={status} />
          </Card>
        ))}
      </div>

      <Card className="withdrawal-workbench">
        <div className="withdrawal-toolbar">
          <div>
            <strong>Danh sách yêu cầu rút tiền</strong>
            <span>{filteredRows.length} yêu cầu trong bộ lọc hiện tại</span>
          </div>
          <Segmented
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Chờ xử lý', value: 'PENDING' },
              { label: 'Đang xử lý', value: 'PROCESSING' },
              { label: 'Hoàn tất', value: 'COMPLETED' },
              { label: 'Thất bại', value: 'FAILED' }
            ]}
          />
        </div>

        <div className="withdrawal-layout">
          <div className="withdrawal-list">
            {loading ? (
              <div className="withdrawal-empty">Đang tải yêu cầu rút tiền...</div>
            ) : filteredRows.length === 0 ? (
              <Empty description="Không có yêu cầu trong trạng thái này." />
            ) : filteredRows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`withdrawal-request-card ${selectedRow?.id === row.id ? 'is-active' : ''}`}
                onClick={() => setSelectedId(row.id)}
              >
                <div className="withdrawal-card-topline">
                  <StatusBadge status={row.status} />
                  <span>{formatDate(row.requestedAt)}</span>
                </div>
                <div className="withdrawal-card-title">
                  <strong>{row.bankName || 'Thiếu ngân hàng'}</strong>
                  <span>{formatCurrency(row.transferAmount ?? row.netAmount)}</span>
                </div>
                <div className="withdrawal-card-meta">
                  <span>{row.accountHolderName || 'Thiếu chủ tài khoản'}</span>
                  <span>{row.accountNumber || row.maskedAccountNumber || 'Thiếu số tài khoản'}</span>
                </div>
                {!canTransfer(row) ? <Tag color="warning">Cần tạo lại tài khoản</Tag> : null}
              </button>
            ))}
          </div>

          <div className="withdrawal-detail-panel">
            {selectedRow ? (
              <>
                <div className="withdrawal-detail-header">
                  <div>
                    <StatusBadge status={selectedRow.status} />
                    <h3>{selectedRow.bankName || 'Thiếu ngân hàng'}</h3>
                    <p>{selectedRow.accountHolderName || 'Thiếu chủ tài khoản'}</p>
                  </div>
                  <div className="withdrawal-detail-amount">
                    <span>Số tiền cần chuyển</span>
                    <strong>{formatCurrency(selectedRow.transferAmount ?? selectedRow.netAmount)}</strong>
                  </div>
                </div>

                {!canTransfer(selectedRow) ? (
                  <Alert
                    type="warning"
                    showIcon
                    className="form-alert"
                    message="Tài khoản nhận tiền của yêu cầu này không còn đủ dữ liệu để xử lý."
                    description="Admin/Finance chưa thể nhận xử lý hoặc xác nhận chuyển khoản. Student cần tạo lại tài khoản nhận tiền mới rồi gửi yêu cầu rút tiền bằng tài khoản mới."
                  />
                ) : null}

                <div className="withdrawal-transfer-box">
                  <TransferCopyField label="Số tài khoản" value={selectedRow.accountNumber} copyLabel="Đã copy số tài khoản." strong />
                  <TransferCopyField
                    label="Số tiền chuyển"
                    value={formatCurrency(selectedRow.transferAmount ?? selectedRow.netAmount)}
                    copyLabel="Đã copy số tiền chuyển."
                    strong
                  />
                  <TransferCopyField label="Nội dung chuyển khoản" value={selectedRow.transferContent} copyLabel="Đã copy nội dung chuyển khoản." strong />
                </div>

                <div className="withdrawal-detail-grid">
                  <div><span>Ngày yêu cầu</span><strong>{formatDate(selectedRow.requestedAt)}</strong></div>
                  <div><span>Bắt đầu xử lý</span><strong>{formatDate(selectedRow.processingStartedAt) || 'Chưa có'}</strong></div>
                  <div><span>Mã GD ngân hàng</span><strong>{selectedRow.bankTransactionReference || 'Chưa có'}</strong></div>
                  <div><span>Xử lý lúc</span><strong>{formatDate(selectedRow.processedAt) || 'Chưa có'}</strong></div>
                  <div><span>Phí rút</span><strong>{formatCurrency(selectedRow.feeAmount)}</strong></div>
                  <div><span>Thực nhận</span><strong>{formatCurrency(selectedRow.netAmount)}</strong></div>
                </div>

                {selectedRow.failureReason ? (
                  <Alert type="error" showIcon className="form-alert" message="Lý do thất bại" description={selectedRow.failureReason} />
                ) : null}

                <div className="withdrawal-detail-actions">
                  {renderActions(selectedRow, true)}
                </div>
              </>
            ) : (
              <Empty description="Chọn một yêu cầu để xem chi tiết." />
            )}
          </div>
        </div>
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
            Yêu cầu {actingRow ? formatCurrency(actingRow.amount) : ''}; số tiền thực chuyển {actingRow ? formatCurrency(actingRow.transferAmount ?? actingRow.netAmount) : ''}.
          </p>
          {decision === 'COMPLETED' && actingRow ? (
            <div className="form-alert">
              <div><strong>Ngân hàng:</strong> {actingRow.bankName || 'Thiếu ngân hàng'}</div>
              <div><strong>Chủ TK:</strong> {actingRow.accountHolderName}</div>
              <div>
                <strong>Số TK:</strong>{' '}
                {actingRow.accountNumber ? (
                  <Space size={4}>
                    <span>{actingRow.accountNumber}</span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyText(actingRow.accountNumber, 'Đã copy số tài khoản.')}
                    />
                  </Space>
                ) : 'Tài khoản cũ cần tạo lại'}
              </div>
              <div><strong>Số tiền chuyển:</strong> {formatCurrency(actingRow.transferAmount ?? actingRow.netAmount)}</div>
              <div>
                <strong>Nội dung CK:</strong>{' '}
                <Space size={4}>
                  <span>{actingRow.transferContent}</span>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(actingRow.transferContent, 'Đã copy nội dung chuyển khoản.')}
                  />
                </Space>
              </div>
            </div>
          ) : null}
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
      <Card className="table-card" title="Hoàn SME thủ công sau Student abandon">
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message="D4U chỉ ghi nhận refund pending. Admin/Finance tự hoàn tiền SME ngoài hệ thống rồi mark đã hoàn tại đây."
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={refundRows}
          scroll={{ x: 980 }}
          columns={[
            { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
            { title: 'Loại', dataIndex: 'reason', render: (value) => value || 'STUDENT_ABANDONED' },
            {
              title: 'Dự án',
              dataIndex: 'projectTitle',
              render: (value, row) => (
                <div>
                  <strong>{value || row.projectId}</strong>
                  <div className="muted-text">SME: {row.smeFullName || 'Chưa có'}</div>
                  <div className="muted-text">Student: {row.studentFullName || 'Chưa có'}</div>
                </div>
              )
            },
            { title: 'Escrow', dataIndex: 'amount', render: (value, row) => formatCurrency(value, row.currency) },


            { title: 'Lý do', dataIndex: 'reason', render: (value) => value || 'Không có' },
            { title: 'Tạo lúc', dataIndex: 'createdAt', render: formatDate },
            { title: 'Mã hoàn tiền', dataIndex: 'manualRefundReference', render: (value) => value || 'Chưa có' },
            {
              title: 'Hành động',
              render: (_, row) => (
                <Button
                  type="primary"
                  disabled={row.status !== 'PENDING' || row.amount <= 0}
                  onClick={() => markRefundCompleted(row)}
                >
                  Đã hoàn SME
                </Button>
              )
            }
          ]}
        />
      </Card>
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
