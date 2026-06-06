import { CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../../components/StateViews.jsx';
import { paymentApi } from '../../services/paymentApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const { Paragraph, Title } = Typography;

function buildWorkspacePath(projectId, paymentId) {
  const query = new URLSearchParams({ paymentReturn: '1' });
  if (paymentId) query.set('paymentId', paymentId);
  return `/projects/${projectId}/execution?${query.toString()}`;
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const paymentId = searchParams.get('paymentId');
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    let stopped = false;

    const redirectToWorkspace = async () => {
      if (projectId) {
        if (paymentId) {
          try {
            await paymentApi.getReturnStatus(paymentId);
          } catch {
            // Workspace will keep polling the backend/provider status after redirect.
          }
        }
        navigate(buildWorkspacePath(projectId, paymentId), { replace: true });
        return;
      }

      if (!paymentId) {
        navigate('/sme/offers?paymentReturnError=missing-payment', { replace: true });
        return;
      }

      try {
        const payment = await paymentApi.getReturnStatus(paymentId);
        if (!stopped) navigate(buildWorkspacePath(payment.projectId, paymentId), { replace: true });
      } catch (requestError) {
        if (!stopped) {
          setError(getApiErrorMessage(requestError, 'Không thể xác định workspace của giao dịch.'));
          window.setTimeout(() => navigate('/sme/offers?paymentReturnError=lookup-failed', { replace: true }), 1800);
        }
      }
    };

    redirectToWorkspace();
    return () => { stopped = true; };
  }, [navigate, paymentId, projectId]);

  if (error) return <LoadingState label={`${error} Đang chuyển về danh sách offer...`} />;
  return <LoadingState label="Đang mở workspace dự án..." />;
}

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const workspacePath = projectId ? `/projects/${projectId}/execution` : '/sme/offers';

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          <CloseCircleOutlined className="result-icon danger" />
          <div>
            <Title level={2}>Thanh toán đã bị hủy</Title>
            <Paragraph className="muted-text">
              Offer vẫn chờ thanh toán nếu còn hiệu lực. SME có thể mở lại link PayOS từ workspace.
            </Paragraph>
          </div>
          <Alert type="info" showIcon message="Backend không ghi nhận thanh toán thành công từ trang này." />
          <Button type="primary"><Link to={workspacePath}>{projectId ? 'Về workspace' : 'Về danh sách offer'}</Link></Button>
        </Space>
      </Card>
    </div>
  );
}
