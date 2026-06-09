import {
  BankOutlined,
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, Radio, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { AuthBrandPanel } from './AuthBrandPanel.jsx';

const { Title, Text } = Typography;

function normalizeFieldName(name) {
  if (!name) return null;

  const normalized = String(name).trim().toLowerCase();
  const fieldMap = {
    role: 'role',
    email: 'email',
    username: 'username',
    fullname: 'fullName',
    full_name: 'fullName',
    password: 'password'
  };

  return fieldMap[normalized] ?? null;
}

function extractRegisterFieldErrors(error) {
  const data = error?.response?.data;
  const fieldErrors = [];

  if (data?.errors && typeof data.errors === 'object') {
    Object.entries(data.errors).forEach(([rawFieldName, messages]) => {
      const fieldName = normalizeFieldName(rawFieldName);
      if (!fieldName) return;

      const nextMessages = Array.isArray(messages)
        ? messages.filter(Boolean).map(String)
        : [String(messages)];

      if (nextMessages.length > 0) {
        fieldErrors.push({
          name: fieldName,
          errors: nextMessages
        });
      }
    });
  }

  if (fieldErrors.length > 0) {
    return fieldErrors;
  }

  const messageText = getApiErrorMessage(error, '').trim().toLowerCase();

  if (!messageText) {
    return [];
  }

  if (messageText.includes('email') && (messageText.includes('đã được đăng ký') || messageText.includes('already registered'))) {
    return [{ name: 'email', errors: ['Email này đã được đăng ký.'] }];
  }

  if (messageText.includes('username') && (messageText.includes('đã được đăng ký') || messageText.includes('already registered'))) {
    return [{ name: 'username', errors: ['Username này đã được đăng ký.'] }];
  }

  return [];
}

function clearRegisterFieldErrors(form, changedValues) {
  const nextFields = Object.keys(changedValues)
    .map(normalizeFieldName)
    .filter(Boolean)
    .map((name) => ({ name, errors: [] }));

  if (nextFields.length > 0) {
    form.setFields(nextFields);
  }
}

export function RegisterPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (values) => {
    setFormError('');
    setSubmitting(true);

    try {
      await authApi.register(values);
      message.success('Tạo tài khoản thành công. Vui lòng xác minh email.');
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const fieldErrors = extractRegisterFieldErrors(error);

      if (fieldErrors.length > 0) {
        form.setFields(fieldErrors);
      }

      const errorMessage = getApiErrorMessage(error, 'Đăng ký thất bại.');
      const hasOnlyFieldErrors = fieldErrors.length > 0 && fieldErrors.every((fieldError) => fieldError.errors.length > 0);

      if (hasOnlyFieldErrors) {
        setFormError('');
        return;
      }

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
              <Text className="eyebrow">{'Tài khoản mới'}</Text>
              <Title level={2}>{'Tạo tài khoản D4U'}</Title>
              <Text type="secondary">
                {'Chọn đúng vai trò để D4U mở dashboard, form và workflow phù hợp với bạn.'}
              </Text>
            </div>

            {formError && (
              <Alert className="auth-form-alert" type="error" showIcon message={formError} />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleRegister}
              onValuesChange={(changedValues) => {
                if (formError) {
                  setFormError('');
                }

                clearRegisterFieldErrors(form, changedValues);
              }}
              requiredMark={false}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[
                  { required: true, message: 'Vui lòng chọn vai trò.' },
                  {
                    validator: (_, value) => (
                      !value || value === 'STUDENT' || value === 'SME'
                        ? Promise.resolve()
                        : Promise.reject(new Error('Vai trò không hợp lệ.'))
                    )
                  }
                ]}
              >
                <Radio.Group className="role-card-group">
                  <Radio.Button value="STUDENT">
                    <IdcardOutlined />
                    <span>
                      <strong>Student Designer</strong>
                      <small>Tìm dự án, gửi proposal và nhận tiền qua ví D4U.</small>
                    </span>
                  </Radio.Button>
                  <Radio.Button value="SME">
                    <BankOutlined />
                    <span>
                      <strong>SME</strong>
                      <small>Đăng brief, chọn Student và thanh toán escrow.</small>
                    </span>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email.' },
                  { type: 'email', message: 'Email không hợp lệ.' },
                  { max: 255, message: 'Email không được vượt quá 255 ký tự.' }
                ]}
              >
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Vui lòng nhập username.' },
                  { min: 3, message: 'Username cần ít nhất 3 ký tự.' },
                  { max: 100, message: 'Username không được vượt quá 100 ký tự.' },
                  {
                    pattern: /^[a-zA-Z0-9._-]+$/,
                    message: 'Username chỉ được chứa chữ, số, dấu chấm, gạch dưới và gạch ngang.'
                  }
                ]}
              >
                <Input size="large" prefix={<UserOutlined />} placeholder="Nhập username" autoComplete="username" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên.' },
                  { max: 255, message: 'Họ và tên không được vượt quá 255 ký tự.' }
                ]}
              >
                <Input size="large" prefix={<IdcardOutlined />} placeholder="Nhập họ và tên" autoComplete="name" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                extra="Ít nhất 8 ký tự, gồm chữ và số."
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu.' },
                  { min: 8, message: 'Mật khẩu cần ít nhất 8 ký tự.' },
                  { max: 128, message: 'Mật khẩu không được vượt quá 128 ký tự.' },
                  { pattern: /[A-Za-z]/, message: 'Mật khẩu phải có ít nhất một chữ cái.' },
                  { pattern: /[0-9]/, message: 'Mật khẩu phải có ít nhất một chữ số.' }
                ]}
              >
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" autoComplete="new-password" />
              </Form.Item>

              <Button type="primary" size="large" htmlType="submit" block loading={submitting}>
                {'Tạo tài khoản'}
              </Button>
            </Form>

            <div className="auth-switch">
              {'Đã có tài khoản?'} <Link to="/login">{'Đăng nhập'}</Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
