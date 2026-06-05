import { ReloadOutlined, StarOutlined } from '@ant-design/icons';
import { App, Alert, Button, Card, Form, Input, Rate, Switch, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { projectApi } from '../../services/projectApi.js';
import { ratingApi } from '../../services/ratingApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

function getRatingDirection(rating, userId) {
  if (rating.raterUserId === userId) return <Tag color="blue">Bạn đã đánh giá</Tag>;
  if (rating.ratedUserId === userId) return <Tag color="green">Bạn nhận được</Tag>;
  return <Tag>Liên quan</Tag>;
}

function ratingColumns(userId) {
  return [
    { title: 'Loại', render: (_, row) => getRatingDirection(row, userId) },
    { title: 'Dự án', dataIndex: 'projectId', render: (value) => <span className="monospace-id">{value.slice(0, 8)}</span> },
    { title: 'Điểm', dataIndex: 'ratingValue', render: (value) => <Rate disabled value={value} /> },
    { title: 'Bình luận', dataIndex: 'comment', render: (value) => value || 'Không có' },
    { title: 'Hiển thị', dataIndex: 'isPublic', render: (value) => value ? <Tag color="success">Public</Tag> : <Tag>Private</Tag> },
    { title: 'Thời gian', dataIndex: 'createdAt', render: formatDate }
  ];
}

export function MyRatingsPage({ role }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await ratingApi.listMyRatings());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải đánh giá.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        icon={<StarOutlined />}
        title="Đánh giá"
        description={role === 'SME' ? 'Theo dõi đánh giá bạn đã gửi cho Student và đánh giá SME nhận được.' : 'Theo dõi đánh giá bạn đã gửi cho SME và đánh giá Student nhận được.'}
        extra={<Button icon={<ReloadOutlined />} onClick={loadRows}>Làm mới</Button>}
      />
      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={ratingColumns(user?.id)}
          dataSource={rows}
          scroll={{ x: 980 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'Chưa có đánh giá nào.' }}
        />
      </Card>
    </>
  );
}

export function ProjectRatingPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [project, setProject] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectResult, ratingsResult] = await Promise.all([
        projectApi.getProject(projectId),
        ratingApi.listMyRatings()
      ]);
      setProject(projectResult);
      setRatings(ratingsResult.filter((rating) => rating.projectId === projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải màn đánh giá.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [projectId]);

  const submitRating = async (values) => {
    setSubmitting(true);
    try {
      await ratingApi.submitProjectRating(projectId, {
        ratingValue: values.ratingValue,
        comment: values.comment,
        isPublic: values.isPublic ?? true
      });
      message.success('Đã gửi đánh giá.');
      form.resetFields();
      await loadPage();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi đánh giá.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadPage} />;

  const alreadyRated = ratings.some((rating) => rating.raterUserId === user?.id);
  const canRate = project?.status === 'COMPLETED' && !alreadyRated;

  return (
    <>
      <PageHeader
        icon={<StarOutlined />}
        title="Đánh giá dự án"
        description={project?.title || 'Gửi đánh giá sau khi dự án hoàn thành.'}
        extra={<Button onClick={() => navigate(`/projects/${projectId}/execution`)}>Về workspace</Button>}
      />

      {project?.status !== 'COMPLETED' ? (
        <Alert type="warning" showIcon className="form-alert" message="Chỉ có thể đánh giá sau khi dự án hoàn thành." />
      ) : null}
      {alreadyRated ? (
        <Alert type="success" showIcon className="form-alert" message="Bạn đã đánh giá dự án này." />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
        <Card title="Gửi đánh giá">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ ratingValue: 5, isPublic: true }}
            onFinish={submitRating}
            disabled={!canRate}
          >
            <Form.Item name="ratingValue" label="Điểm đánh giá" rules={[{ required: true, message: 'Chọn điểm đánh giá.' }]}>
              <Rate />
            </Form.Item>
            <Form.Item name="comment" label="Bình luận">
              <Input.TextArea rows={4} maxLength={500} showCount />
            </Form.Item>
            <Form.Item name="isPublic" label="Hiển thị công khai" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} disabled={!canRate}>
              Gửi đánh giá
            </Button>
          </Form>
        </Card>

        <Card title="Đánh giá liên quan">
          <Table
            rowKey="id"
            columns={ratingColumns(user?.id)}
            dataSource={ratings}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'Chưa có đánh giá cho dự án này.' }}
          />
        </Card>
      </div>
    </>
  );
}
