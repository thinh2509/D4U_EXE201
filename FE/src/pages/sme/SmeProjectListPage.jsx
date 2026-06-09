import { FolderOpenOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceToolbar } from '../../components/MarketplaceToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { PageShell } from '../../components/PageShell.jsx';
import { ProjectCard } from '../../components/ProjectCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews.jsx';
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
    <PageShell size="wide">
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dá»± Ã¡n cá»§a tÃ´i"
        description="Quáº£n lÃ½ draft, publish vÃ  theo dÃµi cÃ¡c dá»± Ã¡n Ä‘Ã£ táº¡o trong MVP."
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sme/projects/new')}>Táº¡o dá»± Ã¡n</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState description="ChÆ°a cÃ³ dá»± Ã¡n nÃ o. HÃ£y táº¡o draft Ä‘áº§u tiÃªn." />
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
            placeholder="TÃ¬m theo tiÃªu Ä‘á», brief, tráº¡ng thÃ¡i..."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                actionLabel="Quáº£n lÃ½"
                onOpen={() => navigate(`/sme/projects/${project.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
