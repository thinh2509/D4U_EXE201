import { FileDoneOutlined, StarOutlined } from '@ant-design/icons';
import { FeatureShellPage } from './MvpShellPage.jsx';

export function ProjectExecutionPage() {
  return (
    <FeatureShellPage
      icon={<FileDoneOutlined />}
      title="Project execution"
      description="Timeline thực hiện dự án: escrow funded, Sketch, Final, review, completion và release."
      endpoint="GET /api/v1/projects/{id}/execution"
      backTo="/"
    />
  );
}

export function ProjectSubmissionsPage() {
  return (
    <FeatureShellPage
      icon={<FileDoneOutlined />}
      title="Submissions"
      description="Nộp Sketch, Final và Revision với file metadata hợp lệ."
      endpoint="GET /api/v1/projects/{id}/submissions"
      backTo="/"
    />
  );
}

export function ProjectRatingPage() {
  return (
    <FeatureShellPage
      icon={<StarOutlined />}
      title="Rating"
      description="Đánh giá 1-5 sao sau khi dự án hoàn thành, comment tối đa 500 ký tự."
      endpoint="POST /api/v1/projects/{id}/ratings"
      backTo="/"
    />
  );
}
