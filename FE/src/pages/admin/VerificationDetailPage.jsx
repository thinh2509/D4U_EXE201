import { App } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import {
  VerificationAccountCard,
  VerificationChecklist,
  VerificationDecisionPanel,
  VerificationDetailHeader,
  VerificationDocumentViewer,
  StudentProfileCard
} from './VerificationDetailSections.jsx';

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setDocumentUrl(null);
    };
  }, [detail?.id]);

  const copyText = async (value, successText = 'Đã sao chép.') => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      message.success(successText);
    } catch {
      message.warning('Không thể sao chép tự động. Hãy sao chép thủ công.');
    }
  };

  const openDocument = () => {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadDocument = () => {
    if (!documentUrl || !detail?.originalFilename) return;

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = detail.originalFilename;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
      content: (
        <textarea
          className="reject-textarea"
          onChange={(event) => {
            reason = event.target.value;
          }}
          placeholder="Nhập lý do từ chối..."
        />
      ),
      okButtonProps: { danger: true },
      okText: 'Từ chối',
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
      <VerificationDetailHeader
        detail={detail}
        acting={acting}
        canReview={canReview}
        onApprove={approve}
        onBack={() => navigate('/admin/verifications')}
        onReject={reject}
      />

      <div className="verification-review-layout">
        <div className="verification-review-main">
          <VerificationDocumentViewer
            detail={detail}
            documentError={documentError}
            documentUrl={documentUrl}
            onDownload={downloadDocument}
            onOpenDocument={openDocument}
          />
        </div>

        <aside className="verification-review-sidebar">
          <div className="verification-review-sidebar-sticky">
            <VerificationDecisionPanel
              acting={acting}
              canReview={canReview}
              detail={detail}
              onApprove={approve}
              onReject={reject}
            />
          </div>
          <VerificationAccountCard detail={detail} onCopy={copyText} />
          <StudentProfileCard detail={detail} />
          <VerificationChecklist />
        </aside>
      </div>
    </>
  );
}
