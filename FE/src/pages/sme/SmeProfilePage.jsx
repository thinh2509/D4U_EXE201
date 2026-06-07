import { BankOutlined, FolderOpenOutlined, ShopOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, Statistic } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { profileApi } from '../../services/profileApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function SmeProfilePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileApi.getSmeProfile();
      setProfile(data);
      form.setFieldsValue(data);
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setProfile(null);
        form.resetFields();
      } else {
        setError(getApiErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const saved = await profileApi.saveSmeProfile({ ...values, logoFileId: null });
      setProfile(saved);
      form.setFieldsValue(saved);
      message.success('Đã lưu hồ sơ doanh nghiệp.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu hồ sơ.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProfile} />;

  return (
    <>
      <PageHeader
        icon={<BankOutlined />}
        title="Hồ sơ doanh nghiệp"
        description="Hoàn thiện thông tin SME trước khi tạo và publish dự án thiết kế."
      />

      {!profile && <Alert className="page-alert" type="info" showIcon message="Bạn chưa có hồ sơ doanh nghiệp." />}

      <div className="profile-layout">
        <aside className="profile-summary">
          <Card className="summary-card visual-card">
            <div className="profile-cover" />
            <div className="summary-icon"><ShopOutlined /></div>
            <Statistic title="Trạng thái hồ sơ" value={profile ? 'Đã cập nhật' : 'Chưa tạo'} />
            <div className="metric-strip">
              <FolderOpenOutlined />
              <div>
                <span>Project đang mở</span>
                <strong>{profile?.activeOpenProjectCount ?? 0}</strong>
              </div>
            </div>
          </Card>
        </aside>

        <Card className="form-panel" title="Thông tin doanh nghiệp">
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            <Form.Item name="companyName" label="Tên doanh nghiệp" rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp.' }]}>
              <Input size="large" placeholder="Nhập tên doanh nghiệp" />
            </Form.Item>
            <div className="form-two-cols">
              <Form.Item name="representativeName" label="Người đại diện" rules={[{ required: true, message: 'Vui lòng nhập người đại diện.' }]}>
                <Input size="large" placeholder="Nhập tên người đại diện" />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại.' }]}>
                <Input size="large" placeholder="Nhập số điện thoại" />
              </Form.Item>
            </div>
            <Form.Item name="businessField" label="Lĩnh vực kinh doanh" rules={[{ required: true, message: 'Vui lòng nhập lĩnh vực.' }]}>
              <Input size="large" placeholder="Nhập lĩnh vực kinh doanh" />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit" loading={saving}>Lưu hồ sơ</Button>
          </Form>
        </Card>
      </div>
    </>
  );
}
