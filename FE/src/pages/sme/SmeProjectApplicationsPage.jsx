import { SolutionOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Form, InputNumber, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

export function SmeProjectApplicationsPage() {
  const { message } = App.useApp();
  const { projectId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await projectApi.listApplications(projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [projectId]);

  const createOffer = async (values) => {
    setOffering(true);
    try {
      await projectApi.createOffer(projectId, {
        studentProfileId: selected.studentProfileId,
        applicationId: selected.id,
        offeredAmount: Number(values.offeredAmount),
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null
      });
      message.success('Đã tạo offer. Vui lòng chờ sinh viên chấp nhận trước khi thanh toán escrow.');
      setSelected(null);
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể tạo offer.'));
    } finally {
      setOffering(false);
    }
  };

  const columns = [
    {
      title: 'Sinh viên',
      dataIndex: 'studentFullName',
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="muted-text">{row.coverLetter?.slice(0, 90)}{row.coverLetter?.length > 90 ? '...' : ''}</div>
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
        <Button type="primary" ghost disabled={row.status !== 'SUBMITTED'} onClick={() => setSelected(row)}>
          {row.status === 'SUBMITTED' ? 'Tạo offer' : 'Đã xử lý'}
        </Button>
      )
    }
  ];

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        icon={<SolutionOutlined />}
        title="Ứng tuyển"
        description="Xem ứng tuyển, chọn sinh viên phù hợp và tạo offer. Sinh viên cần chấp nhận trước khi SME thanh toán escrow qua PayOS."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
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
      <Modal title="Tạo offer" open={Boolean(selected)} footer={null} onCancel={() => setSelected(null)}>
        <Form layout="vertical" onFinish={createOffer} requiredMark={false}>
          <Alert
            type="info"
            showIcon
            className="form-alert"
            message="Sau khi tạo offer, sinh viên sẽ thấy offer để chấp nhận hoặc từ chối. Link PayOS chỉ được tạo sau khi sinh viên chấp nhận."
          />
          <Form.Item name="offeredAmount" label="Số tiền offer" rules={[{ required: true }]}>
            <InputNumber className="full-width" size="large" min={1} addonAfter="VND" />
          </Form.Item>
          <Form.Item name="expiresAt" label="Hạn phản hồi">
            <input className="native-input" type="datetime-local" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={offering}>Tạo offer</Button>
            <Button onClick={() => setSelected(null)}>Đóng</Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
