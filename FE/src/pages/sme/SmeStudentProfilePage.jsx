import {
  ArrowLeftOutlined,
  BookOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  StarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, Col, Empty, Row, Space, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { studentCapabilityApi } from '../../services/studentCapabilityApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

const skillLevelLabels = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

const portfolioDescriptionClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

function PortfolioLinkButton({ url, label, variant = 'default' }) {
  if (!url) return null;

  return (
    <Button
      type={variant === 'primary' ? 'primary' : 'default'}
      icon={<LinkOutlined />}
      href={url}
      target="_blank"
      rel="noreferrer"
      className={variant === 'primary' ? 'shadow-soft' : ''}
    >
      {label}
    </Button>
  );
}

function PortfolioVisual({ item, size = 'card' }) {
  const className =
    size === 'compact'
      ? 'h-14 w-14 rounded-2xl border border-d4u-border/60 object-cover shadow-soft'
      : 'h-48 w-full rounded-none object-cover';

  if (item.thumbnailUrl) {
    return <img src={item.thumbnailUrl} alt={item.title} className={className} />;
  }

  if (size === 'compact') {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-d4u-border/60 bg-d4u-soft/50 text-lg text-d4u-primary shadow-soft">
        <LinkOutlined />
      </div>
    );
  }

  return (
    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-d4u-soft via-white to-d4u-soft/60 text-4xl text-d4u-primary">
      <LinkOutlined />
    </div>
  );
}

function PortfolioTagList({ skillsUsed, compact = false }) {
  if (!skillsUsed?.length) {
    return <span className="text-sm text-d4u-text-3">Chưa gắn skills</span>;
  }

  return (
    <Space wrap size={[6, 6]}>
      {skillsUsed.map((skill) => (
        <Tag key={skill.id} icon={compact ? <BookOutlined /> : null}>
          {skill.skillName}
        </Tag>
      ))}
    </Space>
  );
}

function PortfolioShowcaseCard({ item }) {
  return (
    <Card
      key={item.id}
      size="small"
      className="overflow-hidden rounded-panel border border-d4u-border/70 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
      cover={<PortfolioVisual item={item} />}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="table-title-cell">
          <strong className="text-[1.02rem] font-semibold text-d4u-text-1">{item.title}</strong>
          <div className="table-subtext">
            {item.designCategoryName || 'Chưa gắn danh mục'}
            {item.completedAt ? ` • Hoàn thành ${formatDate(item.completedAt)}` : ''}
          </div>
        </div>
        <div className="expanded-copy text-d4u-text-2" style={portfolioDescriptionClampStyle}>
          <p>{item.description || 'Portfolio này đang tập trung vào link dự án để SME xem trực tiếp.'}</p>
        </div>
        <PortfolioTagList skillsUsed={item.skillsUsed} />
        <Space wrap className="mt-auto">
          <PortfolioLinkButton url={item.projectUrl} label="Xem portfolio" variant="primary" />
          {!item.projectUrl && item.fileUrl ? <PortfolioLinkButton url={item.fileUrl} label="Mở file đính kèm" /> : null}
        </Space>
      </div>
    </Card>
  );
}

function PortfolioListRow({ item }) {
  return (
    <div className="rounded-panel border border-d4u-border/70 bg-white/95 p-4 shadow-soft transition duration-200 hover:border-d4u-primary/30 hover:shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <PortfolioVisual item={item} size="compact" />
          <div className="min-w-0 flex-1">
            <Space wrap className="mb-2">
              <strong className="text-[1.02rem] font-semibold text-d4u-text-1">{item.title}</strong>
              <StatusBadge status={item.status} />
              {item.isFeatured ? <Tag color="gold">Nổi bật</Tag> : null}
            </Space>
            <div className="table-subtext">
              {item.designCategoryName || 'Chưa gắn danh mục'}
              {' • '}
              Hoàn thành: {formatDate(item.completedAt)}
            </div>
            <div className="expanded-copy mt-2 text-d4u-text-2" style={portfolioDescriptionClampStyle}>
              <p>{item.description || 'Portfolio này đang để tối giản để SME đi thẳng vào link dự án.'}</p>
            </div>
            <div className="mt-3">
              <PortfolioTagList skillsUsed={item.skillsUsed} compact />
            </div>
          </div>
        </div>
        <Space wrap className="lg:justify-end">
          <PortfolioLinkButton url={item.projectUrl} label="Xem portfolio" variant="primary" />
          {!item.projectUrl && item.fileUrl ? <PortfolioLinkButton url={item.fileUrl} label="Mở file đính kèm" /> : null}
        </Space>
      </div>
    </div>
  );
}

