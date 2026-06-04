import { MailOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/authApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { AuthBrandPanel } from './AuthBrandPanel.jsx';

const { Title, Text } = Typography;

export function VerifyEmailPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const [form] = Form.useForm();

  const requestCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      message.error('Vui lòng nhập email để gửi lại mã.');
      return;
    }

    try {
      await authApi.requestEmailVerification({ email });
      message.success('Đã gửi lại mã xác minh email.');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể gửi lại mã xác minh.'));
    }
  };

  const confirmEmail = async (values) => {
    try {
      await authApi.confirmEmailVerification(values);
      message.success('Xác minh email thành công. Vui lòng đăng nhập.');
      navigate('/login', { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể xác minh email.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-register">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">Xác minh email</Text>
              <Title level={2}>Nhập mã OTP</Title>
              <Text type="secondary">Kiểm tra hộp thư và nhập mã xác minh để kích hoạt đăng nhập.</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={confirmEmail} requiredMark={false} initialValues={{ email: emailFromQuery }}>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email đã đăng ký" />
              </Form.Item>
              <Form.Item name="code" label="Mã OTP" rules={[{ required: true, message: 'Vui lòng nhập mã OTP.' }, { min: 4, message: 'Mã OTP không hợp lệ.' }]}>
                <Input size="large" inputMode="numeric" placeholder="Nhập mã xác minh" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block>Xác minh email</Button>
              <Button className="secondary-auth-action" size="large" block onClick={requestCode}>Gửi lại mã</Button>
            </Form>
            <div className="auth-switch">
              Đã xác minh? <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
