import { CheckCircleOutlined, FolderOpenOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Col, Drawer, Empty, Input, Row, Select, Space, Table, Timeline, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const statusOptions = [
  { label: 'Tat ca trang thai', value: 'ALL' },
  { label: 'Admin review', value: 'ADMIN_REVIEW' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Offer selected', value: 'OFFER_SELECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Completed', value: 'COMPLETED' }
];

function buildQueryParams(filters) {
  return {
    status: filters.status !== 'ALL' ? filters.status : undefined,
    keyword: filters.keyword?.trim() || undefined
  };
}

function MetaField({ label, value }) {
  return (
    <div className="rounded-card border border-d4u-border/70 bg-d4u-soft/35 p-4">
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">{label}</div>
      <div className="mt-2 text-sm font-semibold text-d4u-text-1">{value ?? 'Chua co'}</div>
    </div>
  );
}

function TagLike({ text }) {
  return <span className="inline-flex rounded-full border border-d4u-border bg-d4u-soft px-3 py-1 text-xs font-semibold text-d4u-teal-deep">{text}</span>;
}

export function AdminProjectModerationPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', keyword: '' });
  const [keywordInput, setKeywordInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRows = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminApi.listProjects(buildQueryParams(nextFilters)));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Khong the tai danh sach du an moderation.'));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (projectId) => {
    setDetailLoading(true);
    try {
      setDetail(await adminApi.getProjectDetail(projectId));
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Khong the tai chi tiet du an.'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRows(filters);
  }, [filters.status, filters.keyword]);

  const openDrawer = async (projectId) => {
    setDrawerOpen(true);
    await loadDetail(projectId);
  };

  const handleModeration = (type) => {
    if (!detail) return;

    let reason = '';
    modal.confirm({
      title: type === 'force-complete' ? 'Force complete du an?' : 'Cancel du an?',
      content: (
        <div className="grid gap-3">
          <Typography.Text>
            {type === 'force-complete'
              ? 'Chi dung khi admin da xac nhan case nay co the khep lai va chuyen sang hoan thanh.'
              : 'Chi dung khi case can dung lai o muc moderation va khong the tiep tuc flow binh thuong.'}
          </Typography.Text>
          <Input.TextArea rows={3} placeholder="Ly do moderation" onChange={(event) => { reason = event.target.value; }} />
        </div>
      ),
      okText: type === 'force-complete' ? 'Force complete' : 'Cancel du an',
      cancelText: 'Dong',
      async onOk() {
        setActionLoading(true);
        try {
          if (type === 'force-complete') {
            await adminApi.forceCompleteProject(detail.id, { reason });
            message.success('Da force complete du an.');
          } else {
            await adminApi.cancelProjectInReview(detail.id, { reason });
            message.success('Da cancel du an.');
          }

          await Promise.all([loadRows(), loadDetail(detail.id)]);
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Khong the thuc hien moderation cho du an.'));
          throw requestError;
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const summary = useMemo(() => ({
    total: rows.length,
    adminReview: rows.filter((row) => row.status === 'ADMIN_REVIEW').length,
    inProgress: rows.filter((row) => row.status === 'IN_PROGRESS').length,
    paymentAttention: rows.filter((row) => row.paymentStatus === 'PENDING' || row.paymentStatus === 'FAILED').length
  }), [rows]);

  if (error) {
    return <ErrorState description={error} onRetry={() => loadRows()} />;
  }

  return (
    <>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Moderation du an"
        description="Admin xem case du an theo trang thai, nguoi tham gia va execution snapshot. Chi can thiep action khi du an dang o ADMIN_REVIEW."
        extra={(
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => loadRows()}>
              Lam moi
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')}>Ve dashboard</Button>
          </Space>
        )}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={8}><Card><Typography.Text type="secondary">Tong du an trong bo loc</Typography.Text><Typography.Title level={3} className="!mb-0">{summary.total}</Typography.Title></Card></Col>
        <Col xs={24} sm={12} xl={8}><Card><Typography.Text type="secondary">Case ADMIN_REVIEW</Typography.Text><Typography.Title level={3} className="!mb-0">{summary.adminReview}</Typography.Title></Card></Col>
        <Col xs={24} sm={12} xl={8}><Card><Typography.Text type="secondary">Payment can chu y</Typography.Text><Typography.Title level={3} className="!mb-0">{summary.paymentAttention}</Typography.Title></Card></Col>
      </Row>

      <Card className="table-card">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Select value={filters.status} options={statusOptions} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} style={{ minWidth: 220 }} />
          <Input.Search
            allowClear
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onSearch={(value) => setFilters((current) => ({ ...current, keyword: value }))}
            placeholder="Tim theo title, brief hoac SME"
            style={{ width: '100%', maxWidth: 380 }}
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1320 }}
          locale={{ emptyText: <Empty description="Chua co du an moderation trong bo loc nay." /> }}
          onRow={(record) => ({
            onClick: () => openDrawer(record.id),
            style: { cursor: 'pointer' }
          })}
          columns={[
            {
              title: 'Du an',
              render: (_, row) => (
                <div className="table-title-cell">
                  <strong>{row.title}</strong>
                  <div className="table-subtext">{row.designCategoryName}</div>
                </div>
              )
            },
            { title: 'Trang thai', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
            {
              title: 'SME / Student',
              render: (_, row) => (
                <div className="table-title-cell">
                  <strong>{row.smeCompanyName || row.smeFullName}</strong>
                  <div className="table-subtext">SME: {row.smeFullName}</div>
                  <div className="table-subtext">Student: {row.studentFullName || 'Chua gan'}</div>
                </div>
              )
            },
            { title: 'Payment', dataIndex: 'paymentStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chua co' },
            { title: 'Escrow', dataIndex: 'escrowStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chua co' },
            { title: 'Submission', dataIndex: 'latestSubmissionStatus', render: (value) => value ? <StatusBadge status={value} /> : 'Chua co' },
            { title: 'Ngan sach', render: (_, row) => formatCurrency(row.budgetAmount, row.currency) },
            { title: 'Cap nhat', dataIndex: 'updatedAt', render: formatDate }
          ]}
        />
      </Card>

      <Drawer
        width={760}
        title="Chi tiet moderation du an"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetail(null); }}
        destroyOnClose
        extra={detail?.canModerate ? (
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={actionLoading}
              onClick={() => handleModeration('force-complete')}
            >
              Force complete
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              loading={actionLoading}
              onClick={() => handleModeration('cancel')}
            >
              Cancel
            </Button>
          </Space>
        ) : null}
      >
        {detailLoading ? (
          <div className="withdrawal-empty">Dang tai chi tiet du an...</div>
        ) : !detail ? (
          <Empty description="Chua chon du an." />
        ) : (
          <div className="grid gap-4">
            {detail.canModerate ? (
              <Alert
                type="warning"
                showIcon
                message="Case nay dang o ADMIN_REVIEW"
                description={detail.execution.adminReviewReason || 'Admin co the force complete hoac cancel neu case khong the quay lai flow thuong.'}
              />
            ) : null}

            <Card>
              <div className="grid gap-3">
                <div>
                  <Typography.Title level={4} className="!mb-1">{detail.title}</Typography.Title>
                  <Space wrap>
                    <StatusBadge status={detail.status} />
                    <TagLike text={detail.projectType} />
                    {detail.execution.paymentStatus ? <StatusBadge status={detail.execution.paymentStatus} /> : null}
                    {detail.execution.escrowStatus ? <StatusBadge status={detail.execution.escrowStatus} /> : null}
                  </Space>
                </div>
                <Typography.Paragraph className="!mb-0">{detail.brief}</Typography.Paragraph>
              </div>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="Nguoi tham gia">
                  <div className="grid gap-3">
                    <MetaField label="SME" value={`${detail.sme.companyName || detail.sme.fullName} • ${detail.sme.fullName}`} />
                    <MetaField label="Student" value={detail.student ? `${detail.student.fullName} • ${detail.student.verificationStatus || 'Chua ro'}` : 'Chua gan Student'} />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Execution snapshot">
                  <div className="grid gap-3">
                    <MetaField label="Applications / Offers" value={`${detail.execution.totalApplications} / ${detail.execution.totalOffers}`} />
                    <MetaField label="Latest submission" value={detail.execution.latestSubmissionStatus || 'Chua co'} />
                    <MetaField label="Submission gan nhat" value={formatDate(detail.execution.latestSubmissionAt) || 'Chua co'} />
                  </div>
                </Card>
              </Col>
            </Row>

            <Card title="Metadata">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}><MetaField label="Category" value={detail.designCategoryName} /></Col>
                <Col xs={24} md={12}><MetaField label="Ngan sach" value={formatCurrency(detail.budgetAmount, detail.currency)} /></Col>
                <Col xs={24} md={12}><MetaField label="Sketch deadline" value={formatDate(detail.sketchDeadlineAt) || 'Chua co'} /></Col>
                <Col xs={24} md={12}><MetaField label="Final deadline" value={formatDate(detail.finalDeadlineAt) || 'Chua co'} /></Col>
                <Col xs={24} md={12}><MetaField label="Total deadline" value={formatDate(detail.totalDeadlineAt) || 'Chua co'} /></Col>
                <Col xs={24} md={12}><MetaField label="Revision" value={`${detail.currentRevisionRound} / ${detail.maxRevisionRounds}`} /></Col>
              </Row>
            </Card>

            <Card title="Timeline moderation">
              {detail.timeline.length === 0 ? (
                <Empty description="Chua co timeline moderation." />
              ) : (
                <Timeline
                  items={detail.timeline.map((item) => ({
                    children: (
                      <div className="grid gap-1">
                        <Space wrap>
                          <Typography.Text strong>{item.action}</Typography.Text>
                          <Typography.Text type="secondary">{formatDate(item.createdAt)}</Typography.Text>
                        </Space>
                        <Typography.Text type="secondary">{item.actorName || 'System'}</Typography.Text>
                        {item.note ? <Typography.Paragraph className="!mb-0">{item.note}</Typography.Paragraph> : null}
                      </div>
                    )
                  }))}
                />
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
}
