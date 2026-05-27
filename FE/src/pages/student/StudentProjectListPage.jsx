import { FolderOpenOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceToolbar } from '../../components/MarketplaceToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ProjectCard } from '../../components/ProjectCard.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function StudentProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await projectApi.listOpenProjects());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(projects.map((project) => project.designCategoryName).filter(Boolean))].sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory = category === 'ALL' || project.designCategoryName === category;
      const matchesQuery = !normalized || [project.title, project.brief, project.designCategoryName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));

      return matchesCategory && matchesQuery;
    });
  }, [category, projects, query]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProjects} />;

  return (
    <>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dự án đang mở"
        description="Tìm brief phù hợp, xem ngân sách và gửi ứng tuyển cho dự án thiết kế."
        extra={<Button onClick={loadProjects}>Làm mới</Button>}
      />

      <MarketplaceToolbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        onRefresh={loadProjects}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="empty-panel">
          <Empty description="Chưa tìm thấy dự án phù hợp." />
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/student/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </>
  );
}
