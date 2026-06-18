import { FolderOpenOutlined, PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MarketplaceToolbar } from "../../components/MarketplaceToolbar.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { PageShell } from "../../components/PageShell.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/StateViews.jsx";
import { projectApi } from "../../services/projectApi.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { getRatingStateMeta } from "../../utils/ratingState.js";
import { SmeProjectCard } from "./SmeProjectCard.jsx";

function getProjectRatingAction(project) {
  const ratingState = getRatingStateMeta({
    projectStatus: project.status,
    ratingDueAt: project.ratingDueAt,
    canCurrentUserRate: project.canCurrentUserRate,
    hasCurrentUserRated: project.hasCurrentUserRated,
    currentUserRatedAt: project.currentUserRatedAt,
  });

  switch (ratingState.key) {
    case "AVAILABLE":
      return "Đánh giá";
    case "RATED":
      return "Xem đánh giá";
    case "EXPIRED":
      return "Hết hạn đánh giá";
    default:
      return null;
  }
}

export function SmeProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
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

  const categories = useMemo(
    () =>
      [
        ...new Set(
          projects.map((project) => project.designCategoryName).filter(Boolean),
        ),
      ].sort(),
    [projects],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory =
        category === "ALL" || project.designCategoryName === category;
      const matchesQuery =
        !normalized ||
        [
          project.title,
          project.brief,
          project.designCategoryName,
          project.status,
        ]
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
        title="Dự án của tôi"
        description="Theo dõi các project draft, đang mở và đã chọn ứng viên trong cùng một khung quản lý gọn gàng."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/sme/projects/new")}
          >
            Tạo dự án
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState description="Chưa có dự án nào. Hãy tạo draft đầu tiên." />
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

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <SmeProjectCard
                key={project.id}
                project={project}
                actionLabel="Quản lý"
                secondaryActionLabel={getProjectRatingAction(project)}
                onOpen={() => navigate(`/sme/projects/${project.id}`)}
                onSecondaryAction={() =>
                  navigate(`/projects/${project.id}/rating`)
                }
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
