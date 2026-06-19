import { GoogleLogin } from '@react-oauth/google';
import { GoogleOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
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

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.222 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.682 0-14.418 4.337-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.149 35.091 26.715 36 24 36c-5.201 0-9.62-3.317-11.283-7.946l-6.522 5.025C9.435 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

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
        getApiErrorMessage(error, 'Đăng nhập thất bại.'),
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
        getApiErrorMessage(error, 'Không thể đăng nhập bằng Google.'),
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

            {formError ? (
              <Alert className="auth-form-alert" type="error" showIcon message={formError} />
            ) : null}

            <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email.' },
                  { type: 'email', message: 'Email không hợp lệ.' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="Nhập email"
                  autoComplete="email"
                />
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
                    <div className="google-login-frame google-login-frame-custom">
                      <Button size="large" className="google-visual-button" icon={<GoogleColorIcon />}>
                        Tiếp tục với Google
                      </Button>
                      <div className="google-login-hitbox" aria-hidden="true">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => message.error('Đăng nhập Google bị hủy hoặc thất bại.')}
                          locale="vi"
                          shape="rectangular"
                          text="continue_with"
                          width="360"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="google-login-frame">
                        <Button size="large" disabled icon={<GoogleColorIcon />}>
                          Tiếp tục với Google
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
