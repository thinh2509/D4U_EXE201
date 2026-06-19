import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CommentOutlined,
  EyeOutlined,
  ReloadOutlined,
  SendOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { App, Alert, Button, Form, Input, Rate, Switch, Table, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/StateViews.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { projectApi } from "../../services/projectApi.js";
import { ratingApi } from "../../services/ratingApi.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { formatDate } from "../../utils/format.js";
import { getRatingStateMeta } from "../../utils/ratingState.js";

function getDirectionMeta(rating, userId) {
  if (rating.raterUserId === userId) {
    return {
      label: "Bạn đã gửi",
      color: "blue",
      helper: `Gửi cho ${rating.ratedDisplayName || "đối tác"}`,
    };
  }

  if (rating.ratedUserId === userId) {
    return {
      label: "Bạn đã nhận",
      color: "green",
      helper: `Từ ${rating.raterDisplayName || "đối tác"}`,
    };
  }

  return {
    label: "Liên quan",
    color: "default",
    helper: `${rating.raterDisplayName || "Người gửi"} -> ${rating.ratedDisplayName || "Người nhận"}`,
  };
}

function buildRatingSummary(rows, userId) {
  return rows.reduce(
    (summary, row) => {
      if (row.raterUserId === userId) summary.sent += 1;
      if (row.ratedUserId === userId) summary.received += 1;
      if (row.isPublic) summary.publicCount += 1;
      return summary;
    },
    { sent: 0, received: 0, publicCount: 0 },
  );
}

function RatingStatCard({ icon, label, value, helper, tone = "neutral" }) {
  const toneClass =
    tone === "primary"
      ? "border-d4u-cyan/25 bg-white shadow-soft"
      : "border-d4u-border/70 bg-d4u-soft/45";

  return (
    <div className={`rounded-[22px] border p-4 sm:p-5 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">{label}</div>
          <div className="mt-2 text-[1.9rem] font-semibold leading-none tracking-tight text-d4u-teal-deep">
            {value}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-d4u-border/70 bg-white text-d4u-cyan shadow-sm">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-d4u-text-2">{helper}</p>
    </div>
  );
}

function RatingActivityCard({ row, userId }) {
  const direction = getDirectionMeta(row, userId);

  return (
    <article className="rounded-[22px] border border-d4u-border/70 bg-white/95 p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Tag color={direction.color}>{direction.label}</Tag>
            <Tag color={row.isPublic ? "success" : "default"}>{row.isPublic ? "Công khai" : "Riêng tư"}</Tag>
          </div>
          <h3 className="text-[1.02rem] font-semibold leading-7 text-d4u-text-1">
            {row.projectTitle || `Dự án ${row.projectId?.slice(0, 8) ?? ""}`}
          </h3>
          <p className="text-sm leading-6 text-d4u-text-2">{direction.helper}</p>
        </div>

        <div className="rounded-[18px] border border-d4u-border/70 bg-d4u-soft/45 px-4 py-3 text-right">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Điểm</div>
          <div className="mt-1 flex justify-end">
            <Rate disabled value={row.ratingValue} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-[18px] border border-d4u-border/65 bg-d4u-soft/35 px-4 py-3">
          <div className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Nhận xét</div>
          <p className="text-sm leading-6 text-d4u-text-2">{row.comment || "Chưa có bình luận chi tiết."}</p>
        </div>
        <div className="rounded-[18px] border border-d4u-border/65 bg-d4u-soft/35 px-4 py-3">
          <div className="mb-1 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Thời gian</div>
          <p className="text-sm font-semibold text-d4u-text-1">{formatDate(row.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

function RelatedRatingList({ rows, userId }) {
  if (!rows.length) {
    return (
      <div className="rounded-[22px] border border-d4u-border/70 bg-d4u-soft/35 px-5 py-6 text-sm leading-6 text-d4u-text-2">
        Chưa có đánh giá nào liên quan đến dự án này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.id}>
          <RatingActivityCard row={row} userId={userId} />
        </div>
      ))}
    </div>
  );
}

function ratingColumns(userId) {
  return [
    {
      title: "Vai trò",
      render: (_, row) => {
        const direction = getDirectionMeta(row, userId);
        return (
          <div className="flex flex-col gap-1">
            <Tag color={direction.color}>{direction.label}</Tag>
            <span className="text-xs text-d4u-text-3">{direction.helper}</span>
          </div>
        );
      },
    },
    {
      title: "Dự án",
      dataIndex: "projectTitle",
      render: (value, row) => (
        <div className="table-title-cell">
          <strong>{value || `Dự án ${row.projectId.slice(0, 8)}`}</strong>
          <div className="table-subtext">{formatDate(row.createdAt)}</div>
        </div>
      ),
    },
    {
      title: "Điểm",
      dataIndex: "ratingValue",
      render: (value) => <Rate disabled value={value} />,
    },
    {
      title: "Nhận xét",
      dataIndex: "comment",
      render: (value) => (
        <span className="text-sm leading-6 text-d4u-text-2">{value || "Chưa có bình luận chi tiết."}</span>
      ),
    },
    {
      title: "Hiển thị",
      dataIndex: "isPublic",
      render: (value) => (value ? <Tag color="success">Công khai</Tag> : <Tag>Riêng tư</Tag>),
    },
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
      setError(getApiErrorMessage(requestError, "Không thể tải danh sách đánh giá."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const summary = useMemo(() => buildRatingSummary(rows, user?.id), [rows, user?.id]);

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <>
      <PageHeader
        eyebrow="Feedback Center"
        icon={<StarOutlined />}
        title="Đánh giá"
        description={
          role === "SME"
            ? "Theo dõi các đánh giá SME đã gửi cho Student và những phản hồi doanh nghiệp nhận lại sau mỗi dự án."
            : "Theo dõi các đánh giá Student đã gửi cho SME và những phản hồi bạn nhận lại sau mỗi lần cộng tác."
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadRows}>
            Làm mới
          </Button>
        }
      />

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-panel border border-d4u-border bg-gradient-to-br from-white via-white to-d4u-soft/70 p-5 shadow-soft sm:p-6">
          <div className="inline-flex min-h-[30px] items-center rounded-full border border-d4u-cyan/20 bg-d4u-soft px-3 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-cyan">
            Hồ sơ hợp tác
          </div>
          <h2 className="mt-4 text-[1.95rem] font-semibold leading-tight tracking-tight text-d4u-teal-deep">
            Mỗi đánh giá là một tín hiệu uy tín cho lần cộng tác tiếp theo.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-d4u-text-2">
            Lịch sử đánh giá giúp bạn nhìn lại chất lượng phối hợp, mức độ đúng hẹn và cảm nhận của đối tác sau
            khi dự án hoàn tất.
          </p>
        </div>

        <div className="rounded-panel border border-d4u-border bg-white/92 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-d4u-soft text-d4u-cyan">
              <CommentOutlined />
            </div>
            <div>
              <h3 className="text-base font-semibold text-d4u-text-1">Nhìn nhanh</h3>
              <p className="mt-1 text-sm leading-6 text-d4u-text-2">
                Dùng khu vực này khi demo để giải thích ai đã đánh giá ai và mức độ công khai của phản hồi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <RatingStatCard
          icon={<SendOutlined />}
          label="Đã gửi"
          value={summary.sent}
          helper="Số đánh giá bạn đã gửi cho đối tác sau khi dự án hoàn thành."
          tone="primary"
        />
        <RatingStatCard
          icon={<TeamOutlined />}
          label="Đã nhận"
          value={summary.received}
          helper="Phản hồi bạn đã nhận lại từ phía còn lại trong các dự án đã khép lại."
        />
        <RatingStatCard
          icon={<EyeOutlined />}
          label="Công khai"
          value={summary.publicCount}
          helper="Những đánh giá đang được bật hiển thị công khai trong hồ sơ."
        />
      </section>

      <section className="mt-6 rounded-panel border border-d4u-border bg-white/94 p-4 shadow-soft sm:p-5">
        <div className="mb-4 flex flex-col gap-2 border-b border-d4u-border/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Lịch sử đánh giá</div>
            <h2 className="mt-1 text-lg font-semibold text-d4u-text-1">Toàn bộ feedback liên quan đến tài khoản này</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-d4u-text-2">
            Bảng dưới vẫn giữ nguyên dữ liệu gốc để bạn tra cứu theo dự án, điểm số và trạng thái công khai.
          </p>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={ratingColumns(user?.id)}
          dataSource={rows}
          scroll={{ x: 980 }}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: "Chưa có đánh giá nào." }}
        />
      </section>
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
        ratingApi.listMyRatings(),
      ]);
      setProject(projectResult);
      setRatings(ratingsResult.filter((rating) => rating.projectId === projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không thể tải màn hình đánh giá."));
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
        isPublic: values.isPublic ?? true,
      });
      message.success("Đã gửi đánh giá thành công.");
      form.resetFields();
      await loadPage();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, "Không thể gửi đánh giá lúc này."));
    } finally {
      setSubmitting(false);
    }
  };

  const ratingState = useMemo(
    () =>
      getRatingStateMeta({
        projectStatus: project?.status,
        ratingDueAt: project?.ratingDueAt,
        canCurrentUserRate: project?.canCurrentUserRate,
        hasCurrentUserRated: project?.hasCurrentUserRated,
        currentUserRatedAt: project?.currentUserRatedAt,
      }),
    [project],
  );

  const ratingAlert = (() => {
    if (!project) return null;

    if (ratingState.key === "AVAILABLE") {
      return {
        type: "info",
        message: ratingState.label,
        description: ratingState.helper,
      };
    }

    if (ratingState.key === "RATED") {
      return {
        type: "success",
        message: ratingState.label,
        description: ratingState.helper,
      };
    }

    return {
      type: "warning",
      message: ratingState.label,
      description: ratingState.helper,
    };
  })();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadPage} />;

  const canRate = Boolean(project?.canCurrentUserRate);
  const deadlineText = project?.ratingDueAt ? formatDate(project.ratingDueAt) : "Theo cửa sổ đánh giá của hệ thống";

  return (
    <>
      <PageHeader
        eyebrow="Project Review"
        icon={<StarOutlined />}
        title="Đánh giá dự án"
        description={project?.title || "Gửi đánh giá sau khi dự án hoàn thành."}
        extra={
          <Button onClick={() => navigate(`/projects/${projectId}/execution`)}>
            Về workspace
          </Button>
        }
      />

      <section className="mt-6 rounded-panel border border-d4u-border bg-gradient-to-br from-white via-white to-d4u-soft/70 p-5 shadow-soft sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div>
            <div className="inline-flex min-h-[30px] items-center rounded-full border border-d4u-cyan/20 bg-d4u-soft px-3 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-cyan">
              Hoàn tất hợp tác
            </div>
            <h2 className="mt-4 text-[2rem] font-semibold leading-tight tracking-tight text-d4u-teal-deep">
              Chốt lại trải nghiệm làm việc để dự án khép lại trọn vẹn và minh bạch hơn.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-d4u-text-2">
              Điểm số và nhận xét của bạn sẽ trở thành tín hiệu uy tín cho hồ sơ đối tác, đồng thời giúp các lần hợp tác
              sau rõ kỳ vọng hơn.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[22px] border border-d4u-border/70 bg-white px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">
                <CheckCircleFilled className="text-d4u-cyan" />
                Trạng thái
              </div>
              <div className="text-lg font-semibold text-d4u-text-1">{ratingState.label}</div>
            </div>
            <div className="rounded-[22px] border border-d4u-border/70 bg-white px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">
                <ClockCircleOutlined className="text-d4u-cyan" />
                Hạn đánh giá
              </div>
              <div className="text-sm font-semibold leading-6 text-d4u-text-1">{deadlineText}</div>
            </div>
            <div className="rounded-[22px] border border-d4u-border/70 bg-white px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">
                <CommentOutlined className="text-d4u-cyan" />
                Đánh giá liên quan
              </div>
              <div className="text-lg font-semibold text-d4u-text-1">{ratings.length}</div>
            </div>
          </div>
        </div>
      </section>

      {ratingAlert ? (
        <Alert
          type={ratingAlert.type}
          showIcon
          className="form-alert mt-5"
          message={ratingAlert.message}
          description={ratingAlert.description}
        />
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,520px)_1fr]">
        <section className="rounded-panel border border-d4u-border bg-white/94 p-5 shadow-soft sm:p-6">
          <div className="mb-5 border-b border-d4u-border/80 pb-4">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Biểu mẫu phản hồi</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-d4u-text-1">Gửi đánh giá</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              Viết ngắn gọn, cụ thể và đúng trải nghiệm thực tế để đối tác đọc là hiểu ngay điểm mạnh hoặc điểm cần cải
              thiện.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ ratingValue: 5, isPublic: true }}
            onFinish={submitRating}
            disabled={!canRate}
          >
            <Form.Item
              name="ratingValue"
              label={<span className="text-sm font-semibold text-d4u-text-1">Điểm đánh giá</span>}
              rules={[{ required: true, message: "Vui lòng chọn điểm đánh giá." }]}
            >
              <Rate className="text-[30px]" character={<StarFilled />} />
            </Form.Item>

            <Form.Item name="comment" label={<span className="text-sm font-semibold text-d4u-text-1">Bình luận</span>}>
              <Input.TextArea
                rows={5}
                maxLength={500}
                showCount
                placeholder="Ví dụ: phối hợp đúng deadline, phản hồi nhanh, chất lượng bàn giao tốt hoặc còn điểm nào nên cải thiện."
              />
            </Form.Item>

            <div className="mb-5 rounded-[20px] border border-d4u-border/70 bg-d4u-soft/45 p-4">
              <Form.Item
                name="isPublic"
                label={<span className="text-sm font-semibold text-d4u-text-1">Hiển thị công khai</span>}
                valuePropName="checked"
                className="!mb-2"
              >
                <Switch />
              </Form.Item>
              <p className="text-sm leading-6 text-d4u-text-2">
                Khi bật công khai, đánh giá có thể xuất hiện trong hồ sơ để tăng độ tin cậy cho lần hợp tác tiếp theo.
              </p>
            </div>

            <Button type="primary" htmlType="submit" loading={submitting} disabled={!canRate} className="min-h-[46px] px-5">
              Gửi đánh giá
            </Button>
          </Form>
        </section>

        <section className="rounded-panel border border-d4u-border bg-white/94 p-5 shadow-soft sm:p-6">
          <div className="mb-5 border-b border-d4u-border/80 pb-4">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Ngữ cảnh đánh giá</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-d4u-text-1">Đánh giá liên quan</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              Xem lại những phản hồi đã phát sinh trong cùng dự án để so sánh nhanh trước khi chốt nhận xét của bạn.
            </p>
          </div>

          <RelatedRatingList rows={ratings} userId={user?.id} />
        </section>
      </div>
    </>
  );
}
