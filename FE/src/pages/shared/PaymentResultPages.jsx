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

function buildBillingPath(purchaseId, paymentId) {
  const query = new URLSearchParams({ paymentReturn: '1' });
  if (purchaseId) query.set('purchaseId', purchaseId);
  if (paymentId) query.set('paymentId', paymentId);
  return `/sme/billing?${query.toString()}`;
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const paymentId = searchParams.get('paymentId');
  const projectId = searchParams.get('projectId');
  const purchaseId = searchParams.get('purchaseId');

  useEffect(() => {
    let stopped = false;

    const redirectAfterLookup = async () => {
      if (projectId) {
        if (paymentId) {
          try {
            await paymentApi.getReturnStatus(paymentId);
          } catch {
            // Workspace will keep polling payment status after redirect.
          }
        }
        navigate(buildWorkspacePath(projectId, paymentId), { replace: true });
        return;
      }

      if (purchaseId) {
        if (paymentId) {
          try {
            await paymentApi.getReturnStatus(paymentId);
          } catch {
            // Billing page will refresh latest purchase/payment state after redirect.
          }
        }
        navigate(buildBillingPath(purchaseId, paymentId), { replace: true });
        return;
      }

      if (!paymentId) {
        navigate('/sme/offers?paymentReturnError=missing-payment', { replace: true });
        return;
      }

      try {
        const payment = await paymentApi.getReturnStatus(paymentId);
        if (stopped) return;

        if (payment.targetType === 'FEATURE_PACKAGE_PURCHASE') {
          navigate(buildBillingPath(payment.featurePackagePurchaseId, paymentId), { replace: true });
          return;
        }

        navigate(buildWorkspacePath(payment.projectId, paymentId), { replace: true });
      } catch (requestError) {
        if (!stopped) {
          setError(getApiErrorMessage(requestError, 'Không thể xác định màn hình đích của giao dịch.'));
          window.setTimeout(() => navigate('/sme/offers?paymentReturnError=lookup-failed', { replace: true }), 1800);
        }
      }
    };

    redirectAfterLookup();
    return () => { stopped = true; };
  }, [navigate, paymentId, projectId, purchaseId]);

  if (error) return <LoadingState label={`${error} Đang chuyển hướng...`} />;
  return <LoadingState label="Đang kiểm tra trạng thái thanh toán..." />;
}

export function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const purchaseId = searchParams.get('purchaseId');
  const returnPath = projectId
    ? `/projects/${projectId}/execution`
    : purchaseId
      ? buildBillingPath(purchaseId, searchParams.get('paymentId'))
      : '/sme/offers';

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          <CloseCircleOutlined className="result-icon danger" />
          <div>
            <Title level={2}>Thanh toán đã bị hủy</Title>
            <Paragraph className="muted-text">
              Nếu đây là thanh toán gói, bạn có thể mở lại PayOS từ trang gói & thanh toán. Nếu đây là escrow, offer vẫn chờ thanh toán nếu còn hiệu lực.
            </Paragraph>
          </div>
          <Alert type="info" showIcon message="Backend không ghi nhận thanh toán thành công từ trang này." />
          <Button type="primary"><Link to={returnPath}>{projectId ? 'Về workspace' : purchaseId ? 'Về gói & thanh toán' : 'Về danh sách offer'}</Link></Button>
        </Space>
      </Card>
    </div>
  );
}
