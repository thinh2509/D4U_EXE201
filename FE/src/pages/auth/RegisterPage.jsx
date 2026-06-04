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
      message.success('Tạo tài khoản thành công. Vui lòng xác minh email.');
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Đăng ký thất bại.'));
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell auth-shell-register">
        <AuthBrandPanel />

        <Card className="auth-card">
          <div className="auth-card-content">
            <div className="auth-heading">
              <Text className="eyebrow">Tài khoản mới</Text>
              <Title level={2}>Tạo tài khoản D4U</Title>
              <Text type="secondary">Chọn vai trò phù hợp để hệ thống điều hướng đúng trải nghiệm.</Text>
            </div>

            <Form layout="vertical" onFinish={handleRegister} requiredMark={false}>
              <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
                <Radio.Group className="role-card-group">
                  <Radio.Button value="STUDENT"><IdcardOutlined /><span>Sinh viên thiết kế</span></Radio.Button>
                  <Radio.Button value="SME"><BankOutlined /><span>Doanh nghiệp</span></Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email" />
              </Form.Item>
              <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Vui lòng nhập username.' }, { min: 3, message: 'Username cần ít nhất 3 ký tự.' }]}>
                <Input size="large" prefix={<UserOutlined />} placeholder="Nhập username" />
              </Form.Item>
              <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên.' }]}>
                <Input size="large" prefix={<IdcardOutlined />} placeholder="Nhập họ và tên" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Mật khẩu"
                extra="Ít nhất 8 ký tự, gồm chữ và số."
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu.' },
                  { min: 8, message: 'Mật khẩu cần ít nhất 8 ký tự.' },
                  { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Mật khẩu phải có chữ và số.' }
                ]}
              >
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" block>Tạo tài khoản</Button>
            </Form>

            <div className="auth-switch">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
