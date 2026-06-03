import { GoogleLogin } from '@react-oauth/google';
import {
  GoogleOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';
import { App, Button, Card, Form, Input, Radio, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { roleHome } from '../../components/RouteGuards.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authApi } from '../../services/authApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { AuthBrandPanel } from './AuthBrandPanel.jsx';

const { Title, Text } = Typography;

export function LoginPage() {
  const { message } = App.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleLogin = async (values) => {
    try {
      const response = await authApi.login(values);
      login(response);
      message.success('ÄÄƒng nháº­p thÃ nh cÃ´ng.');
      navigate(roleHome(response.user.role), { replace: true });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'ÄÄƒng nháº­p tháº¥t báº¡i.');
      if (errorMessage === 'Email is not verified.') {
        message.warning('Email chÆ°a Ä‘Æ°á»£c xÃ¡c minh. Vui lÃ²ng nháº­p mÃ£ OTP trÆ°á»›c khi Ä‘Äƒng nháº­p.');
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }
      message.error(errorMessage);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const role = form.getFieldValue('googleRole');
    if (!role) {
      message.error('Vui lÃ²ng chá»n vai trÃ² khi dÃ¹ng Google.');
      return;
    }

    try {
      const response = await authApi.googleLogin({
        idToken: credentialResponse.credential,
        role
      });
      login(response);
      message.success('ÄÄƒng nháº­p Google thÃ nh cÃ´ng.');
      navigate(roleHome(response.user.role), { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'KhÃ´ng thá»ƒ Ä‘Äƒng nháº­p báº±ng Google.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-login">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">ChÃ o má»«ng trá»Ÿ láº¡i</Text>
              <Title level={2}>ÄÄƒng nháº­p D4U</Title>
              <Text type="secondary">Tiáº¿p tá»¥c quáº£n lÃ½ há»“ sÆ¡, xÃ¡c thá»±c, dá»± Ã¡n vÃ  marketplace thiáº¿t káº¿.</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p email.' }, { type: 'email', message: 'Email khÃ´ng há»£p lá»‡.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nháº­p email" />
              </Form.Item>
              <Form.Item name="password" label="Máº­t kháº©u" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p máº­t kháº©u.' }]}>
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nháº­p máº­t kháº©u" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block>ÄÄƒng nháº­p</Button>

              <div className="divider-text">hoáº·c</div>

              <Form.Item name="googleRole" label="Vai trÃ² khi dÃ¹ng Google" rules={[{ required: true, message: 'Vui lÃ²ng chá»n vai trÃ² khi dÃ¹ng Google.' }]}>
                <Radio.Group optionType="button" buttonStyle="solid" className="role-radio">
                  <Radio.Button value="STUDENT">Sinh viÃªn</Radio.Button>
                  <Radio.Button value="SME">Doanh nghiá»‡p</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <div className="google-box">
                {googleConfigured ? (
                  <>
                    <Text strong className="google-label">Tiáº¿p tá»¥c vá»›i Google</Text>
                    <div className="google-login-frame">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => message.error('Google login bá»‹ há»§y hoáº·c tháº¥t báº¡i.')}
                        locale="vi"
                        shape="rectangular"
                        text="continue_with"
                        width="360"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Button size="large" block disabled icon={<GoogleOutlined />}>Tiáº¿p tá»¥c vá»›i Google</Button>
                    <Text type="secondary" className="google-hint">Cáº§n cáº¥u hÃ¬nh VITE_GOOGLE_CLIENT_ID Ä‘á»ƒ báº­t Ä‘Äƒng nháº­p Google tháº­t.</Text>
                  </>
                )}
              </div>
            </Form>

            <div className="auth-switch">
              ChÆ°a cÃ³ tÃ i khoáº£n? <Link to="/register">ÄÄƒng kÃ½</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
