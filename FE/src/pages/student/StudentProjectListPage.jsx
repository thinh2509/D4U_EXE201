import { FolderOpenOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MarketplaceToolbar } from "../../components/MarketplaceToolbar.jsx";
import { PageHeader } from "../../components/PageHeader.jsx";
import { PageShell } from "../../components/PageShell.jsx";
import {
  StudentReadinessNotice,
  useStudentReadiness,
} from "../../components/StudentReadinessGate.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/StateViews.jsx";
import { projectApi } from "../../services/projectApi.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { StudentOpenProjectCard } from "./StudentOpenProjectCard.jsx";

export function StudentProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
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
    return [
      ...new Set(
        projects.map((project) => project.designCategoryName).filter(Boolean),
      ),
    ].sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory =
        category === "ALL" || project.designCategoryName === category;
      const matchesQuery =
        !normalized ||
        [project.title, project.brief, project.designCategoryName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized));

      return matchesCategory && matchesQuery;
    });
  }, [category, projects, query]);

  if (loading || readiness.loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProjects} />;
  if (readiness.error) {
    return (
      <ErrorState description={readiness.error} onRetry={readiness.reload} />
    );
  }

  const readinessNotice = readiness.needsProfile ? (
    <StudentReadinessNotice
      compact
      mode="profile"
      title="Tạo hồ sơ trước khi bắt đầu ứng tuyển"
      description="Bạn vẫn có thể xem marketplace, nhưng D4U sẽ chỉ mở nút ứng tuyển sau khi hồ sơ sinh viên được tạo."
      secondaryActionLabel="Tiếp tục xem dự án"
      secondaryActionPath="/student/projects"
    />
  ) : readiness.needsVerification ? (
    <StudentReadinessNotice
      compact
      mode="verification"
      title="Hoàn tất xác thực để gửi ứng tuyển"
      description="Bạn có thể xem brief và shortlist dự án trước. Khi xác thực xong, D4U sẽ mở hành động ứng tuyển và phản hồi offer."
      secondaryActionLabel="Tiếp tục xem dự án"
      secondaryActionPath="/student/projects"
    />
  ) : null;

  return (
    <PageShell size="wide">
      <PageHeader
        icon={<FolderOpenOutlined />}
        title="Dự án đang mở"
        description="Tìm brief phù hợp, theo dõi ngân sách và shortlist các dự án bạn muốn ứng tuyển trong một giao diện gọn gàng hơn."
        extra={<Button onClick={loadProjects}>Làm mới</Button>}
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
        <EmptyState description="Chưa tìm thấy dự án phù hợp." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <StudentOpenProjectCard
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
