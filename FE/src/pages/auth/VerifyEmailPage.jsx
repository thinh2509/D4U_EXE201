import { MailOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
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
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const requestCode = async () => {
    const email = form.getFieldValue('email');
    if (!email) {
      setFormError('Vui lòng nhập email để gửi lại mã.');
      message.error('Vui lòng nhập email để gửi lại mã.');
      return;
    }

    setFormError('');
    setResending(true);
    try {
      await authApi.requestEmailVerification({ email });
      message.success('Đã gửi lại mã xác minh email.');
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Không thể gửi lại mã xác minh.');
      setFormError(errorMessage);
      message.error(errorMessage);
    } finally {
      setResending(false);
    }
  };

  const confirmEmail = async (values) => {
    setFormError('');
    setSubmitting(true);
    try {
      await authApi.confirmEmailVerification(values);
      message.success('Xác minh email thành công. Vui lòng đăng nhập.');
      navigate('/login', { replace: true });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Không thể xác minh email.');
      setFormError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
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

            {formError && <Alert className="auth-form-alert" type="error" showIcon message={formError} />}

            <Form form={form} layout="vertical" onFinish={confirmEmail} requiredMark={false} initialValues={{ email: emailFromQuery }}>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email đã đăng ký" autoComplete="email" />
              </Form.Item>
              <Form.Item name="code" label="Mã OTP" rules={[{ required: true, message: 'Vui lòng nhập mã OTP.' }, { min: 4, message: 'Mã OTP không hợp lệ.' }]}>
                <Input size="large" inputMode="numeric" placeholder="Nhập mã xác minh" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block loading={submitting}>Xác minh email</Button>
              <Button className="secondary-auth-action" size="large" block onClick={requestCode} loading={resending}>Gửi lại mã</Button>
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
