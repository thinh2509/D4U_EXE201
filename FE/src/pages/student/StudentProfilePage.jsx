import { IdcardOutlined, SafetyCertificateOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, InputNumber, Statistic } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { profileApi } from '../../services/profileApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function StudentProfilePage() {
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
      const data = await profileApi.getStudentProfile();
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
      const saved = await profileApi.saveStudentProfile(values);
      setProfile(saved);
      form.setFieldsValue(saved);
      message.success('Đã lưu hồ sơ sinh viên.');
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
        icon={<IdcardOutlined />}
        title="Hồ sơ sinh viên"
        description="Hoàn thiện thông tin học tập để xác thực và ứng tuyển dự án thiết kế."
      />

      {!profile && (
        <Alert
          className="page-alert"
          type="info"
          showIcon
          message="Bạn chưa có hồ sơ sinh viên"
          description="Lưu hồ sơ trước khi gửi xác thực hoặc ứng tuyển dự án."
        />
      )}

      <div className="profile-layout">
        <aside className="profile-summary">
          <Card className="summary-card visual-card">
            <div className="profile-cover" />
            <div className="summary-icon"><SafetyCertificateOutlined /></div>
            <Statistic title="Trạng thái hồ sơ" value={profile ? 'Đã cập nhật' : 'Chưa tạo'} />
            <div className="status-row">
              <span>Xác thực</span>
              <StatusBadge status={profile?.verificationStatus || 'NOT_SUBMITTED'} />
            </div>
            <div className="metric-strip">
              <TrophyOutlined />
              <div>
                <span>Dự án hoàn thành</span>
                <strong>{profile?.completedProjectsCount ?? 0}</strong>
              </div>
            </div>
          </Card>
        </aside>

        <Card className="form-panel" title="Thông tin học tập">
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            <div className="form-two-cols">
              <Form.Item name="school" label="Trường học" rules={[{ required: true, message: 'Vui lòng nhập trường học.' }]}>
                <Input size="large" placeholder="Nhập tên trường học" />
              </Form.Item>
              <Form.Item name="major" label="Chuyên ngành" rules={[{ required: true, message: 'Vui lòng nhập chuyên ngành.' }]}>
                <Input size="large" placeholder="Nhập chuyên ngành" />
              </Form.Item>
            </div>
            <Form.Item name="studyStartYear" label="Năm bắt đầu học" rules={[{ required: true, message: 'Vui lòng nhập năm bắt đầu học.' }]}>
              <InputNumber className="full-width" size="large" min={2000} max={new Date().getFullYear() + 1} placeholder="Nhập năm bắt đầu" />
            </Form.Item>
            <Form.Item name="bio" label="Giới thiệu bản thân">
              <Input.TextArea rows={5} maxLength={1000} showCount placeholder="Nhập giới thiệu ngắn về bản thân" />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit" loading={saving}>Lưu hồ sơ</Button>
          </Form>
        </Card>
      </div>
    </>
  );
}
