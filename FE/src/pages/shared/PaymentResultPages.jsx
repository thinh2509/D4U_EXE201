import { CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingState } from '../../components/StateViews.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { paymentApi } from '../../services/paymentApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const { Paragraph, Title } = Typography;

function getBillingBasePath(role) {
  return role === 'STUDENT' ? '/student/billing' : '/sme/billing';
}

function getRoleHomePath(role) {
  return role === 'STUDENT' ? '/student/dashboard' : '/sme/dashboard';
}

function buildWorkspacePath(projectId, paymentId) {
  const query = new URLSearchParams({ paymentReturn: '1' });
  if (paymentId) query.set('paymentId', paymentId);
  return `/projects/${projectId}/execution?${query.toString()}`;
}

function buildBillingPath(role, purchaseId, paymentId) {
  const query = new URLSearchParams({ paymentReturn: '1' });
  if (purchaseId) query.set('purchaseId', purchaseId);
  if (paymentId) query.set('paymentId', paymentId);
  return `${getBillingBasePath(role)}?${query.toString()}`;
}

export function PaymentSuccessPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const paymentId = searchParams.get('paymentId');
  const orderCode = searchParams.get('orderCode');
  const projectId = searchParams.get('projectId');
  const purchaseId = searchParams.get('purchaseId');

  useEffect(() => {
    if (loading) return undefined;

    let stopped = false;

    const reconcilePaymentReturn = () => {
      if (paymentId) {
        void paymentApi.getReturnStatus(paymentId).catch(() => {
          // The destination page will refresh its own state after redirect.
        });
        return;
      }

      if (orderCode) {
        void paymentApi.getReturnStatusByOrderCode(orderCode).catch(() => {
          // The destination page will refresh its own state after redirect.
        });
      }
    };

    const redirectAfterLookup = async () => {
      if (projectId) {
        reconcilePaymentReturn();
        navigate(buildWorkspacePath(projectId, paymentId), { replace: true });
        return;
      }

      if (purchaseId) {
        if (!user?.role) {
          navigate('/login', { replace: true });
          return;
        }

        reconcilePaymentReturn();
        navigate(buildBillingPath(user.role, purchaseId, paymentId), { replace: true });
        return;
      }

      if (!paymentId && !orderCode) {
        navigate(`${getRoleHomePath(user?.role)}?paymentReturnError=missing-payment`, { replace: true });
        return;
      }

      try {
        const payment = paymentId
          ? await paymentApi.getReturnStatus(paymentId)
          : await paymentApi.getReturnStatusByOrderCode(orderCode);

        if (stopped) return;

        if (payment.targetType === 'FEATURE_PACKAGE_PURCHASE') {
          if (!user?.role) {
            navigate('/login', { replace: true });
            return;
          }

          navigate(
            buildBillingPath(user.role, payment.featurePackagePurchaseId, payment.paymentId || paymentId),
            { replace: true }
          );
          return;
        }

        navigate(buildWorkspacePath(payment.projectId, payment.paymentId || paymentId), { replace: true });
      } catch (requestError) {
        if (!stopped) {
          setError(getApiErrorMessage(requestError, 'Không thể xác định màn hình đích của giao dịch.'));
          window.setTimeout(() => {
            navigate(`${getRoleHomePath(user?.role)}?paymentReturnError=lookup-failed`, { replace: true });
          }, 1800);
        }
      }
    };

    redirectAfterLookup();
    return () => {
      stopped = true;
    };
  }, [loading, navigate, orderCode, paymentId, projectId, purchaseId, user?.role]);

  if (error) return <LoadingState label={`${error} Đang chuyển hướng...`} />;
  return <LoadingState label="Đang kiểm tra trạng thái thanh toán..." />;
}

export function PaymentCancelPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const purchaseId = searchParams.get('purchaseId');
  const returnPath = projectId
    ? `/projects/${projectId}/execution`
    : purchaseId
      ? buildBillingPath(user?.role, purchaseId, searchParams.get('paymentId'))
      : getRoleHomePath(user?.role);

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          <CloseCircleOutlined className="result-icon danger" />
          <div>
            <Title level={2}>Thanh toán đã bị hủy</Title>
            <Paragraph className="muted-text">
              Nếu đây là thanh toán gói, bạn có thể mở lại PayOS từ trang gói AI. Nếu đây là escrow, offer vẫn
              chờ thanh toán nếu còn hiệu lực.
            </Paragraph>
          </div>
          <Alert type="info" showIcon message="Hệ thống chưa ghi nhận thanh toán thành công từ phiên này." />
          <Button type="primary">
            <Link to={returnPath}>{projectId ? 'Về workspace' : purchaseId ? 'Về gói AI' : 'Về trang chính'}</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
}
