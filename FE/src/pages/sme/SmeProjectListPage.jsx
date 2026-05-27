import { FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceToolbar } from '../../components/MarketplaceToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ProjectCard } from '../../components/ProjectCard.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function SmeProjectListPage() {
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
      setProjects(await projectApi.listMyProjects());
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
      const matchesQuery = !normalized || [project.title, project.brief, project.designCategoryName, project.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized));

      return matchesCategory && matchesQuery;
    });
  }, [category, projects, query]);

  if (loading) return <LoadingState type="skeleton" />;
  if (error) return <ErrorState description={error} onRetry={loadProjects} />;

  return (
    <>
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dự án của tôi"
        description="Quản lý draft, publish và theo dõi các dự án đã tạo trong MVP."
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sme/projects/new')}>Tạo dự án</Button>}
      />

      {projects.length === 0 ? (
        <div className="empty-panel">
          <Empty description="Chưa có dự án nào. Hãy tạo draft đầu tiên." />
        </div>
      ) : (
        <>
          <MarketplaceToolbar
            query={query}
            onQueryChange={setQuery}
            category={category}
            onCategoryChange={setCategory}
            categories={categories}
            onRefresh={loadProjects}
            resultCount={filtered.length}
            placeholder="Tìm theo tiêu đề, brief, trạng thái..."
          />

          <div className="project-grid">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                actionLabel="Quản lý"
                onOpen={() => navigate(`/sme/projects/${project.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
