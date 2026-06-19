import {
  ClockCircleOutlined,
  DollarOutlined,
  SolutionOutlined,
  UserOutlined
} from '@ant-design/icons';
import { App, Alert, Button, Card, Modal, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import {
  minimumSketchLeadTimeDays,
  minimumSketchLeadTimeHours,
  smeOfferPaymentHours,
  studentOfferDecisionHours
} from '../../constants/offerTiming.js';
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

function getInitials(fullName) {
  if (!fullName) return 'ST';

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
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
      render: (value, row) =>
        renderPrimaryCell(
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
      width: 248,
      align: 'right',
      className: 'table-cell-actions',
      render: (_, row) => (
        <div className="table-actions-stack">
          <Button className="table-action-button" onClick={() => navigate(`/sme/students/${row.studentProfileId}`)}>
            Xem hồ sơ
          </Button>
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

  if (error) {
    return <ErrorState description={error} onRetry={loadRows} />;
  }

  const offerLeadTimeHours = project
    ? (new Date(project.sketchDeadlineAt).getTime() - Date.now()) / 3600000
    : 0;
  const deadlineTooClose = offerLeadTimeHours < minimumSketchLeadTimeHours;
  const offerTimeline = [
    {
      key: 'response',
      label: 'Phản hồi offer',
      value: `${studentOfferDecisionHours} giờ kể từ khi gửi`,
      helper: 'Student cần chấp nhận hoặc từ chối trong thời gian này.'
    },
    {
      key: 'sketch',
      label: 'Nộp Sketch',
      value: formatDate(project?.sketchDeadlineAt),
      helper: 'Mốc nộp bản sketch đầu tiên sau khi bắt đầu execution.'
    },
    {
      key: 'final',
      label: 'Nộp Final',
      value: formatDate(project?.finalDeadlineAt),
      helper: 'Mốc hoàn thiện file final sau khi đã duyệt sketch.'
    },
    {
      key: 'review',
      label: 'Hoàn tất review',
      value: formatDate(project?.totalDeadlineAt),
      helper: 'Mốc tổng để chốt review và chuẩn bị hoàn tất dự án.'
    }
  ];

  return (
    <>
      <PageHeader
        icon={<SolutionOutlined />}
        title="Ứng tuyển"
        description="Xem đề xuất, chọn Student phù hợp và gửi offer. Giá offer sẽ lấy trực tiếp từ application mà bạn chọn."
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
          expandable={{
            expandedRowRender: (row) => <p className="expanded-copy">{row.coverLetter}</p>
          }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có ứng tuyển nào.' }}
        />
      </Card>

      <Modal
        title="Xác nhận gửi offer"
        open={Boolean(selected)}
        footer={null}
        width={760}
        onCancel={() => setSelected(null)}
      >
        <Alert
          type={deadlineTooClose ? 'error' : 'info'}
          showIcon
          className="form-alert"
          message={
            deadlineTooClose
              ? `Hạn Sketch còn dưới ${minimumSketchLeadTimeDays} ngày nên chưa thể gửi offer.`
              : `Student có ${studentOfferDecisionHours} giờ để chấp nhận. Sau đó SME có tối đa ${smeOfferPaymentHours} giờ để hoàn tất thanh toán.`
          }
          description={
            deadlineTooClose
              ? 'Hãy điều chỉnh deadline trước khi gửi offer để tránh dự án bắt đầu sau mốc Sketch.'
              : 'Các mốc deadline sẽ được khóa ngay khi Student chấp nhận offer.'
          }
        />

        <div className="mt-5 flex flex-col gap-5">
          <section className="rounded-[24px] border border-d4u-border bg-gradient-to-br from-white via-white to-d4u-soft/80 p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-d4u-soft text-base font-semibold text-d4u-teal-deep">
                  {getInitials(selected?.studentFullName)}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 inline-flex min-h-[30px] items-center rounded-full border border-d4u-border bg-white px-3 text-[12px] font-semibold text-d4u-text-2">
                    Student được chọn từ danh sách ứng tuyển
                  </div>
                  <h3 className="truncate text-[1.1rem] font-semibold tracking-tight text-d4u-text-1">
                    {selected?.studentFullName}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-d4u-text-2">
                    Đây là bước SME chốt lời mời hợp tác, điều kiện thời gian và mức giá trước khi chuyển sang thanh toán.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[290px] lg:max-w-[320px] lg:grid-cols-1">
                <div className="rounded-[18px] border border-d4u-border bg-white/95 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-d4u-text-3">
                    <DollarOutlined className="text-d4u-cyan" />
                    Giá offer
                  </div>
                  <div className="text-[1.65rem] font-semibold leading-none tracking-tight text-d4u-teal-deep">
                    {formatCurrency(selected?.proposedPrice)}
                  </div>
                </div>

                <div className="rounded-[18px] border border-d4u-border bg-white/95 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-d4u-text-3">
                    <ClockCircleOutlined className="text-d4u-cyan" />
                    Hạn phản hồi
                  </div>
                  <div className="text-base font-semibold text-d4u-text-1">{studentOfferDecisionHours} giờ</div>
                  <p className="mt-1 text-xs leading-5 text-d4u-text-2">Tính từ thời điểm SME xác nhận gửi offer.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-d4u-border bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-d4u-soft text-d4u-teal-deep">
                <ClockCircleOutlined />
              </div>
              <div>
                <h3 className="text-base font-semibold text-d4u-text-1">Các mốc SME cần chốt trước khi gửi</h3>
                <p className="text-sm leading-6 text-d4u-text-2">
                  Những mốc này quyết định nhịp xác nhận, thanh toán và triển khai của dự án ngay sau khi offer được chấp nhận.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {offerTimeline.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-[18px] border border-d4u-border bg-d4u-soft/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/50 hover:bg-white hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-d4u-cyan shadow-sm">
                      {index + 1}
                    </div>
                    <div className="text-sm font-semibold text-d4u-text-1">{item.label}</div>
                  </div>
                  <div className="text-sm font-semibold leading-6 text-d4u-teal-deep">{item.value}</div>
                  <p className="mt-1 text-sm leading-6 text-d4u-text-2">{item.helper}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-d4u-border bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-d4u-soft text-d4u-teal-deep">
                <UserOutlined />
              </div>
              <div>
                <h3 className="text-base font-semibold text-d4u-text-1">Lời nhắn từ Student</h3>
                <p className="text-sm leading-6 text-d4u-text-2">
                  Đây là phần Student xác nhận cách tiếp cận, năng lực phù hợp và cam kết tiến độ cho dự án này.
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-d4u-border bg-d4u-soft/45 p-4">
              <div className="mb-2 inline-flex min-h-[28px] items-center rounded-full bg-white px-3 text-[12px] font-semibold text-d4u-text-2 shadow-sm">
                Giải pháp hoặc xác nhận
              </div>
              <p className="text-sm leading-7 text-d4u-text-1">
                {selected?.coverLetter || 'Student chưa để lại lời nhắn bổ sung trong proposal này.'}
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-d4u-border/80 pt-1 sm:flex-row sm:justify-end">
            <Button onClick={() => setSelected(null)}>Quay lại chỉnh sửa</Button>
            <Button type="primary" loading={offering} disabled={deadlineTooClose} onClick={createOffer}>
              Xác nhận gửi offer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
