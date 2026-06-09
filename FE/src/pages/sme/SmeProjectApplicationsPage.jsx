import { SolutionOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Descriptions, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  minimumSketchLeadTimeDays,
  minimumSketchLeadTimeHours,
  smeOfferPaymentHours,
  studentOfferDecisionHours
} from '../../constants/offerTiming.js';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="table-title-cell">
      <strong>{title}</strong>
      {subtitle ? <div className="table-subtext">{subtitle}</div> : null}
    </div>
  );
}

function renderDateCell(value) {
  return <span className="table-date-cell">{formatDate(value)}</span>;
}

export function SmeProjectApplicationsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [rows, setRows] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const [applications, projectResult] = await Promise.all([
        projectApi.listApplications(projectId),
        projectApi.getProject(projectId)
      ]);
      setRows(applications);
      setProject(projectResult);
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
      message.success(`Đã gửi offer. Student có ${studentOfferDecisionHours} giờ để chấp nhận hoặc từ chối.`);
      setSelected(null);
      await loadRows();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi offer.'));
    } finally {
      setOffering(false);
    }
  };

  const tableColumns = [
    {
      title: 'Sinh viên',
      dataIndex: 'studentFullName',
      width: 280,
      render: (value, row) => renderPrimaryCell(
        value,
        `${row.coverLetter?.slice(0, 90) || ''}${row.coverLetter?.length > 90 ? '...' : ''}`
      )
    },
    {
      title: 'Giá đề xuất',
      dataIndex: 'proposedPrice',
      align: 'right',
      className: 'table-cell-numeric',
      render: (value) => formatCurrency(value)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      className: 'table-cell-status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'submittedAt',
      width: 148,
      className: 'table-cell-date',
      render: renderDateCell
    },
    {
      title: 'Hành động',
      width: 176,
      align: 'right',
      className: 'table-cell-actions',
      render: (_, row) => (
        <div className="table-actions-stack single">
          <Button
            className="table-action-button"
            type="primary"
            ghost
            disabled={row.status !== 'SUBMITTED'}
            onClick={() => setSelected(row)}
          >
            {row.status === 'SUBMITTED' ? 'Chọn & gửi offer' : 'Đã xử lý'}
          </Button>
        </div>
      )
    }
  ];

  if (error) return <ErrorState description={error} onRetry={loadRows} />;
  const offerLeadTimeHours = project
    ? (new Date(project.sketchDeadlineAt).getTime() - Date.now()) / 3600000
    : 0;
  const deadlineTooClose = offerLeadTimeHours < minimumSketchLeadTimeHours;

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
          className="dashboard-data-table"
          rowKey="id"
          loading={loading}
          columns={tableColumns}
          dataSource={rows}
          scroll={{ x: 820 }}
          expandable={{ expandedRowRender: (row) => <p className="expanded-copy">{row.coverLetter}</p> }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có ứng tuyển nào.' }}
        />
      </Card>
      <Modal title="Xác nhận gửi offer" open={Boolean(selected)} footer={null} onCancel={() => setSelected(null)}>
        <Alert
          type={deadlineTooClose ? 'error' : 'info'}
          showIcon
          className="form-alert"
          message={deadlineTooClose
            ? `Hạn Sketch còn dưới ${minimumSketchLeadTimeDays} ngày nên chưa thể gửi offer.`
            : `Student có ${studentOfferDecisionHours} giờ để chấp nhận. Sau đó SME có tối đa ${smeOfferPaymentHours} giờ để hoàn tất thanh toán.`}
          description={deadlineTooClose
            ? 'Hãy điều chỉnh deadline trước khi gửi offer để tránh project bắt đầu sau hạn Sketch.'
            : 'Deadline sẽ bị khóa ngay khi Student chấp nhận offer.'}
        />
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Student">{selected?.studentFullName}</Descriptions.Item>
          <Descriptions.Item label="Giá offer">{formatCurrency(selected?.proposedPrice)}</Descriptions.Item>
          <Descriptions.Item label="Giải pháp hoặc xác nhận">{selected?.coverLetter}</Descriptions.Item>
          <Descriptions.Item label="Hạn phản hồi">{studentOfferDecisionHours} giờ kể từ khi gửi offer</Descriptions.Item>
          <Descriptions.Item label="Hạn nộp Sketch">{formatDate(project?.sketchDeadlineAt)}</Descriptions.Item>
          <Descriptions.Item label="Hạn nộp Final">{formatDate(project?.finalDeadlineAt)}</Descriptions.Item>
          <Descriptions.Item label="Hạn hoàn tất review">{formatDate(project?.totalDeadlineAt)}</Descriptions.Item>
        </Descriptions>
        <Space className="workspace-primary-action">
          <Button type="primary" loading={offering} disabled={deadlineTooClose} onClick={createOffer}>Gửi offer</Button>
          {deadlineTooClose ? (
            <Button onClick={() => navigate(`/sme/projects/${projectId}/edit`)}>Điều chỉnh deadline</Button>
          ) : null}
          <Button onClick={() => setSelected(null)}>Hủy</Button>
        </Space>
      </Modal>
    </>
  );
}
