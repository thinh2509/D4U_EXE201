import { IdcardOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/profileApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { ErrorState, LoadingState } from './StateViews.jsx';

export function useStudentReadiness() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await profileApi.getStudentProfile());
    } catch (requestError) {
      if (requestError?.response?.status === 404) {
        setProfile(null);
      } else {
        setError(getApiErrorMessage(requestError, 'Không thể kiểm tra trạng thái hồ sơ sinh viên.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const verificationStatus = profile?.verificationStatus || 'NOT_SUBMITTED';

  return useMemo(() => ({
    profile,
    loading,
    error,
    reload: loadProfile,
    verificationStatus,
    hasProfile: Boolean(profile),
    isApproved: verificationStatus === 'APPROVED',
    needsProfile: !profile,
    needsVerification: Boolean(profile) && verificationStatus !== 'APPROVED'
  }), [error, loading, profile, verificationStatus]);
}

export function StudentReadinessNotice({
  mode,
  title,
  description,
  primaryActionLabel,
  primaryActionPath,
  secondaryActionLabel,
  secondaryActionPath,
  compact = false
}) {
  const navigate = useNavigate();
  const effectiveTitle = title || (mode === 'profile'
    ? 'Bạn cần tạo hồ sơ sinh viên trước'
    : 'Bạn cần hoàn tất xác thực sinh viên');
  const effectiveDescription = description || (mode === 'profile'
    ? 'D4U cần hồ sơ sinh viên để mở ví, lưu trạng thái ứng tuyển và cho phép bạn dùng các tính năng Student đầy đủ.'
    : 'Các tính năng Student quan trọng chỉ mở khi hồ sơ đã được xác thực để SME có thể tin tưởng proposal và offer của bạn.');
  const effectivePrimaryLabel = primaryActionLabel || (mode === 'profile' ? 'Tạo hồ sơ sinh viên' : 'Hoàn tất xác thực');
  const effectivePrimaryPath = primaryActionPath || (mode === 'profile' ? '/student/profile' : '/student/verification');
  const effectiveSecondaryLabel = secondaryActionLabel || (mode === 'profile' ? 'Về dashboard' : 'Xem hồ sơ sinh viên');
  const effectiveSecondaryPath = secondaryActionPath || (mode === 'profile' ? '/student/dashboard' : '/student/profile');

  return (
    <section className={`student-readiness-shell ${compact ? 'is-compact' : ''}`}>
      <Card className="student-readiness-card">
        <div className="student-readiness-copy">
          <Tag color="cyan">{mode === 'profile' ? 'Bước nên làm trước' : 'Cần xác thực để tiếp tục'}</Tag>
          <h2>{effectiveTitle}</h2>
          <p>{effectiveDescription}</p>
          <div className="student-readiness-actions">
            <Button type="primary" size="large" onClick={() => navigate(effectivePrimaryPath)}>
              {effectivePrimaryLabel}
            </Button>
            <Button size="large" onClick={() => navigate(effectiveSecondaryPath)}>
              {effectiveSecondaryLabel}
            </Button>
          </div>
        </div>

        <div className="student-readiness-steps">
          <div className="student-readiness-step">
            <div className="student-readiness-icon"><IdcardOutlined /></div>
            <div>
              <strong>Tạo hồ sơ sinh viên</strong>
              <span>Điền trường học, chuyên ngành và phần giới thiệu ngắn để D4U mở đúng workflow Student.</span>
            </div>
          </div>
          <div className="student-readiness-step">
            <div className="student-readiness-icon"><SafetyCertificateOutlined /></div>
            <div>
              <strong>Xác thực bằng EDU hoặc giấy tờ</strong>
              <span>Hoàn tất xác thực để dùng marketplace actions, nhận offer và theo dõi tiến trình an toàn hơn.</span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

export function StudentReadinessGate({
  requireApproved = false,
  profileTitle,
  profileDescription,
  approvedTitle,
  approvedDescription,
  children
}) {
  const readiness = useStudentReadiness();

  if (readiness.loading) return <LoadingState />;
  if (readiness.error) return <ErrorState description={readiness.error} onRetry={readiness.reload} />;

  if (readiness.needsProfile) {
    return (
      <StudentReadinessNotice
        mode="profile"
        title={profileTitle}
        description={profileDescription}
      />
    );
  }

  if (requireApproved && readiness.needsVerification) {
    return (
      <StudentReadinessNotice
        mode="verification"
        title={approvedTitle}
        description={approvedDescription}
      />
    );
  }

  return typeof children === 'function' ? children(readiness) : children;
}
