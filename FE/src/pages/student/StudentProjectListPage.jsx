import { FolderOpenOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceToolbar } from '../../components/MarketplaceToolbar.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { PageShell } from '../../components/PageShell.jsx';
import { ProjectCard } from '../../components/ProjectCard.jsx';
import { StudentReadinessNotice, useStudentReadiness } from '../../components/StudentReadinessGate.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function StudentProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const readiness = useStudentReadiness();

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

  if (loading || readiness.loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProjects} />;
  if (readiness.error) return <ErrorState description={readiness.error} onRetry={readiness.reload} />;

  const readinessNotice = readiness.needsProfile ? (
    <StudentReadinessNotice
      compact
      mode="profile"
      title="Táº¡o há»“ sÆ¡ trÆ°á»›c khi báº¯t Ä‘áº§u á»©ng tuyá»ƒn"
      description="Báº¡n váº«n cÃ³ thá»ƒ xem marketplace, nhÆ°ng D4U sáº½ chá»‰ má»Ÿ nÃºt á»©ng tuyá»ƒn sau khi há»“ sÆ¡ sinh viÃªn Ä‘Æ°á»£c táº¡o."
      secondaryActionLabel="Tiáº¿p tá»¥c xem dá»± Ã¡n"
      secondaryActionPath="/student/projects"
    />
  ) : readiness.needsVerification ? (
    <StudentReadinessNotice
      compact
      mode="verification"
      title="HoÃ n táº¥t xÃ¡c thá»±c Ä‘á»ƒ gá»­i á»©ng tuyá»ƒn"
      description="Báº¡n cÃ³ thá»ƒ xem brief vÃ  shortlist dá»± Ã¡n trÆ°á»›c. Khi xÃ¡c thá»±c xong, D4U sáº½ má»Ÿ hÃ nh Ä‘á»™ng á»©ng tuyá»ƒn vÃ  pháº£n há»“i offer."
      secondaryActionLabel="Tiáº¿p tá»¥c xem dá»± Ã¡n"
      secondaryActionPath="/student/projects"
    />
  ) : null;

  return (
    <PageShell size="wide">
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dá»± Ã¡n Ä‘ang má»Ÿ"
        description="TÃ¬m brief phÃ¹ há»£p, xem ngÃ¢n sÃ¡ch vÃ  gá»­i á»©ng tuyá»ƒn cho dá»± Ã¡n thiáº¿t káº¿."
        extra={<Button onClick={loadProjects}>LÃ m má»›i</Button>}
      />

      {readinessNotice}

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
        <EmptyState description="ChÆ°a tÃ¬m tháº¥y dá»± Ã¡n phÃ¹ há»£p." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/student/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
