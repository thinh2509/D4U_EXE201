import {
  CalendarOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Tag } from "antd";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatCurrency, formatDate } from "../utils/format.js";

export function ProjectCard({ project, onOpen, actionLabel = "Xem chi tiết" }) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-panel border border-d4u-border/80 bg-white/92 p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-d4u-cyan/35 hover:shadow-card"
      onClick={onOpen}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-d4u-cyan" />

      <div className="flex min-h-[32px] flex-wrap items-center gap-2 pt-1">
        <StatusBadge status={project.status} />
        {project.hasApplied ? (
          <Tag className="!m-0 rounded-full font-semibold" color="blue">
            Đã ứng tuyển
          </Tag>
        ) : null}
        {project.designCategoryName ? (
          <Tag className="!m-0 rounded-full font-semibold" color="cyan">
            {project.designCategoryName}
          </Tag>
        ) : null}
      </div>

      <div className="mt-4 grid flex-1 gap-3">
        <div className="grid gap-2">
          <h2 className="text-[19px] font-semibold leading-snug text-d4u-text-1">
            {project.title}
          </h2>
          <p className="text-sm leading-6 text-d4u-text-2">{project.brief}</p>
        </div>

        <div className="mt-auto grid gap-3 border-t border-d4u-border/70 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <span className="flex items-start gap-3 rounded-card bg-d4u-soft/80 px-3 py-3">
              <WalletOutlined className="mt-0.5 text-d4u-cyan" />
              <span className="grid gap-1">
                <small className="text-[11px] font-bold uppercase tracking-[0.04em] text-d4u-text-3">
                  Ngân sách
                </small>
                <strong className="text-sm leading-tight text-d4u-text-1">
                  {formatCurrency(project.budgetAmount, project.currency)}
                </strong>
              </span>
            </span>
            <span className="flex items-start gap-3 rounded-card bg-d4u-soft/80 px-3 py-3">
              <CalendarOutlined className="mt-0.5 text-d4u-cyan" />
              <span className="grid gap-1">
                <small className="text-[11px] font-bold uppercase tracking-[0.04em] text-d4u-text-3">
                  Hoàn thành review
                </small>
                <strong className="text-sm leading-tight text-d4u-text-1">
                  {formatDate(project.totalDeadlineAt)}
                </strong>
              </span>
            </span>
          </div>

          <Button
            className="inline-flex min-h-[44px] items-center justify-center rounded-btn"
            type="primary"
            ghost
            icon={
              actionLabel === "Xem chi tiết" ? (
                <EyeOutlined />
              ) : (
                <FileTextOutlined />
              )
            }
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            {project.hasApplied ? "Đã ứng tuyển" : actionLabel}
          </Button>
        </div>
      </div>

      {project.projectType === "PRIVATE" ? (
        <FileProtectOutlined className="pointer-events-none absolute bottom-5 right-5 text-[22px] text-d4u-cyan/20" />
      ) : null}
    </article>
  );
}