export function SmeStudentProfilePage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await studentCapabilityApi.getStudentProfile(studentId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải hồ sơ Student.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  const featuredSkills = useMemo(() => profile?.featuredSkills || [], [profile]);
  const featuredPortfolio = useMemo(() => profile?.featuredPortfolio || [], [profile]);

  if (loading) return <LoadingState type="skeleton" />;
  if (error) return <ErrorState description={error} onRetry={loadProfile} />;
  if (!profile) return <EmptyState description="Không tìm thấy hồ sơ Student." />;

  return (
    <>
      <PageHeader
        icon={<UserOutlined />}
        eyebrow="Student Profile"
        title={profile.fullName}
        description="Xem nhanh năng lực, kỹ năng nổi bật và portfolio công khai của Student trước khi tạo offer."
        extra={(
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        )}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="summary-card visual-card">
            <Space direction="vertical" size={16} className="w-full">
              <Avatar size={72} src={profile.avatarUrl} icon={<UserOutlined />} />
              <div className="table-title-cell">
                <strong>{profile.fullName}</strong>
                <div className="table-subtext">{profile.school} • {profile.major}</div>
              </div>
              <div className="status-row">
                <span>Xác thực</span>
                <StatusBadge status={profile.verificationStatus} />
              </div>
              <div className="metric-strip">
                <StarOutlined />
                <div>
                  <span>Rating trung bình</span>
                  <strong>{Number(profile.averageRating || 0).toFixed(2)}</strong>
                </div>
              </div>
              <div className="metric-strip">
                <CheckCircleOutlined />
                <div>
                  <span>Dự án hoàn thành</span>
                  <strong>{profile.completedProjectsCount}</strong>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card className="form-panel" title="Tóm tắt hồ sơ">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                <div className="table-subtext">Trường học</div>
                <strong>{profile.school}</strong>
              </div>
              <div className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                <div className="table-subtext">Chuyên ngành</div>
                <strong>{profile.major}</strong>
              </div>
              <div className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                <div className="table-subtext">Năm bắt đầu học</div>
                <strong>{profile.studyStartYear}</strong>
              </div>
              <div className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                <div className="table-subtext">Số skills public</div>
                <strong>{profile.publicSkills.length}</strong>
              </div>
            </div>
            <div className="expanded-copy mt-4">
              <p>{profile.bio || 'Student chưa thêm phần giới thiệu bản thân.'}</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="section-grid">
        <Col xs={24} lg={10}>
          <Card className="wallet-card" title="Kỹ năng nổi bật">
            {featuredSkills.length ? (
              <Space wrap>
                {featuredSkills.map((skill) => (
                  <Tag key={skill.id} color="gold">
                    {skill.skillName} • {skillLevelLabels[skill.level] || skill.level}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kỹ năng nổi bật." />
            )}
          </Card>
          <Card className="wallet-card" title="Toàn bộ skills">
            {profile.publicSkills.length ? (
              <div className="grid gap-3">
                {profile.publicSkills.map((skill) => (
                  <div key={skill.id} className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                    <Space wrap className="mb-2">
                      <strong>{skill.skillName}</strong>
                      <Tag color="blue">{skillLevelLabels[skill.level] || skill.level}</Tag>
                      {skill.isHighlighted ? <Tag color="gold">Nổi bật</Tag> : null}
                    </Space>
                    <div className="table-subtext">
                      {skill.yearsOfExperience != null ? `${skill.yearsOfExperience} năm kinh nghiệm` : 'Chưa khai báo số năm kinh nghiệm'}
                    </div>
                    {skill.experienceNote ? <div className="expanded-copy"><p>{skill.experienceNote}</p></div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Student chưa khai báo skills." />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            className="wallet-card"
            title="Portfolio công khai nổi bật"
            extra={<span className="text-sm text-d4u-text-3">Ưu tiên các case SME nên xem trước</span>}
          >
            {featuredPortfolio.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {featuredPortfolio.map((item) => (
                  <PortfolioShowcaseCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có portfolio nổi bật." />
            )}
          </Card>
          <Card
            className="wallet-card"
            title="Toàn bộ portfolio công khai"
            extra={<span className="text-sm text-d4u-text-3">Dạng xem chi tiết để so sánh nhanh từng item</span>}
          >
            {profile.publicPortfolio.length ? (
              <div className="grid gap-3">
                {profile.publicPortfolio.map((item) => (
                  <PortfolioListRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Student chưa có portfolio công khai." />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
