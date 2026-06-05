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
      description="áº¨n cÃ¡c portfolio item khÃ´ng phÃ¹ há»£p khi cáº§n, khÃ´ng pháº£i máº¡ng xÃ£ há»™i portfolio nÃ¢ng cao."
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
      title="Xá»­ lÃ½ rÃºt tiá»n"
      description="Admin/Finance cáº­p nháº­t tráº¡ng thÃ¡i sau khi chuyá»ƒn khoáº£n thá»§ cÃ´ng ngoÃ i há»‡ thá»‘ng."
      role="Admin"
      endpoint="POST /api/v1/admin/withdrawal-requests/{id}/process"
      notes={['KhÃ´ng automatic bank payout trong MVP.', 'KhÃ´ng Ä‘á»“ng bá»™ sá»‘ dÆ° ngÃ¢n hÃ ng tháº­t.']}
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
      setError(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch yÃªu cáº§u rÃºt tiá»n.'));
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
          ? 'ÄÃ£ nháº­n xá»­ lÃ½ yÃªu cáº§u rÃºt tiá»n.'
          : decision === 'COMPLETED'
            ? 'ÄÃ£ xÃ¡c nháº­n chuyá»ƒn khoáº£n.'
            : 'ÄÃ£ Ä‘Ã¡nh dáº¥u yÃªu cáº§u rÃºt tiá»n tháº¥t báº¡i.'
      );
      closeDecision();
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ xá»­ lÃ½ yÃªu cáº§u rÃºt tiá»n.'));
    }
  };

  const copyText = async (value, successText = 'ÄÃ£ copy.') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      message.success(successText);
    } catch {
      message.warning('KhÃ´ng thá»ƒ copy tá»± Ä‘á»™ng. HÃ£y copy thá»§ cÃ´ng.');
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
          <Typography.Text type="secondary">ChÆ°a cÃ³</Typography.Text>
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
          title={transferReady ? undefined : 'Thiáº¿u sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§ nÃªn chÆ°a thá»ƒ xá»­ lÃ½.'}
          onClick={() => openDecision(row, 'PROCESSING')}
        >
          Nháº­n xá»­ lÃ½
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
            title={transferReady ? undefined : 'Thiáº¿u sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§ nÃªn chÆ°a thá»ƒ xÃ¡c nháº­n chuyá»ƒn khoáº£n.'}
            onClick={() => openDecision(row, 'COMPLETED')}
          >
            ÄÃ£ chuyá»ƒn khoáº£n
          </Button>
          <Button danger block={compact} onClick={() => openDecision(row, 'FAILED')}>
            Tháº¥t báº¡i
          </Button>
        </Space>
      );
    }

    return <Typography.Text type="secondary">KhÃ´ng cÃ²n hÃ nh Ä‘á»™ng cáº§n xá»­ lÃ½.</Typography.Text>;
  };

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        icon={<WalletOutlined />}
        title="Xá»­ lÃ½ rÃºt tiá»n"
        description="Admin/Finance cáº­p nháº­t káº¿t quáº£ sau khi chuyá»ƒn khoáº£n thá»§ cÃ´ng ngoÃ i há»‡ thá»‘ng."
        extra={<Button onClick={loadRows}>LÃ m má»›i</Button>}
      />
      <div className="withdrawal-summary-grid">
        {[
          ['Chá» xá»­ lÃ½', 'PENDING', summary.PENDING],
          ['Äang xá»­ lÃ½', 'PROCESSING', summary.PROCESSING],
          ['ÄÃ£ hoÃ n táº¥t', 'COMPLETED', summary.COMPLETED],
          ['Tháº¥t báº¡i', 'FAILED', summary.FAILED]
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
            <strong>Danh sÃ¡ch yÃªu cáº§u rÃºt tiá»n</strong>
            <span>{filteredRows.length} yÃªu cáº§u trong bá»™ lá»c hiá»‡n táº¡i</span>
          </div>
          <Segmented
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: 'Táº¥t cáº£', value: 'ALL' },
              { label: 'Chá» xá»­ lÃ½', value: 'PENDING' },
              { label: 'Äang xá»­ lÃ½', value: 'PROCESSING' },
              { label: 'HoÃ n táº¥t', value: 'COMPLETED' },
              { label: 'Tháº¥t báº¡i', value: 'FAILED' }
            ]}
          />
        </div>

        <div className="withdrawal-layout">
          <div className="withdrawal-list">
            {loading ? (
              <div className="withdrawal-empty">Äang táº£i yÃªu cáº§u rÃºt tiá»n...</div>
            ) : filteredRows.length === 0 ? (
              <Empty description="KhÃ´ng cÃ³ yÃªu cáº§u trong tráº¡ng thÃ¡i nÃ y." />
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
                  <strong>{row.bankName || 'Thiáº¿u ngÃ¢n hÃ ng'}</strong>
                  <span>{formatCurrency(row.transferAmount ?? row.netAmount)}</span>
                </div>
                <div className="withdrawal-card-meta">
                  <span>{row.accountHolderName || 'Thiáº¿u chá»§ tÃ i khoáº£n'}</span>
                  <span>{row.accountNumber || row.maskedAccountNumber || 'Thiáº¿u sá»‘ tÃ i khoáº£n'}</span>
                </div>
                {!canTransfer(row) ? <Tag color="warning">Thiáº¿u sá»‘ TK Ä‘áº§y Ä‘á»§</Tag> : null}
              </button>
            ))}
          </div>

          <div className="withdrawal-detail-panel">
            {selectedRow ? (
              <>
                <div className="withdrawal-detail-header">
                  <div>
                    <StatusBadge status={selectedRow.status} />
                    <h3>{selectedRow.bankName || 'Thiáº¿u ngÃ¢n hÃ ng'}</h3>
                    <p>{selectedRow.accountHolderName || 'Thiáº¿u chá»§ tÃ i khoáº£n'}</p>
                  </div>
                  <div className="withdrawal-detail-amount">
                    <span>Sá»‘ tiá»n cáº§n chuyá»ƒn</span>
                    <strong>{formatCurrency(selectedRow.transferAmount ?? selectedRow.netAmount)}</strong>
                  </div>
                </div>

                {!canTransfer(selectedRow) ? (
                  <Alert
                    type="warning"
                    showIcon
                    className="form-alert"
                    message="YÃªu cáº§u nÃ y thiáº¿u sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§."
                    description="Admin/Finance chÆ°a thá»ƒ nháº­n xá»­ lÃ½ hoáº·c xÃ¡c nháº­n chuyá»ƒn khoáº£n. Student cáº§n táº¡o láº¡i tÃ i khoáº£n nháº­n tiá»n má»›i cÃ³ Ä‘á»§ thÃ´ng tin."
                  />
                ) : null}

                <div className="withdrawal-transfer-box">
                  <TransferCopyField label="Sá»‘ tÃ i khoáº£n" value={selectedRow.accountNumber} copyLabel="ÄÃ£ copy sá»‘ tÃ i khoáº£n." strong />
                  <TransferCopyField
                    label="Sá»‘ tiá»n chuyá»ƒn"
                    value={formatCurrency(selectedRow.transferAmount ?? selectedRow.netAmount)}
                    copyLabel="ÄÃ£ copy sá»‘ tiá»n chuyá»ƒn."
                    strong
                  />
                  <TransferCopyField label="Ná»™i dung chuyá»ƒn khoáº£n" value={selectedRow.transferContent} copyLabel="ÄÃ£ copy ná»™i dung chuyá»ƒn khoáº£n." strong />
                </div>

                <div className="withdrawal-detail-grid">
                  <div><span>NgÃ y yÃªu cáº§u</span><strong>{formatDate(selectedRow.requestedAt)}</strong></div>
                  <div><span>Báº¯t Ä‘áº§u xá»­ lÃ½</span><strong>{formatDate(selectedRow.processingStartedAt) || 'ChÆ°a cÃ³'}</strong></div>
                  <div><span>MÃ£ GD ngÃ¢n hÃ ng</span><strong>{selectedRow.bankTransactionReference || 'ChÆ°a cÃ³'}</strong></div>
                  <div><span>Xá»­ lÃ½ lÃºc</span><strong>{formatDate(selectedRow.processedAt) || 'ChÆ°a cÃ³'}</strong></div>
                  <div><span>PhÃ­ rÃºt</span><strong>{formatCurrency(selectedRow.feeAmount)}</strong></div>
                  <div><span>Thá»±c nháº­n</span><strong>{formatCurrency(selectedRow.netAmount)}</strong></div>
                </div>

                {selectedRow.failureReason ? (
                  <Alert type="error" showIcon className="form-alert" message="LÃ½ do tháº¥t báº¡i" description={selectedRow.failureReason} />
                ) : null}

                <div className="withdrawal-detail-actions">
                  {renderActions(selectedRow, true)}
                </div>
              </>
            ) : (
              <Empty description="Chá»n má»™t yÃªu cáº§u Ä‘á»ƒ xem chi tiáº¿t." />
            )}
          </div>
        </div>
      </Card>
      <Modal
        title={
          decision === 'PROCESSING'
            ? 'Nháº­n xá»­ lÃ½ yÃªu cáº§u rÃºt tiá»n'
            : decision === 'COMPLETED'
              ? 'XÃ¡c nháº­n Ä‘Ã£ chuyá»ƒn khoáº£n'
              : 'ÄÃ¡nh dáº¥u yÃªu cáº§u rÃºt tiá»n tháº¥t báº¡i'
        }
        open={Boolean(actingRow)}
        onCancel={closeDecision}
        okText="LÆ°u"
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submitDecision}>
          <p className="muted-text">
            YÃªu cáº§u {actingRow ? formatCurrency(actingRow.amount) : ''}; sá»‘ tiá»n thá»±c chuyá»ƒn {actingRow ? formatCurrency(actingRow.transferAmount ?? actingRow.netAmount) : ''}.
          </p>
          {decision === 'COMPLETED' && actingRow ? (
            <div className="form-alert">
              <div><strong>NgÃ¢n hÃ ng:</strong> {actingRow.bankName || 'Thiáº¿u ngÃ¢n hÃ ng'}</div>
              <div><strong>Chá»§ TK:</strong> {actingRow.accountHolderName}</div>
              <div>
                <strong>Sá»‘ TK:</strong>{' '}
                {actingRow.accountNumber ? (
                  <Space size={4}>
                    <span>{actingRow.accountNumber}</span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyText(actingRow.accountNumber, 'ÄÃ£ copy sá»‘ tÃ i khoáº£n.')}
                    />
                  </Space>
                ) : 'Thiáº¿u sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§'}
              </div>
              <div><strong>Sá»‘ tiá»n chuyá»ƒn:</strong> {formatCurrency(actingRow.transferAmount ?? actingRow.netAmount)}</div>
              <div>
                <strong>Ná»™i dung CK:</strong>{' '}
                <Space size={4}>
                  <span>{actingRow.transferContent}</span>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => copyText(actingRow.transferContent, 'ÄÃ£ copy ná»™i dung chuyá»ƒn khoáº£n.')}
                  />
                </Space>
              </div>
            </div>
          ) : null}
          {decision === 'FAILED' && (
            <Form.Item name="failureReason" label="LÃ½ do tháº¥t báº¡i" rules={[{ required: true, message: 'Nháº­p lÃ½ do tháº¥t báº¡i.' }]}>
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
          )}
          {decision === 'COMPLETED' && (
            <>
              <Form.Item
                name="bankTransactionReference"
                label="MÃ£ giao dá»‹ch ngÃ¢n hÃ ng"
                rules={[{ required: true, message: 'Nháº­p mÃ£ giao dá»‹ch ngÃ¢n hÃ ng.' }]}
              >
                <Input maxLength={120} />
              </Form.Item>
              <Form.Item
                name="transferredAt"
                label="Thá»i gian chuyá»ƒn khoáº£n"
                rules={[{ required: true, message: 'Nháº­p thá»i gian chuyá»ƒn khoáº£n.' }]}
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
            { title: 'Tráº¡ng thÃ¡i', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
            { title: 'Loáº¡i', dataIndex: 'reason', render: (value) => value || 'STUDENT_ABANDONED' },
            {
              title: 'Dá»± Ã¡n',
              dataIndex: 'projectTitle',
              render: (value, row) => (
                <div>
                  <strong>{value || row.projectId}</strong>
                  <div className="muted-text">SME: {row.smeFullName || 'ChÆ°a cÃ³'}</div>
                  <div className="muted-text">Student: {row.studentFullName || 'ChÆ°a cÃ³'}</div>
                </div>
              )
            },
            { title: 'Escrow', dataIndex: 'amount', render: (value, row) => formatCurrency(value, row.currency) },


            { title: 'LÃ½ do', dataIndex: 'reason', render: (value) => value || 'KhÃ´ng cÃ³' },
            { title: 'Táº¡o lÃºc', dataIndex: 'createdAt', render: formatDate },
            { title: 'MÃ£ hoÃ n tiá»n', dataIndex: 'manualRefundReference', render: (value) => value || 'ChÆ°a cÃ³' },
            {
              title: 'HÃ nh Ä‘á»™ng',
              render: (_, row) => (
                <Button
                  type="primary"
                  disabled={row.status !== 'PENDING' || row.amount <= 0}
                  onClick={() => markRefundCompleted(row)}
                >
                  ÄÃ£ hoÃ n SME
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
      title="NgÆ°á»i dÃ¹ng"
      description="KhÃ´ng gian váº­n hÃ nh Ä‘á»ƒ tra cá»©u vÃ  há»— trá»£ user khi backend API sáºµn sÃ ng."
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
      description="Theo dÃµi hÃ nh Ä‘á»™ng quan trá»ng nhÆ° payment webhook, portfolio moderation vÃ  withdrawal processing."
      role="Admin"
      endpoint="GET /api/v1/admin/audit-logs"
      backTo="/admin/dashboard"
    />
  );
}
