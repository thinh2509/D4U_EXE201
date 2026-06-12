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
          <Card className="wallet-card" title="Portfolio công khai nổi bật">
            {featuredPortfolio.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {featuredPortfolio.map((item) => (
                  <Card
                    key={item.id}
                    size="small"
                    cover={item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="h-48 object-cover" /> : null}
                  >
                    <div className="table-title-cell">
                      <strong>{item.title}</strong>
                      <div className="table-subtext">{item.designCategoryName || 'Chưa gắn danh mục'}</div>
                    </div>
                    <div className="expanded-copy mt-3">
                      <p>{item.description}</p>
                    </div>
                    <Space wrap className="mt-3">
                      {item.skillsUsed.map((skill) => (
                        <Tag key={skill.id}>{skill.skillName}</Tag>
                      ))}
                    </Space>
                    <Space wrap className="mt-3">
                      {item.projectUrl ? <a href={item.projectUrl} target="_blank" rel="noreferrer"><LinkOutlined /> Project</a> : null}
                      {item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer"><LinkOutlined /> File</a> : null}
                    </Space>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có portfolio nổi bật." />
            )}
          </Card>
          <Card className="wallet-card" title="Toàn bộ portfolio công khai">
            {profile.publicPortfolio.length ? (
              <div className="grid gap-3">
                {profile.publicPortfolio.map((item) => (
                  <div key={item.id} className="rounded-card border border-d4u-border/70 bg-white/90 p-4">
                    <Space wrap className="mb-2">
                      <strong>{item.title}</strong>
                      <StatusBadge status={item.status} />
                      {item.isFeatured ? <Tag color="gold">Nổi bật</Tag> : null}
                    </Space>
                    <div className="table-subtext">{item.designCategoryName || 'Chưa gắn danh mục'} • Hoàn thành: {formatDate(item.completedAt)}</div>
                    <div className="expanded-copy mt-2">
                      <p>{item.description}</p>
                    </div>
                    <Space wrap className="mt-3">
                      {item.skillsUsed.map((skill) => (
                        <Tag key={skill.id} icon={<BookOutlined />}>{skill.skillName}</Tag>
                      ))}
                    </Space>
                    <Space wrap className="mt-3">
                      {item.projectUrl ? <a href={item.projectUrl} target="_blank" rel="noreferrer"><LinkOutlined /> Project URL</a> : null}
                      {item.fileUrl ? <a href={item.fileUrl} target="_blank" rel="noreferrer"><LinkOutlined /> File URL</a> : null}
                    </Space>
                  </div>
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
