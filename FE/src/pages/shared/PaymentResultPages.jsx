import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
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
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (!isSuccess || !paymentId) return undefined;

    setError(null);
    setTimedOut(false);
    let attempts = 0;
    let stopped = false;
    const poll = async () => {
      try {
        const current = await paymentApi.getReturnStatus(paymentId);
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
  }, [isSuccess, navigate, paymentId, pollAttempt]);

  const retryPolling = () => setPollAttempt((current) => current + 1);
  const workspacePath = payment?.projectId ? `/projects/${payment.projectId}/execution` : '/sme/offers';

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          {isSuccess ? (
            payment?.status === 'SUCCESS' ? (
              <CheckCircleOutlined className="result-icon success" />
            ) : timedOut ? (
              <ExclamationCircleOutlined className="result-icon warning" />
            ) : (
              <LoadingOutlined className="result-icon" />
            )
          ) : (
            <CloseCircleOutlined className="result-icon danger" />
          )}
          <div>
            <Title level={2}>{payment?.status === 'SUCCESS' ? 'Thanh toán thành công' : isSuccess ? 'Đang xác nhận thanh toán' : 'Thanh toán đã bị hủy'}</Title>
            <Paragraph className="muted-text">
              {isSuccess
                ? payment?.status === 'SUCCESS'
                  ? 'PayOS đã xác nhận giao dịch. Đang chuyển về project workspace.'
                  : 'Trang này chỉ đọc trạng thái backend. Project bắt đầu sau khi webhook PayOS hợp lệ được xử lý.'
                : 'Offer vẫn chờ thanh toán nếu còn hiệu lực. SME có thể mở lại link PayOS từ workspace.'}
            </Paragraph>
          </div>
          {paymentId ? <Alert type="info" showIcon message={<Text>Payment: {paymentId}</Text>} /> : null}
          {payment ? <Alert type="info" showIcon message={<Space>Trạng thái backend: <StatusBadge status={payment.status} /></Space>} /> : null}
          {error ? <Alert type="warning" showIcon message={error} /> : null}
          {timedOut ? <Alert type="warning" showIcon message="Chưa nhận được webhook sau 60 giây. Bạn có thể thử lại hoặc về workspace để kiểm tra." /> : null}
          <Space wrap>
            {timedOut ? <Button onClick={retryPolling}>Thử lại</Button> : null}
            <Button type="primary">
              <Link to={workspacePath}>{payment?.projectId ? 'Về workspace' : 'Về danh sách offer'}</Link>
            </Button>
          </Space>
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
