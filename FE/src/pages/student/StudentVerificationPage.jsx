import { FileDoneOutlined, MailOutlined, SafetyCertificateOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Descriptions, Form, Input, Select, Tabs, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { profileApi } from '../../services/profileApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatFileSize, getFileExtension } from '../../utils/format.js';

const allowedExtensions = ['jpg', 'png', 'pdf'];
const maxVerificationFileSizeBytes = 20 * 1024 * 1024;

export function StudentVerificationPage() {
  const { message } = App.useApp();
  const [profile, setProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [eduRequest, setEduRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await profileApi.getStudentProfile());
    } catch (requestError) {
      if (requestError.response?.status === 404) setProfile(null);
      else setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const beforeUpload = (file) => {
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      message.error('Chỉ chấp nhận file jpg, png hoặc pdf.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > maxVerificationFileSizeBytes) {
      message.error('Dung lượng file tối đa là 20MB.');
      return Upload.LIST_IGNORE;
    }

    setSelectedFile(file);
    return false;
  };

  const submitDocument = async (values) => {
    if (!selectedFile) {
      message.error('Vui lòng chọn file xác thực.');
      return;
    }

    setSubmitting(true);
    try {
      await profileApi.submitStudentDocumentVerification({
        documentType: values.documentType,
        file: selectedFile
      });
      message.success('Đã gửi giấy tờ xác thực.');
      setSelectedFile(null);
      await loadProfile();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi xác thực.'));
    } finally {
      setSubmitting(false);
    }
  };

  const requestEdu = async (values) => {
    setSubmitting(true);
    try {
      const response = await profileApi.requestEduVerification(values);
      setEduRequest(response);
      message.success('Mã xác thực đã được gửi đến email EDU của bạn.');
      await loadProfile();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi mã xác thực.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEdu = async (values) => {
    setSubmitting(true);
    try {
      await profileApi.confirmEduVerification(values);
      message.success('Xác thực email EDU thành công.');
      setEduRequest(null);
      await loadProfile();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xác nhận mã EDU.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProfile} />;

  const status = profile?.verificationStatus || 'NOT_SUBMITTED';
  const locked = status === 'PENDING' || status === 'APPROVED';

  const items = [
    {
      key: 'document',
      label: 'Giấy tờ sinh viên',
      icon: <FileDoneOutlined />,
      children: (
        <div className="verification-tab">
          <Alert type="info" showIcon message="Chỉ nhận file jpg, png hoặc pdf. File sẽ được gửi lên API để admin xem và duyệt." />
          <Form layout="vertical" onFinish={submitDocument} disabled={!profile || locked} requiredMark={false}>
            <Form.Item name="documentType" label="Loại giấy tờ" initialValue="STUDENT_CARD" rules={[{ required: true }]}>
              <Select size="large" options={[
                { value: 'STUDENT_CARD', label: 'Thẻ sinh viên' },
                { value: 'STUDENT_CONFIRMATION', label: 'Giấy xác nhận sinh viên' }
              ]} />
            </Form.Item>
            <Form.Item label="File xác thực">
              <Upload.Dragger beforeUpload={beforeUpload} maxCount={1} accept=".jpg,.png,.pdf" onRemove={() => setSelectedFile(null)}>
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">Kéo thả file hoặc bấm để chọn</p>
                <p className="ant-upload-hint">jpg, png, pdf - tối đa 20MB</p>
              </Upload.Dragger>
            </Form.Item>
            {selectedFile && (
              <Descriptions className="file-meta" bordered size="small" column={1}>
                <Descriptions.Item label="Tên file">{selectedFile.name}</Descriptions.Item>
                <Descriptions.Item label="Định dạng">{getFileExtension(selectedFile.name)}</Descriptions.Item>
                <Descriptions.Item label="Dung lượng">{formatFileSize(selectedFile.size)}</Descriptions.Item>
              </Descriptions>
            )}
            <Button type="primary" size="large" htmlType="submit" loading={submitting}>Gửi giấy tờ</Button>
          </Form>
        </div>
      )
    },
    {
      key: 'edu',
      label: 'Email EDU',
      icon: <MailOutlined />,
      children: (
        <div className="edu-grid">
          <Card className="mini-card" title="Gửi mã xác thực">
            <Form layout="vertical" onFinish={requestEdu} disabled={!profile || locked} requiredMark={false}>
              <Form.Item name="email" label="Email trường học" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}>
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email trường học" />
              </Form.Item>
              <Button type="primary" size="large" htmlType="submit" loading={submitting}>Gửi mã</Button>
            </Form>
          </Card>
          <Card className="mini-card" title="Xác nhận mã">
            {eduRequest && (
              <Alert className="page-alert" type="success" showIcon message="Mã đã được gửi qua email. Vui lòng kiểm tra hộp thư EDU và nhập mã tại đây." />
            )}
            <Form layout="vertical" onFinish={confirmEdu} disabled={!profile || status === 'APPROVED'} requiredMark={false}>
              <Form.Item name="email" label="Email trường học" initialValue={eduRequest?.email} rules={[{ required: true }, { type: 'email' }]}>
                <Input size="large" placeholder="Nhập email trường học" />
              </Form.Item>
              <Form.Item name="code" label="Mã xác thực" rules={[{ required: true, message: 'Vui lòng nhập mã.' }]}>
                <Input size="large" placeholder="Nhập mã xác thực" />
              </Form.Item>
              <Button size="large" htmlType="submit" loading={submitting}>Xác nhận</Button>
            </Form>
          </Card>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<SafetyCertificateOutlined />}
        title="Xác thực sinh viên"
        description="Xác minh bằng giấy tờ hoặc email EDU để đủ điều kiện sử dụng marketplace."
        extra={<StatusBadge status={status} />}
      />

      <div className={`verification-banner status-${status.toLowerCase()}`}>
        <div>
          <span>Trạng thái xác thực</span>
          <strong><StatusBadge status={status} /></strong>
        </div>
        <p>
          {!profile && 'Bạn cần tạo hồ sơ sinh viên trước khi gửi xác thực.'}
          {profile && status === 'NOT_SUBMITTED' && 'Chọn một trong hai phương thức bên dưới để gửi xác thực.'}
          {profile && status === 'PENDING' && 'Yêu cầu đang chờ xử lý hoặc chờ bạn nhập mã EDU.'}
          {profile && status === 'APPROVED' && 'Bạn đã được xác thực là sinh viên.'}
          {profile && status === 'REJECTED' && 'Yêu cầu trước đó bị từ chối. Bạn có thể gửi lại thông tin phù hợp hơn.'}
        </p>
      </div>

      <Card className="tabs-card">
        <Tabs items={items} />
      </Card>
    </>
  );
}
