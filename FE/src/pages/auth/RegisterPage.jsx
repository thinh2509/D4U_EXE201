import {
  BankOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined
} from '@ant-design/icons';
import { App, Button, Card, Form, Input, Radio, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { AuthBrandPanel } from './AuthBrandPanel.jsx';

const { Title, Text } = Typography;

export function RegisterPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleRegister = async (values) => {
    try {
      await authApi.register(values);
      message.success('Táº¡o tÃ i khoáº£n thÃ nh cÃ´ng. Vui lÃ²ng xÃ¡c minh email.');
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'ÄÄƒng kÃ½ tháº¥t báº¡i.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-register">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">TÃ i khoáº£n má»›i</Text>
              <Title level={2}>Táº¡o tÃ i khoáº£n D4U</Title>
              <Text type="secondary">Chá»n vai trÃ² phÃ¹ há»£p Ä‘á»ƒ há»‡ thá»‘ng Ä‘iá»u hÆ°á»›ng Ä‘Ãºng tráº£i nghiá»‡m.</Text>
            </div>

            <Form layout="vertical" onFinish={handleRegister} requiredMark={false}>
              <Form.Item name="role" label="Vai trÃ²" rules={[{ required: true, message: 'Vui lÃ²ng chá»n vai trÃ².' }]}>
                <Radio.Group className="role-card-group">
                  <Radio.Button value="STUDENT"><IdcardOutlined /><span>Sinh viÃªn thiáº¿t káº¿</span></Radio.Button>
                  <Radio.Button value="SME"><BankOutlined /><span>Doanh nghiá»‡p</span></Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p email.' }, { type: 'email', message: 'Email khÃ´ng há»£p lá»‡.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nháº­p email" />
              </Form.Item>
              <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p username.' }, { min: 3, message: 'Username cáº§n Ã­t nháº¥t 3 kÃ½ tá»±.' }]}>
                <Input size="large" prefix={<UserOutlined />} placeholder="Nháº­p username" />
              </Form.Item>
              <Form.Item name="fullName" label="Há» vÃ  tÃªn" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p há» tÃªn.' }]}>
                <Input size="large" prefix={<IdcardOutlined />} placeholder="Nháº­p há» vÃ  tÃªn" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Máº­t kháº©u"
                extra="Ãt nháº¥t 8 kÃ½ tá»±, gá»“m chá»¯ vÃ  sá»‘."
                rules={[
                  { required: true, message: 'Vui lÃ²ng nháº­p máº­t kháº©u.' },
                  { min: 8, message: 'Máº­t kháº©u cáº§n Ã­t nháº¥t 8 kÃ½ tá»±.' },
                  { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Máº­t kháº©u pháº£i cÃ³ chá»¯ vÃ  sá»‘.' }
                ]}
              >
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nháº­p máº­t kháº©u" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block>Táº¡o tÃ i khoáº£n</Button>
            </Form>

            <div className="auth-switch">
              ÄÃ£ cÃ³ tÃ i khoáº£n? <Link to="/login">ÄÄƒng nháº­p</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
