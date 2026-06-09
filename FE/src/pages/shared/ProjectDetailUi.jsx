import { InfoCircleOutlined } from '@ant-design/icons';
import { StatusBadge } from '../../components/StatusBadge.jsx';

const BUTTON_VARIANTS = {
  primary: 'border border-transparent bg-d4u-cyan text-white shadow-sm hover:bg-d4u-cyan-hover',
  secondary: 'border border-d4u-border bg-white text-d4u-text-1 hover:border-d4u-teal-muted hover:bg-d4u-soft/70',
  soft: 'border border-transparent bg-d4u-soft text-d4u-teal-deep hover:bg-d4u-soft-2',
  neutral: 'border border-amber-200 bg-white text-amber-700 hover:bg-amber-50',
  danger: 'border border-red-200 bg-white text-d4u-error hover:bg-red-50'
};

const BRIEF_SECTION_DEFINITIONS = [
  { key: 'context', title: 'Bối cảnh', patterns: [/^bối cảnh\s*:?\s*/i, /^bối cảnh thương hiệu\s*:?\s*/i] },
  { key: 'objective', title: 'Mục tiêu', patterns: [/^mục tiêu\s*:?\s*/i, /^mục đích\s*:?\s*/i] },
  { key: 'audience', title: 'Khách hàng mục tiêu', patterns: [/^khách hàng mục tiêu\s*:?\s*/i, /^đối tượng mục tiêu\s*:?\s*/i, /^target audience\s*:?\s*/i] },
  { key: 'style', title: 'Phong cách', patterns: [/^phong cách\s*:?\s*/i, /^style\s*:?\s*/i] },
  { key: 'content', title: 'Yêu cầu nội dung/hình ảnh', patterns: [/^yêu cầu nội dung\/hình ảnh\s*:?\s*/i, /^yêu cầu nội dung\s*:?\s*/i, /^yêu cầu hình ảnh\s*:?\s*/i, /^yêu cầu\s*:?\s*/i] },
  { key: 'acceptance', title: 'Tiêu chí nghiệm thu', patterns: [/^tiêu chí nghiệm thu\s*:?\s*/i, /^criteria\s*:?\s*/i] },
  { key: 'deliverables', title: 'Sản phẩm bàn giao', patterns: [/^sản phẩm bàn giao\s*:?\s*/i, /^deliverables\s*:?\s*/i] }
];

function normalizeBriefText(value) {
  return (value || '').replace(/\r\n/g, '\n').trim();
}

function getMatchedBriefSection(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  for (const section of BRIEF_SECTION_DEFINITIONS) {
    for (const pattern of section.patterns) {
      if (pattern.test(trimmedLine)) {
        return { ...section, pattern };
      }
    }
  }

  return null;
}

function parseStructuredBrief(value) {
  const text = normalizeBriefText(value);
  if (!text) return { sections: [], paragraphs: [] };

  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const matchedSection = getMatchedBriefSection(line);

    if (matchedSection) {
      const cleanedLine = line.trim().replace(matchedSection.pattern, '').trim();
      currentSection = {
        key: matchedSection.key,
        title: matchedSection.title,
        content: cleanedLine ? [cleanedLine] : []
      };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.content.push(line);
    }
  }

  const cleanedSections = sections
    .map((section) => ({
      ...section,
      content: section.content.join('\n').trim()
    }))
    .filter((section) => section.content);

  const matchedLineCount = cleanedSections.reduce((count, section) => count + section.content.split('\n').filter(Boolean).length, 0);
  const paragraphFallback = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const hasEnoughStructure = cleanedSections.length >= 2 || (cleanedSections.length === 1 && matchedLineCount >= 3);

  return {
    sections: hasEnoughStructure ? cleanedSections : [],
    paragraphs: hasEnoughStructure ? [] : paragraphFallback
  };
}

function splitBulletItems(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim())
    .filter(Boolean);
}

function isBulletLikeContent(value) {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return false;

  return lines.every((line) => /^[-•]\s+/.test(line) || /^\d+[\.)]\s+/.test(line));
}

