import { SolutionOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Descriptions, Modal, Space, Table } from 'antd';
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

  const createOffer = async () => {
    setOffering(true);
    try {
      await projectApi.createOffer(projectId, {
        studentProfileId: selected.studentProfileId,
        applicationId: selected.id,
        offeredAmount: selected.proposedPrice,
        expiresAt: null
      });
      message.success('Đã gửi offer. Student có 48 giờ để chấp nhận hoặc từ chối.');
      setSelected(null);
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi offer.'));
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
    { title: 'Trạng thái', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Ngày gửi', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'Hành động',
      render: (_, row) => (
        <Button type="primary" ghost disabled={row.status !== 'SUBMITTED'} onClick={() => setSelected(row)}>
          {row.status === 'SUBMITTED' ? 'Chọn và gửi offer' : 'Đã xử lý'}
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
        description="Xem đề xuất, chọn Student phù hợp và gửi offer. Giá offer lấy từ application đã chọn."
        extra={<Button onClick={loadRows}>Làm mới</Button>}
      />
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 820 }}
          expandable={{ expandedRowRender: (row) => <p className="expanded-copy">{row.coverLetter}</p> }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có ứng tuyển nào.' }}
        />
      </Card>
      <Modal title="Xác nhận gửi offer" open={Boolean(selected)} footer={null} onCancel={() => setSelected(null)}>
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message="Student có 48 giờ để chấp nhận hoặc từ chối. Sau khi Student chấp nhận, SME mới thanh toán escrow qua PayOS."
        />
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Student">{selected?.studentFullName}</Descriptions.Item>
          <Descriptions.Item label="Giá offer">{formatCurrency(selected?.proposedPrice)}</Descriptions.Item>
          <Descriptions.Item label="Giải pháp hoặc xác nhận">{selected?.coverLetter}</Descriptions.Item>
          <Descriptions.Item label="Hạn phản hồi">48 giờ kể từ khi gửi offer</Descriptions.Item>
        </Descriptions>
        <Space className="workspace-primary-action">
          <Button type="primary" loading={offering} onClick={createOffer}>Gửi offer</Button>
          <Button onClick={() => setSelected(null)}>Hủy</Button>
        </Space>
      </Modal>
    </>
  );
}
