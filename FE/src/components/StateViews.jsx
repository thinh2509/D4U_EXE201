import { ApiOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Empty, Result, Skeleton, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { PageShell } from "./PageShell.jsx";

function StatePanel({ children, size = "narrow" }) {
  return (
    <PageShell size={size}>
      <div className="rounded-panel border border-d4u-border/80 bg-white/94 p-6 shadow-soft backdrop-blur sm:p-7">
        {children}
      </div>
    </PageShell>
  );
}

export function LoadingState({
  label = "Không thể tải dữ liệu...",
  type = "spinner",
}) {
  if (type === "skeleton") {
    return (
      <PageShell>
        <div className="grid gap-5">
          <div className="rounded-panel border border-d4u-border/70 bg-white/90 p-6 shadow-soft">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border border-d4u-border/70 bg-white/90 p-5 shadow-soft"
              >
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <StatePanel>
      <div className="grid min-h-[220px] place-items-center text-center">
        <div className="grid justify-items-center gap-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-d4u-soft text-d4u-cyan">
            <Spin size="large" />
          </div>
          <span className="text-sm font-medium text-d4u-text-2">{label}</span>
        </div>
      </div>
    </StatePanel>
  );
}

export function EmptyState({
  description = "Chưa có dữ liệu.",
  actionLabel,
  onAction,
}) {
  return (
    <StatePanel>
      <div className="grid min-h-[220px] place-items-center">
        <Empty description={description}>
          {actionLabel ? (
            <Button type="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Empty>
      </div>
    </StatePanel>
  );
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description,
  onRetry,
}) {
  return (
    <StatePanel>
      <Result
        status="warning"
        title={title}
        subTitle={description}
        extra={
          onRetry ? (
            <Button type="primary" onClick={onRetry}>
              Thử lại
            </Button>
          ) : null
        }
      />
    </StatePanel>
  );
}

export function BackendGapState({
  title = "API chưa sẵn sàng",
  description = "Màn hình này đã được chuẩn bị theo MVP mới, nhưng backend endpoint tương ứng chưa được triển khai.",
  backTo,
}) {
  const navigate = useNavigate();
  return (
    <StatePanel size="standard">
      <Result
        icon={<ApiOutlined className="text-d4u-cyan" />}
        title={title}
        subTitle={description}
        extra={
          backTo ? (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(backTo)}
            >
              Quay lại
            </Button>
          ) : null
        }
      />
    </StatePanel>
  );
}
