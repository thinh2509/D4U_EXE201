import { App, Alert, Button, Card, Empty, List, Space, Table, Tag, Typography } from 'antd';
import { CreditCardOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { matchingApi } from '../../services/matchingApi.js';
import { packageApi } from '../../services/packageApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

const { Paragraph, Text, Title } = Typography;

function renderPrimaryCell(title, subtitle) {
  return (
    <div className="table-title-cell">
      <strong>{title}</strong>
      {subtitle ? <div className="table-subtext">{subtitle}</div> : null}
    </div>
  );
}

function renderDateCell(value) {
  return value ? <span className="table-date-cell">{formatDate(value)}</span> : <span className="table-subtext">Chưa có</span>;
}

function renderStatusOrFallback(value) {
  return value ? <StatusBadge status={value} /> : <span className="table-subtext">Chưa có</span>;
}

function findActiveMatchingEntitlement(entitlements) {
  return entitlements.find((item) => item.status === 'ACTIVE' && item.entitlementCode === 'SME_AI_MATCHING');
}

function buildPurchaseActionLabel(purchase) {
  if (!purchase) return 'Mua gói & thanh toán';
  if (purchase.paymentStatus === 'PENDING' && purchase.checkoutUrl) return 'Mở lại PayOS';
  return 'Thanh toán lại';
}

export function SmeBillingLivePage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingPackageId, setActingPackageId] = useState(null);
  const [actingPurchaseId, setActingPurchaseId] = useState(null);
  const [error, setError] = useState(null);
  const activeEntitlement = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [packageRows, purchaseRows, entitlementRows] = await Promise.all([
        packageApi.listPackages('SME'),
        packageApi.listMyPurchases(),
        packageApi.listMyEntitlements()
      ]);
      setPackages(packageRows);
      setPurchases(purchaseRows);
      setEntitlements(entitlementRows);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu gói SME.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchParams.get('paymentReturn') && !searchParams.get('paymentId')) return;
    loadData();
  }, [searchParams]);

  const openCheckout = (checkoutUrl) => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const startPurchase = async (pkg) => {
    setActingPackageId(pkg.id);
    setError(null);
    try {
      const purchase = await packageApi.purchasePackage(pkg.id);
      const payment = await packageApi.createPurchasePayment(purchase.id);
      openCheckout(payment.checkoutUrl);
      message.success('Đã tạo giao dịch PayOS cho gói AI Matching.');
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tạo giao dịch mua gói.'));
    } finally {
      setActingPackageId(null);
    }
  };

  const reopenPurchasePayment = async (purchase) => {
    setActingPurchaseId(purchase.id);
    setError(null);
    try {
      const payment = await packageApi.createPurchasePayment(purchase.id);
      openCheckout(payment.checkoutUrl || purchase.checkoutUrl);
      await loadData();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể mở lại thanh toán PayOS cho gói.'));
    } finally {
      setActingPurchaseId(null);
    }
  };

  if (error && !packages.length && !loading) return <ErrorState description={error} onRetry={loadData} />;

  const latestPurchaseByPackage = Object.fromEntries(
    packages.map((pkg) => [
      pkg.id,
      purchases
        .filter((purchase) => purchase.packageId === pkg.id)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0] || null
    ])
  );

  return (
    <>
      <PageHeader
        icon={<CreditCardOutlined />}
        title="Gói & thanh toán"
        description="Mua gói AI Matching cho SME, thanh toán qua PayOS và chỉ mở khóa entitlement sau khi backend xác nhận thành công."
        extra={<Button onClick={loadData}>Làm mới</Button>}
      />

      {activeEntitlement ? (
        <Alert
          type="success"
          showIcon
          className="form-alert"
          message="Bạn đang có entitlement AI Matching hoạt động"
          description={`Có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}. Bạn có thể mở AI Matching trực tiếp từ trang chi tiết dự án.`}
        />
      ) : (
        <Alert
          type="info"
          showIcon
          className="form-alert"
          message="Entitlement chỉ active sau khi PayOS webhook xác nhận thành công."
          description="Trang return từ PayOS không tự mở khóa tính năng. Nếu vừa thanh toán xong, hãy bấm Làm mới để kiểm tra trạng thái mới nhất."
        />
      )}

      {error ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <div className="dashboard-grid cols-2">
        {packages.map((pkg) => {
          const latestPurchase = latestPurchaseByPackage[pkg.id];
          const isActivePackage = activeEntitlement?.packageId === pkg.id;

          return (
            <Card key={pkg.id} loading={loading}>
              <Space direction="vertical" size={14} className="full-width">
                <Space wrap>
                  <Tag color="blue">{pkg.code}</Tag>
                  <Tag color="purple">{pkg.durationDays} ngày</Tag>
                  <Tag color={isActivePackage ? 'green' : 'default'}>
                    {isActivePackage ? 'Đang active' : 'Chưa active'}
                  </Tag>
                </Space>
                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>{pkg.name}</Title>
                  <Paragraph type="secondary">{pkg.description}</Paragraph>
                </div>
                <Space wrap>
                  <Text strong>{formatCurrency(pkg.price, pkg.currency)}</Text>
                  <Text type="secondary">Role {pkg.role}</Text>
                </Space>
                {latestPurchase ? (
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">Lần mua gần nhất</Text>
                    <Space wrap>
                      <StatusBadge status={latestPurchase.status} />
                      {latestPurchase.paymentStatus ? <StatusBadge status={latestPurchase.paymentStatus} /> : null}
                      {latestPurchase.entitlementStatus ? <StatusBadge status={latestPurchase.entitlementStatus} /> : null}
                    </Space>
                  </Space>
                ) : null}
                <Button
                  type="primary"
                  disabled={isActivePackage}
                  loading={actingPackageId === pkg.id}
                  onClick={() => startPurchase(pkg)}
                >
                  {isActivePackage ? 'Entitlement đang hoạt động' : 'Mua gói & thanh toán'}
                </Button>
                {latestPurchase && !isActivePackage ? (
                  <Button loading={actingPurchaseId === latestPurchase.id} onClick={() => reopenPurchasePayment(latestPurchase)}>
                    {buildPurchaseActionLabel(latestPurchase)}
                  </Button>
                ) : null}
              </Space>
            </Card>
          );
        })}
      </div>

      <Card title="Lịch sử mua gói">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={purchases}
          scroll={{ x: 980 }}
          locale={{ emptyText: 'Chưa có giao dịch mua gói nào.' }}
          columns={[
            {
              title: 'Gói',
              dataIndex: 'packageName',
              render: (value, row) => renderPrimaryCell(value, row.packageCode)
            },
            {
              title: 'Purchase',
              dataIndex: 'status',
              render: (value) => <StatusBadge status={value} />
            },
            {
              title: 'Payment',
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
              title: 'Hiệu lực đến',
              dataIndex: 'expiresAt',
              render: renderDateCell
            },
            {
              title: 'Hành động',
              render: (_, row) => (
                <Button
                  disabled={row.status === 'ACTIVE'}
                  loading={actingPurchaseId === row.id}
                  onClick={() => reopenPurchasePayment(row)}
                >
                  {buildPurchaseActionLabel(row)}
                </Button>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}

export function SmeAiMatchingLivePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState(null);
  const [entitlements, setEntitlements] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const activeEntitlement = useMemo(() => findActiveMatchingEntitlement(entitlements), [entitlements]);

  const loadContext = async () => {
    if (!projectId) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [projectResponse, entitlementResponse] = await Promise.all([
        projectApi.getProject(projectId),
        packageApi.listMyEntitlements()
      ]);
      setProject(projectResponse);
      setEntitlements(entitlementResponse);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu AI Matching.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
  }, [projectId]);

  const runMatching = async () => {
    if (!projectId) return;

    setRunning(true);
    setError(null);
    try {
      setResult(await matchingApi.matchStudentsForProject(projectId, { maxResults: 6 }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể chạy AI Matching cho dự án này.'));
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (!projectId || !activeEntitlement || result || running || loading) return;
    runMatching();
  }, [activeEntitlement, loading, projectId]);

  if (error && !project && projectId) return <ErrorState description={error} onRetry={loadContext} />;

  return (
    <>
      <PageHeader
        icon={<TeamOutlined />}
        title="AI Matching"
        description="Chạy AI Matching trực tiếp từ dự án SME để nhận danh sách sinh viên được xếp hạng theo độ phù hợp."
        extra={(
          <Space>
            <Button onClick={() => navigate(projectId ? `/sme/projects/${projectId}` : '/sme/projects')}>Về dự án</Button>
            <Button type="primary" disabled={!projectId || !activeEntitlement} loading={running} onClick={runMatching}>
              Chạy lại gợi ý
            </Button>
          </Space>
        )}
      />

      {!projectId ? (
        <Card>
          <Empty description="Hãy mở AI Matching từ trang chi tiết một dự án SME cụ thể." image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => navigate('/sme/projects')}>Đi tới danh sách dự án</Button>
          </Empty>
        </Card>
      ) : null}

      {project ? (
        <Card>
          <Space direction="vertical" size={6} className="full-width">
            <Text type="secondary">Dự án đang phân tích</Text>
            <Title level={4} style={{ margin: 0 }}>{project.title}</Title>
            <Paragraph style={{ marginBottom: 0 }}>
              Ngân sách {formatCurrency(project.budgetAmount, project.currency)} · Trạng thái {project.status}
            </Paragraph>
          </Space>
        </Card>
      ) : null}

      {!activeEntitlement ? (
        <Alert
          type="warning"
          showIcon
          className="form-alert"
          message="Bạn chưa có entitlement AI Matching đang hoạt động."
          description={(
            <Space direction="vertical" size={8}>
              <Text>SME cần mua gói AI Matching và chờ webhook xác nhận trước khi dùng tính năng này.</Text>
              <Button type="primary" onClick={() => navigate('/sme/billing')}>Mở trang gói & thanh toán</Button>
            </Space>
          )}
        />
      ) : (
        <Alert
          type="success"
          showIcon
          className="form-alert"
          message="Entitlement AI Matching đang hoạt động"
          description={`Có hiệu lực đến ${formatDate(activeEntitlement.expiresAt)}.`}
        />
      )}

      {error && project ? <Alert type="error" showIcon className="form-alert" message={error} /> : null}

      <Card title="Kết quả gợi ý sinh viên">
        {!result ? (
          <Empty
            description={activeEntitlement ? 'Chưa có kết quả. Hãy chạy AI Matching để lấy danh sách gợi ý.' : 'Tính năng đang bị khóa vì chưa có gói.'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={result.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <Card className="full-width">
                  <Space direction="vertical" size={12} className="full-width">
                    <Space wrap>
                      <Tag color="blue">#{index + 1}</Tag>
                      <Tag color="geekblue">Score {item.matchScore}</Tag>
                      <StatusBadge status={item.verificationStatus || 'UNVERIFIED'} />
                      {item.hasAppliedToProject ? <Tag color="green">Đã apply</Tag> : null}
                    </Space>
                    <div>
                      <Title level={5} style={{ marginBottom: 4 }}>{item.studentFullName}</Title>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {item.school || 'Chưa có trường'} · {item.major || 'Chưa có chuyên ngành'}
                      </Paragraph>
                    </div>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {item.bio || 'Chưa có bio để phân tích sâu hơn trong phase này.'}
                    </Paragraph>
                    <Space wrap>
                      <Tag>Rating {item.averageRating ?? 0}</Tag>
                      <Tag>Đã hoàn thành {item.completedProjectsCount ?? 0} dự án</Tag>
                      {item.proposedPrice ? <Tag>Giá đề xuất {formatCurrency(item.proposedPrice)}</Tag> : null}
                    </Space>
                    <div>
                      <Text strong>Lý do gợi ý</Text>
                      <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
                        {item.reasons?.map((reason) => <li key={reason}>{reason}</li>)}
                      </ul>
                    </div>
                    {item.warnings?.length ? (
                      <Alert type="info" showIcon message="Cảnh báo dữ liệu" description={item.warnings.join(' ')} />
                    ) : null}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </>
  );
}
