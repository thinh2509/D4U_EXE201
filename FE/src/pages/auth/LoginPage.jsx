import { GoogleLogin } from '@react-oauth/google';
import {
  GoogleOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, Radio, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roleHome } from '../../components/RouteGuards.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authApi } from '../../services/authApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { AuthBrandPanel } from './AuthBrandPanel.jsx';

const { Title, Text } = Typography;

const roleLabels = {
  STUDENT: 'Student',
  SME: 'SME',
  ADMIN: 'Admin',
};

function getFriendlyAuthError(messageText) {
  const normalized = String(messageText || '').trim();

  if (!normalized) {
    return 'Đăng nhập thất bại.';
  }

  if (normalized === 'Email is not verified.') {
    return normalized;
  }

  if (
    normalized.includes('Google login role does not match') ||
    normalized.includes('role does not match the existing D4U account role')
  ) {
    return 'Tài khoản này đã được đăng ký với vai trò khác. Vui lòng chọn đúng vai trò để đăng nhập.';
  }

  if (normalized.includes('Google login is not available for this account')) {
    return 'Tài khoản này hiện không hỗ trợ đăng nhập bằng Google. Vui lòng dùng email và mật khẩu.';
  }

  if (normalized.includes('Google login only supports STUDENT and SME')) {
    return 'Đăng nhập Google hiện chỉ hỗ trợ tài khoản Student và SME.';
  }

  return normalized;
}

export function LoginPage() {
  const { message } = App.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleLogin = async (values) => {
    setFormError('');
    setSubmitting(true);

    try {
      const response = await authApi.login(values);
      login(response);
      message.success('Đăng nhập thành công.');
      navigate(roleHome(response.user.role), { replace: true });
    } catch (error) {
      const errorMessage = getFriendlyAuthError(
        getApiErrorMessage(error, 'Đăng nhập thất bại.')
      );

      if (errorMessage === 'Email is not verified.') {
        message.warning('Email chưa được xác minh. Vui lòng nhập mã OTP trước khi đăng nhập.');
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }

      setFormError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const selectedRole = form.getFieldValue('googleRole');

    if (!selectedRole) {
      const roleRequiredMessage = 'Vui lòng chọn vai trò trước khi dùng Google.';
      setFormError(roleRequiredMessage);
      message.error(roleRequiredMessage);
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const response = await authApi.googleLogin({
        idToken: credentialResponse.credential,
        role: selectedRole,
      });

      if (response?.user?.role && response.user.role !== selectedRole) {
        const mismatchMessage = `Bạn đã chọn vai trò ${roleLabels[selectedRole] || selectedRole}, nhưng tài khoản này thuộc vai trò ${roleLabels[response.user.role] || response.user.role}. Vui lòng chọn đúng vai trò để đăng nhập.`;
        setFormError(mismatchMessage);
        message.error(mismatchMessage);
        return;
      }

      login(response);
      message.success('Đăng nhập Google thành công.');
      navigate(roleHome(response.user.role), { replace: true });
    } catch (error) {
      const errorMessage = getFriendlyAuthError(
        getApiErrorMessage(error, 'Không thể đăng nhập bằng Google.')
      );
      setFormError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-login">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">Chào mừng trở lại</Text>
              <Title level={2}>Đăng nhập D4U</Title>
              <Text type="secondary">
                Tiếp tục quản lý hồ sơ, dự án, offer, ví và thông báo trong workspace của bạn.
              </Text>
            </div>

            {formError && (
              <Alert className="auth-form-alert" type="error" showIcon message={formError} />
            )}

            <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email.' },
                  { type: 'email', message: 'Email không hợp lệ.' },
                ]}
              >
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Button type="primary" size="large" htmlType="submit" block loading={submitting}>
                Đăng nhập
              </Button>

              <div className="divider-text">hoặc</div>

              <div className="auth-google-section">
                <Form.Item
                  name="googleRole"
                  label="Vai trò"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò khi dùng Google.' }]}
                >
                  <Radio.Group optionType="button" buttonStyle="solid" className="role-radio">
                    <Radio.Button value="STUDENT">Student</Radio.Button>
                    <Radio.Button value="SME">SME</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <div className="google-box">
                  {googleConfigured ? (
                    <div className="google-login-frame">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => message.error('Đăng nhập Google bị hủy hoặc thất bại.')}
                        locale="vi"
                        shape="rectangular"
                        text="continue_with"
                        width="360"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="google-login-frame">
                        <Button size="large" disabled icon={<GoogleOutlined />}>
                          Tiếp tục bằng Google
                        </Button>
                      </div>
                      <Text type="secondary" className="google-hint">
                        Cần cấu hình `VITE_GOOGLE_CLIENT_ID` để bật đăng nhập Google thật.
                      </Text>
                    </>
                  )}
                </div>
              </div>
            </Form>

            <div className="auth-switch">
              Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
