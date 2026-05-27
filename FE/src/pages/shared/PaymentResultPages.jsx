import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';

const { Paragraph, Text, Title } = Typography;

function PaymentResultLayout({ type }) {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const isSuccess = type === 'success';

  return (
    <div className="centered-shell">
      <Card className="auth-card payment-result-card">
        <Space direction="vertical" size="large" className="full-width">
          {isSuccess ? (
            <CheckCircleOutlined className="result-icon success" />
          ) : (
            <CloseCircleOutlined className="result-icon danger" />
          )}
          <div>
            <Title level={2}>{isSuccess ? 'Đã quay lại từ PayOS' : 'Thanh toán đã bị hủy'}</Title>
            <Paragraph className="muted-text">
              {isSuccess
                ? 'Hệ thống sẽ cập nhật trạng thái escrow sau khi nhận webhook hợp lệ từ PayOS.'
                : 'Offer vẫn ở trạng thái chờ thanh toán. SME có thể tạo hoặc mở lại liên kết thanh toán nếu còn hiệu lực.'}
            </Paragraph>
          </div>
          {paymentId ? (
            <Alert type="info" showIcon message={<Text>Mã payment: {paymentId}</Text>} />
          ) : null}
          <Button type="primary">
            <Link to="/">Về trang chính</Link>
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
