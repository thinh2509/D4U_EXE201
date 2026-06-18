import {
  CalendarOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Tag } from "antd";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatCurrency, formatDate } from "../../utils/format.js";

function getTypeMeta(projectType) {
  if (projectType === "PRIVATE") {
    return {
      label: "Riêng tư",
      tone:
        "border-d4u-cyan/20 bg-d4u-soft/65 text-d4u-teal-deep",
    };
  }

  return {
    label: "Marketplace",
    tone: "border-d4u-border/80 bg-white text-d4u-text-2",
  };
}

export function SmeProjectCard({
  project,
  onOpen,
  actionLabel = "Quản lý",
  secondaryActionLabel = null,
  onSecondaryAction = null,
  secondaryActionDisabled = false,
}) {
  const typeMeta = getTypeMeta(project.projectType);

  return (
    <article
      className="group relative flex h-full min-h-[460px] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-d4u-border/80 bg-white/95 p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-d4u-cyan/35 hover:shadow-card sm:p-6"
      onClick={onOpen}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-d4u-cyan via-d4u-cyan to-d4u-teal-deep/90" />

      <div className="flex min-h-[34px] flex-wrap items-center gap-2 pt-1">
        <StatusBadge status={project.status} />
        {project.designCategoryName ? (
          <Tag className="!m-0 !rounded-full !border-d4u-cyan/20 !bg-d4u-soft/55 !px-3 !py-1 !font-semibold !text-d4u-teal-deep">
            {project.designCategoryName}
          </Tag>
        ) : null}
        <Tag className={`!m-0 !rounded-full !px-3 !py-1 !font-semibold ${typeMeta.tone}`}>
          {typeMeta.label}
        </Tag>
      </div>

      <div className="mt-4 grid flex-1 gap-4">
        <div className="grid min-h-[168px] content-start gap-3">
          <h2 className="overflow-hidden text-[22px] font-semibold leading-[1.28] tracking-tight text-d4u-text-1 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {project.title}
          </h2>

          <p className="overflow-hidden text-[15px] leading-7 text-d4u-text-2 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
            {project.brief}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-d4u-text-3">
            <span className="rounded-full border border-d4u-border/70 bg-d4u-soft/45 px-3 py-1">
              Xem brief đầy đủ trong trang quản lý
            </span>
          </div>
        </div>

        <div className="mt-auto grid gap-4 border-t border-d4u-border/70 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <span className="flex min-h-[82px] items-start gap-3 rounded-[20px] border border-d4u-border/65 bg-d4u-soft/45 px-4 py-3.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[16px] text-d4u-cyan shadow-sm">
                <WalletOutlined />
              </span>
              <span className="grid gap-1">
                <small className="text-[11px] font-black uppercase tracking-[0.08em] text-d4u-text-3">
                  Ngân sách
                </small>
                <strong className="text-[18px] font-semibold leading-tight text-d4u-text-1">
                  {formatCurrency(project.budgetAmount, project.currency)}
                </strong>
              </span>
            </span>

            <span className="flex min-h-[82px] items-start gap-3 rounded-[20px] border border-d4u-border/65 bg-d4u-soft/45 px-4 py-3.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[16px] text-d4u-cyan shadow-sm">
                <CalendarOutlined />
              </span>
              <span className="grid gap-1">
                <small className="text-[11px] font-black uppercase tracking-[0.08em] text-d4u-text-3">
                  Hạn hoàn thành
                </small>
                <strong className="text-[18px] font-semibold leading-tight text-d4u-text-1">
                  {formatDate(project.totalDeadlineAt)}
                </strong>
              </span>
            </span>
          </div>

          <div
            className={`grid gap-2 ${
              secondaryActionLabel && onSecondaryAction
                ? "sm:grid-cols-2"
                : "sm:grid-cols-1"
            }`}
          >
            <Button
              className="inline-flex min-h-[46px] items-center justify-center rounded-btn shadow-sm"
              type="primary"
              icon={<FileTextOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              {actionLabel}
            </Button>

            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                className="inline-flex min-h-[46px] items-center justify-center rounded-btn border-d4u-border/90 bg-white text-d4u-text-1 shadow-sm hover:!border-d4u-cyan/35 hover:!text-d4u-cyan"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  onSecondaryAction();
                }}
                disabled={secondaryActionDisabled}
              >
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {project.projectType === "PRIVATE" ? (
        <FileProtectOutlined className="pointer-events-none absolute bottom-6 right-6 text-[20px] text-d4u-cyan/15 transition-colors duration-200 group-hover:text-d4u-cyan/25" />
      ) : null}
    </article>
  );
}
