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
      message.error('Vui lÃ²ng nháº­p email Ä‘á»ƒ gá»­i láº¡i mÃ£.');
      return;
    }

    try {
      await authApi.requestEmailVerification({ email });
      message.success('ÄÃ£ gá»­i láº¡i mÃ£ xÃ¡c minh email.');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'KhÃ´ng thá»ƒ gá»­i láº¡i mÃ£ xÃ¡c minh.'));
    }
  };

  const confirmEmail = async (values) => {
    try {
      await authApi.confirmEmailVerification(values);
      message.success('XÃ¡c minh email thÃ nh cÃ´ng. Vui lÃ²ng Ä‘Äƒng nháº­p.');
      navigate('/login', { replace: true });
    } catch (error) {
      message.error(getApiErrorMessage(error, 'KhÃ´ng thá»ƒ xÃ¡c minh email.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-register">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">XÃ¡c minh email</Text>
              <Title level={2}>Nháº­p mÃ£ OTP</Title>
              <Text type="secondary">Kiá»ƒm tra há»™p thÆ° vÃ  nháº­p mÃ£ xÃ¡c minh Ä‘á»ƒ kÃ­ch hoáº¡t Ä‘Äƒng nháº­p.</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={confirmEmail} requiredMark={false} initialValues={{ email: emailFromQuery }}>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p email.' }, { type: 'email', message: 'Email khÃ´ng há»£p lá»‡.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nháº­p email Ä‘Ã£ Ä‘Äƒng kÃ½" />
              </Form.Item>
              <Form.Item name="code" label="MÃ£ OTP" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p mÃ£ OTP.' }, { min: 4, message: 'MÃ£ OTP khÃ´ng há»£p lá»‡.' }]}>
                <Input size="large" inputMode="numeric" placeholder="Nháº­p mÃ£ xÃ¡c minh" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block>XÃ¡c minh email</Button>
              <Button className="secondary-auth-action" size="large" block onClick={requestCode}>Gá»­i láº¡i mÃ£</Button>
            </Form>
            <div className="auth-switch">
              ÄÃ£ xÃ¡c minh? <Link to="/login">ÄÄƒng nháº­p</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
