import { CreditCardOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Table } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="table-subtext">Chưa có</span>;
}

export function AdminPackageSupportPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminApi.listFeaturePackagePurchases());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách package purchase.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        icon={<CreditCardOutlined />}
        title="Package support"
        description="Tra cứu purchase, payment và entitlement của gói tính năng để support SME/Student khi cần."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="Entitlement chỉ nên active sau khi payment thành công và webhook được backend xử lý idempotent."
      />
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1240 }}
          locale={{ emptyText: 'Chưa có package purchase nào.' }}
          columns={[
            {
              title: 'Purchase',
              dataIndex: 'packageName',
              render: (value, row) => (
                <div className="table-title-cell">
                  <strong>{value}</strong>
                  <div className="table-subtext">{row.packageCode}</div>
                </div>
              )
            },
            {
              title: 'Role',
              dataIndex: 'role',
              render: (value) => <StatusBadge status={value} />
            },
            {
              title: 'Purchase status',
              dataIndex: 'status',
              render: (value) => <StatusBadge status={value} />
            },
            {
              title: 'Payment status',
              dataIndex: 'paymentStatus',
              render: (value) => renderStatusOrFallback(value)
            },
            {
              title: 'Entitlement',
              dataIndex: 'entitlementStatus',
              render: (value) => renderStatusOrFallback(value)
            },
            {
              title: 'Số tiền',
              dataIndex: 'price',
              render: (value, row) => formatCurrency(value, row.currency)
            },
            {
              title: 'Tạo lúc',
              dataIndex: 'createdAt',
              render: formatDate
            },
            {
              title: 'Hiệu lực đến',
              dataIndex: 'expiresAt',
              render: formatDate
            }
          ]}
        />
      </Card>
    </>
  );
}