function StructuredBriefBlock({ section }) {
  const shouldRenderAsList = section.key === 'deliverables' || isBulletLikeContent(section.content);
  const items = shouldRenderAsList ? splitBulletItems(section.content) : [];

  return (
    <article className="rounded-card border border-d4u-border bg-d4u-soft/35 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-d4u-text-3">{section.title}</p>
      {shouldRenderAsList ? (
        <ul className="mt-3 space-y-2 text-sm leading-7 text-d4u-text-1">
          {items.map((item) => (
            <li className="flex items-start gap-3" key={`${section.key}-${item}`}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-d4u-cyan" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 space-y-3 text-sm leading-7 text-d4u-text-1">
          {section.content.split(/\n+/).map((paragraph) => (
            <p key={`${section.key}-${paragraph}`}>{paragraph}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function FallbackBriefContent({ paragraphs }) {
  const listParagraphIndex = paragraphs.findIndex((paragraph) => isBulletLikeContent(paragraph));

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => {
        if (index === listParagraphIndex) {
          return (
            <ul className="space-y-2 text-sm leading-7 text-d4u-text-1" key={`fallback-list-${index}`}>
              {splitBulletItems(paragraph).map((item) => (
                <li className="flex items-start gap-3" key={`fallback-item-${item}`}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-d4u-cyan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p className="text-sm leading-7 text-d4u-text-1" key={`fallback-paragraph-${index}`}>
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function ActionButton({
  children,
  className = '',
  disabled = false,
  icon,
  loading = false,
  onClick,
  title,
  type = 'button',
  variant = 'secondary'
}) {
  return (
    <button
      className={[
        'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn px-4 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className
      ].join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      type={type}
    >
      {loading ? <LoadingSpinner /> : icon ? <span className="text-base">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export function ProjectMetadataStrip({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <div
          className="rounded-card border border-d4u-border bg-d4u-soft/55 p-4"
          key={item.label}
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-d4u-teal-deep shadow-sm">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-d4u-text-3">
                {item.label}
              </p>
              <div className={`mt-1 text-sm font-semibold leading-6 break-words ${item.muted ? 'text-d4u-text-2' : 'text-d4u-text-1'}`}>
                {item.value || 'Chưa có'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailHeader({
  eyebrow = 'PROJECT DETAIL',
  metadataItems,
  status,
  title
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="bg-gradient-to-br from-d4u-soft via-white to-d4u-soft-2 p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-d4u-text-2">
              {eyebrow}
            </span>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-3">
                  <h1 className="max-w-4xl min-w-0 text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-d4u-teal-deep sm:text-4xl">
                    {title}
                  </h1>
                  <div className="pt-1">
                    <StatusBadge status={status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metadataItems.map((item) => (
              <div
                className={`min-w-0 rounded-card border px-4 py-4 ${item.muted ? 'border-slate-200 bg-slate-50/80' : 'border-d4u-border bg-white/85 shadow-sm'}`}
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-d4u-text-3">
                  {item.label}
                </p>
                <div className={`mt-2 text-sm font-semibold leading-6 break-words ${item.muted ? 'text-d4u-text-2' : 'text-d4u-text-1'}`}>
                  {item.value || 'Chưa có'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectBriefSection({ description, title, usagePurpose }) {
  const briefContent = normalizeBriefText(usagePurpose);
  const parsedBrief = parseStructuredBrief(briefContent);

  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="border-b border-d4u-border bg-gradient-to-r from-white via-d4u-soft/35 to-white px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">BRIEF DỰ ÁN</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-d4u-text-1 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-d4u-text-2">{description}</p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-card border border-d4u-border bg-white p-5 shadow-sm">
          {!briefContent ? (
            <span className="text-sm leading-7 text-d4u-text-3">Chưa có</span>
          ) : parsedBrief.sections.length ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {parsedBrief.sections.map((section) => (
                <div className={section.key === 'deliverables' ? 'xl:col-span-2' : ''} key={section.key}>
                  <StructuredBriefBlock section={section} />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-[78ch]">
              <FallbackBriefContent paragraphs={parsedBrief.paragraphs} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProjectExecutionInfoGrid({ description, items, title }) {
  return (
    <section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
      <div className="border-b border-d4u-border bg-gradient-to-r from-white via-d4u-soft/25 to-white px-5 py-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">THÔNG TIN THỰC HIỆN</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-d4u-text-1 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-d4u-text-2">{description}</p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              className={`rounded-card border border-d4u-border bg-white p-4 shadow-sm ${item.fullWidth ? 'md:col-span-2' : ''}`}
              key={item.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-d4u-text-3">
                {item.label}
              </p>
              <div className="mt-2 text-sm font-semibold leading-6 text-d4u-text-1">
                {item.value || <span className="text-d4u-text-3">Chưa có</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectFlowHintCard() {
  return (
    <section className="rounded-panel border border-sky-200 bg-sky-50/80 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <InfoCircleOutlined className="mt-0.5 h-4 w-4 shrink-0 text-d4u-info" />
        <div>
          <h3 className="text-sm font-semibold text-d4u-teal-deep">Điều kiện chuyển sang execution</h3>
          <p className="mt-1 text-sm leading-6 text-d4u-text-2">
            Project chỉ vào execution sau khi offer được chấp nhận và PayOS xác nhận escrow thành công.
          </p>
        </div>
      </div>
    </section>
  );
}
