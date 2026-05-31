import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { paymentApi } from '../../services/paymentApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const { Paragraph, Text, Title } = Typography;

function PaymentResultLayout({ type }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const isSuccess = type === 'success';
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isSuccess || !paymentId) return undefined;

    let attempts = 0;
    let stopped = false;
    const poll = async () => {
      try {
        const current = await paymentApi.getPaymentStatus(paymentId);
        if (stopped) return;
        setPayment(current);
        if (current.status === 'SUCCESS') {
          stopped = true;
          window.setTimeout(() => navigate(`/projects/${current.projectId}/execution`), 800);
          return;
        }
      } catch (requestError) {
        if (!stopped) setError(getApiErrorMessage(requestError, 'Khong the doc trang thai payment.'));
      }

      attempts += 1;
      if (!stopped && attempts < 30) {
        window.setTimeout(poll, 2000);
      } else if (!stopped) {
        setTimedOut(true);
      }
    };

    poll();
    return () => { stopped = true; };
  }, [isSuccess, navigate, paymentId]);

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          {isSuccess ? (
            payment?.status === 'SUCCESS' ? <CheckCircleOutlined className="result-icon success" /> : <LoadingOutlined className="result-icon" />
          ) : (
            <CloseCircleOutlined className="result-icon danger" />
          )}
          <div>
            <Title level={2}>{isSuccess ? 'Dang xac nhan thanh toan' : 'Thanh toan da bi huy'}</Title>
            <Paragraph className="muted-text">
              {isSuccess
                ? 'Trang nay chi doc trang thai backend. Project bat dau sau khi webhook PayOS hop le duoc xu ly.'
                : 'Offer van cho thanh toan neu con hieu luc. SME co the mo lai link PayOS tu workspace.'}
            </Paragraph>
          </div>
          {paymentId ? <Alert type="info" showIcon message={<Text>Payment: {paymentId}</Text>} /> : null}
          {payment ? <Alert type="info" showIcon message={<Space>Trang thai backend: <StatusBadge status={payment.status} /></Space>} /> : null}
          {error ? <Alert type="warning" showIcon message={error} /> : null}
          {timedOut ? <Alert type="warning" showIcon message="Chua nhan duoc webhook sau 60 giay. Mo workspace va lam moi de kiem tra lai." /> : null}
          <Button type="primary">
            <Link to="/">Ve trang chinh</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export function PaymentSuccessPage() {
  return <PaymentResultLayout type="success" />;
}

export function PaymentCancelPage() {
  return <PaymentResultLayout type="cancel" />;
}
