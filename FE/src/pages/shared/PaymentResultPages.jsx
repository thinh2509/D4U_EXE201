import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Progress, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { paymentApi } from '../../services/paymentApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

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
  const [pollCount, setPollCount] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isSuccess || !paymentId) return undefined;

    setError(null);
    setTimedOut(false);
    setPollCount(0);
    let attempts = 0;
    let stopped = false;
    const poll = async () => {
      setChecking(true);
      try {
        const current = await paymentApi.getReturnStatus(paymentId);
        if (stopped) return;
        setPayment(current);
        if (current.status === 'SUCCESS') {
          stopped = true;
          window.setTimeout(() => navigate(`/projects/${current.projectId}/execution`), 1800);
          return;
        }
      } catch (requestError) {
        if (!stopped) setError(getApiErrorMessage(requestError, 'Không thể kiểm tra trạng thái thanh toán.'));
      } finally {
        if (!stopped) setChecking(false);
      }

      attempts += 1;
      setPollCount(attempts);
      if (!stopped && attempts < 30) {
        window.setTimeout(poll, 2000);
      } else if (!stopped) {
        setTimedOut(true);
      }
    };

    poll();
    return () => { stopped = true; };
  }, [isSuccess, navigate, paymentId, pollAttempt]);

  const retryPolling = () => {
    setTimedOut(false);
    setPollAttempt((current) => current + 1);
  };
  const workspacePath = payment?.projectId ? `/projects/${payment.projectId}/execution` : '/sme/offers';
  const paymentSucceeded = payment?.status === 'SUCCESS';
  const paymentFailed = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(payment?.status);
  const progressPercent = paymentSucceeded ? 100 : Math.min(92, Math.max(12, pollCount * 3));

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          {isSuccess ? (
            paymentSucceeded ? (
              <CheckCircleOutlined className="result-icon success" />
            ) : paymentFailed ? (
              <CloseCircleOutlined className="result-icon danger" />
            ) : timedOut ? (
              <ExclamationCircleOutlined className="result-icon warning" />
            ) : (
              <ClockCircleOutlined className="result-icon pending" />
            )
          ) : (
            <CloseCircleOutlined className="result-icon danger" />
          )}
          <div>
            <Title level={2}>{paymentSucceeded ? 'Thanh toán thành công' : paymentFailed ? 'Thanh toán chưa hoàn tất' : isSuccess ? 'Đang đối soát với PayOS' : 'Thanh toán đã bị hủy'}</Title>
            <Paragraph className="muted-text">
              {isSuccess
                ? paymentSucceeded
                  ? 'Escrow đã được ghi nhận. Dự án đã bắt đầu và bạn sẽ được chuyển về workspace.'
                  : paymentFailed
                    ? 'Link thanh toán không còn hiệu lực. Bạn có thể quay về danh sách offer để tạo lại checkout.'
                    : 'Hệ thống đang kiểm tra trực tiếp trạng thái giao dịch từ PayOS. Bạn có thể giữ nguyên trang này.'
                : 'Offer vẫn chờ thanh toán nếu còn hiệu lực. SME có thể mở lại link PayOS từ workspace.'}
            </Paragraph>
          </div>
          {isSuccess && !paymentFailed ? (
            <Progress
              percent={progressPercent}
              status={paymentSucceeded ? 'success' : 'active'}
              showInfo={paymentSucceeded}
              strokeColor={paymentSucceeded ? 'var(--success)' : 'var(--primary)'}
            />
          ) : null}
          {paymentId ? <Alert type="info" showIcon message={<Text>Payment: {paymentId}</Text>} /> : null}
          {payment ? <Alert type="info" showIcon message={<Space>Trạng thái backend: <StatusBadge status={payment.status} /></Space>} /> : null}
          {payment?.checkedAt ? <Text className="muted-text">Kiểm tra gần nhất: {formatDate(payment.checkedAt)}</Text> : null}
          {payment?.expiresAt && !paymentSucceeded ? <Text className="muted-text">Checkout hiệu lực đến: {formatDate(payment.expiresAt)}</Text> : null}
          {error ? <Alert type="warning" showIcon message={error} /> : null}
          {timedOut ? <Alert type="warning" showIcon message="PayOS chưa trả kết quả sau 60 giây. Bạn có thể kiểm tra lại hoặc về workspace; hệ thống không tự đánh dấu thành công nếu chưa đối soát được." /> : null}
          <Space wrap>
            {isSuccess && !paymentSucceeded ? <Button icon={<ReloadOutlined />} loading={checking} onClick={retryPolling}>Kiểm tra lại</Button> : null}
            <Button type="primary" icon={<ArrowRightOutlined />}>
              <Link to={workspacePath}>{payment?.projectId ? 'Vào workspace' : 'Về danh sách offer'}</Link>
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
