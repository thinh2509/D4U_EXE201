import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Descriptions, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate, formatFileSize } from '../../utils/format.js';

export function VerificationDetailPage() {
  const { message, modal } = App.useApp();
  const { verificationId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);

  const isImage = useMemo(() => detail?.mimeType?.startsWith('image/'), [detail?.mimeType]);
  const isPdf = detail?.mimeType === 'application/pdf';

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await adminApi.getStudentVerification(verificationId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [verificationId]);

  useEffect(() => {
    if (!detail?.id) return undefined;

    let objectUrl;
    setDocumentError(null);

    adminApi.getStudentVerificationDocument(detail.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setDocumentUrl(objectUrl);
      })
      .catch((requestError) => {
        setDocumentError(getApiErrorMessage(requestError, 'Không thể tải file xác thực.'));
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDocumentUrl(null);
    };
  }, [detail?.id]);

  const approve = () => {
    modal.confirm({
      title: 'Duyệt xác thực sinh viên?',
      content: 'Sinh viên sẽ được chuyển sang trạng thái đã xác thực.',
      okText: 'Duyệt',
      cancelText: 'Hủy',
      async onOk() {
        setActing(true);
        try {
          await adminApi.approveStudentVerification(verificationId);
          message.success('Đã duyệt xác thực.');
          await loadDetail();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể duyệt xác thực.'));
        } finally {
          setActing(false);
        }
      }
    });
  };

  const reject = () => {
    let reason = '';
    modal.confirm({
      title: 'Từ chối xác thực',
      content: <textarea className="reject-textarea" placeholder="Nhập lý do từ chối..." onChange={(event) => { reason = event.target.value; }} />,
      okText: 'Từ chối',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      async onOk() {
        if (!reason.trim()) {
          message.error('Vui lòng nhập lý do từ chối.');
          return Promise.reject(new Error('Missing reason'));
        }
        setActing(true);
        try {
          await adminApi.rejectStudentVerification(verificationId, reason.trim());
          message.success('Đã từ chối xác thực.');
          await loadDetail();
        } catch (requestError) {
          message.error(getApiErrorMessage(requestError, 'Không thể từ chối xác thực.'));
        } finally {
          setActing(false);
        }
      }
    });
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadDetail} />;

  const canReview = detail.status === 'PENDING';

  return (
    <>
      <PageHeader
        title="Chi tiết xác thực"
        description="Kiểm tra hồ sơ và file giấy tờ trước khi quyết định."
        extra={(
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/verifications')}>Quay lại</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={!canReview} loading={acting} onClick={approve}>Duyệt</Button>
            <Button danger icon={<CloseCircleOutlined />} disabled={!canReview} loading={acting} onClick={reject}>Từ chối</Button>
          </Space>
        )}
      />

      {detail.rejectionReason && <Alert className="page-alert" type="error" showIcon message="Lý do từ chối" description={detail.rejectionReason} />}

      <div className="review-layout">
        <Card className="review-main" title="File xác thực">
          {documentError && <Alert className="page-alert" type="error" showIcon message={documentError} />}

          <div className="document-preview">
            {documentUrl && isImage && <img src={documentUrl} alt={detail.originalFilename} />}
            {documentUrl && isPdf && <iframe title={detail.originalFilename} src={documentUrl} />}
            {documentUrl && !isImage && !isPdf && (
              <a href={documentUrl} target="_blank" rel="noreferrer">
                <FilePdfOutlined /> Mở file xác thực
              </a>
            )}
            {!documentUrl && !documentError && <span className="muted-text">Đang tải file xác thực...</span>}
          </div>

          <Descriptions className="document-meta" column={{ xs: 1, md: 2 }} bordered size="small">
            <Descriptions.Item label="Tên file">{detail.originalFilename}</Descriptions.Item>
            <Descriptions.Item label="Định dạng">{detail.fileExtension}</Descriptions.Item>
            <Descriptions.Item label="Dung lượng">{formatFileSize(detail.fileSizeBytes)}</Descriptions.Item>
            <Descriptions.Item label="Mime type">{detail.mimeType}</Descriptions.Item>
            <Descriptions.Item label="Ngày gửi">{formatDate(detail.submittedAt)}</Descriptions.Item>
            <Descriptions.Item label="Ngày xử lý">{formatDate(detail.reviewedAt)}</Descriptions.Item>
          </Descriptions>
        </Card>

        <aside className="review-side">
          <Card title="Tài khoản">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Họ tên">{detail.studentFullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{detail.studentEmail}</Descriptions.Item>
              <Descriptions.Item label="Username">{detail.studentUsername}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><StatusBadge status={detail.status} /></Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Hồ sơ sinh viên">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Trường">{detail.school}</Descriptions.Item>
              <Descriptions.Item label="Chuyên ngành">{detail.major}</Descriptions.Item>
              <Descriptions.Item label="Năm bắt đầu">{detail.studyStartYear}</Descriptions.Item>
              <Descriptions.Item label="Bio">{detail.bio || 'Chưa có'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </aside>
      </div>
    </>
  );
}
