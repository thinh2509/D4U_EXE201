import { BulbOutlined, CalendarOutlined, InfoCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, App, Button, Divider, Form, Input, InputNumber, List, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { minimumSketchLeadTimeDays } from '../../constants/offerTiming.js';
import { aiApi } from '../../services/aiApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage, getPlanLimitErrorMessage, isPlanLimitError } from '../../utils/apiError.js';
import { buildLocalizedDesignCategoryLabel } from '../../utils/designCategoryLocalization.js';
import { normalizeDateInput, toDateTimeLocalValue } from '../../utils/format.js';
import { getProjectDeadlineErrors } from '../../utils/projectDeadlineValidation.js';

const { Paragraph, Text, Title } = Typography;

function toPayload(values) {
  return {
    designCategoryId: values.designCategoryId,
    title: values.title,
    brief: values.brief,
    usagePurpose: values.usagePurpose || null,
    projectType: values.projectType,
    budgetAmount: Number(values.budgetAmount),
    currency: 'VND',
    totalDeadlineAt: normalizeDateInput(values.totalDeadlineAt),
    sketchDeadlineAt: normalizeDateInput(values.sketchDeadlineAt),
    finalDeadlineAt: normalizeDateInput(values.finalDeadlineAt),
    isConfidential: false,
    allowStudentPortfolio: true
  };
}

function fromProject(project) {
  return {
    ...project,
    totalDeadlineAt: toDateTimeLocalValue(project.totalDeadlineAt),
    sketchDeadlineAt: toDateTimeLocalValue(project.sketchDeadlineAt),
    finalDeadlineAt: toDateTimeLocalValue(project.finalDeadlineAt)
  };
}

function normalizeSearch(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findCategoryIdFromSuggestion(categories, categoryHint) {
  const normalizedHint = normalizeSearch(categoryHint);
  if (!normalizedHint) return undefined;

  return categories.find((category) => {
    const normalizedName = normalizeSearch(category.name);
    return normalizedName === normalizedHint ||
      normalizedName.includes(normalizedHint) ||
      normalizedHint.includes(normalizedName);
  })?.id;
}

function buildBriefWithDeliverables(suggestion) {
  const deliverables = suggestion.suggestedDeliverables
    .map((item) => `- ${item}`)
    .join('\n');

  return `${suggestion.suggestedBrief}\n\nSáº£n pháº©m bÃ n giao:\n${deliverables}`;
}

function formatDeadlineSummary(value) {
  if (!value) return 'ChÆ°a chá»n';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'NgÃ y giá» chÆ°a há»£p lá»‡';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed).replace(',', ' Â·');
}

function CreateProjectHeader({ deadlineOnly, mode }) {
  const title = deadlineOnly ? 'Äiá»u chá»‰nh deadline dá»± Ã¡n' : mode === 'edit' ? 'Cáº­p nháº­t dá»± Ã¡n' : 'Táº¡o dá»± Ã¡n má»›i';
  const subtitle = deadlineOnly
    ? 'Äiá»u chá»‰nh cÃ¡c má»‘c Sketch, Final vÃ  review Ä‘á»ƒ timeline váº«n Ä‘á»§ an toÃ n trÆ°á»›c khi offer Ä‘Æ°á»£c gá»­i hoáº·c khÃ³a.'
    : 'Thiáº¿t láº­p brief, danh má»¥c, ngÃ¢n sÃ¡ch vÃ  timeline rÃµ rÃ ng Ä‘á»ƒ Student Ä‘á»c hiá»ƒu nhanh ngay tá»« Ä‘áº§u.';
  const steps = deadlineOnly
    ? ['Kiá»ƒm tra timeline', 'Cáº­p nháº­t deadline', 'LÆ°u thay Ä‘á»•i']
    : ['ThÃ´ng tin dá»± Ã¡n', 'AI gá»£i Ã½ brief', 'Review & lÆ°u'];

  return (
    <section className="rounded-panel border border-d4u-border bg-gradient-to-br from-white via-d4u-soft/55 to-d4u-soft-2/80 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex rounded-chip bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-d4u-teal-deep/80">
            {deadlineOnly ? 'Deadline adjustment' : 'Create project'}
          </span>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold leading-tight text-d4u-teal-deep sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-d4u-text-2 sm:text-[15px]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[360px]">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-d4u-border/70 bg-white/75 px-3 py-3 shadow-sm"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-d4u-soft text-sm font-semibold text-d4u-teal-deep">
                {index + 1}
              </span>
              <span className="text-sm font-medium leading-5 text-d4u-text-1">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildDeadlineValidator(fieldName, getValues) {
  return async () => {
    const errors = getProjectDeadlineErrors(getValues(), { requireAll: false });
    if (errors[fieldName]) {
      throw new Error(errors[fieldName]);
    }
  };
}

function DeadlineSummaryCard({ values, deadlineLocked }) {
  const summaryItems = [
    { label: 'Háº¡n Sketch', value: formatDeadlineSummary(values.sketchDeadlineAt) },
    { label: 'Háº¡n Final', value: formatDeadlineSummary(values.finalDeadlineAt) },
    { label: 'Háº¡n hoÃ n táº¥t review', value: formatDeadlineSummary(values.totalDeadlineAt) }
  ];

  return (
    <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-d4u-soft text-d4u-teal-deep">
          <CalendarOutlined />
        </span>
        <div>
          <h2 className="text-base font-semibold text-d4u-text-1">Timeline summary</h2>
          <p className="text-sm leading-6 text-d4u-text-2">
            Kiá»ƒm tra nhanh 3 má»‘c chÃ­nh trÆ°á»›c khi lÆ°u thay Ä‘á»•i.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-d4u-text-3">{item.label}</div>
            <div className="mt-1 text-sm font-semibold leading-6 text-d4u-text-1">{item.value}</div>
          </div>
        ))}
      </div>

      {deadlineLocked ? (
        <Alert
          className="mt-4"
          type="error"
          showIcon
          message="Deadline cá»§a dá»± Ã¡n nÃ y Ä‘Ã£ bá»‹ khÃ³a vÃ¬ Ä‘Ã£ cÃ³ offer hoáº·c project Ä‘Ã£ vÆ°á»£t qua giai Ä‘oáº¡n cho phÃ©p chá»‰nh sá»­a."
        />
      ) : null}
    </section>
  );
}

function DeadlineRuleNote() {
  return (
    <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-d4u-soft text-d4u-teal-deep">
          <InfoCircleOutlined />
        </span>
        <div>
          <h2 className="text-base font-semibold text-d4u-text-1">Quy táº¯c deadline</h2>
          <p className="text-sm leading-6 text-d4u-text-2">
            CÃ¡c má»‘c cáº§n Ä‘á»§ xa Ä‘á»ƒ offer vÃ  thanh toÃ¡n váº«n cÃ²n cá»­a sá»• xá»­ lÃ½ an toÃ n.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm leading-6 text-d4u-text-2">
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Háº¡n Sketch pháº£i sau thá»i Ä‘iá»ƒm hiá»‡n táº¡i Ã­t nháº¥t <strong>{minimumSketchLeadTimeDays} ngÃ y</strong>.
        </li>
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Háº¡n Final pháº£i sau háº¡n Sketch.
        </li>
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Háº¡n hoÃ n táº¥t review pháº£i sau háº¡n Final.
        </li>
      </ul>
    </section>
  );
}

export function SmeProjectFormPage({ mode }) {
  const { message, modal } = App.useApp();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [error, setError] = useState(null);
  const [loadedProject, setLoadedProject] = useState(null);

  const watchedSketchDeadline = Form.useWatch('sketchDeadlineAt', form);
  const watchedFinalDeadline = Form.useWatch('finalDeadlineAt', form);
  const watchedTotalDeadline = Form.useWatch('totalDeadlineAt', form);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      value: category.id,
      label: buildLocalizedDesignCategoryLabel(category)
    })),
    [categories]
  );

  const renderCategoryOption = (option) => (
    <div className="whitespace-normal break-words px-3 py-2.5 text-sm leading-5 text-d4u-text-1">
      {option.data.label}
    </div>
  );

  const getDeadlineValues = () => ({
    sketchDeadlineAt: form.getFieldValue('sketchDeadlineAt'),
    finalDeadlineAt: form.getFieldValue('finalDeadlineAt'),
    totalDeadlineAt: form.getFieldValue('totalDeadlineAt')
  });

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await projectApi.listDesignCategories();
        setCategories(response);
      } catch (requestError) {
        message.error(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ táº£i danh má»¥c thiáº¿t káº¿.'));
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [message]);

  useEffect(() => {
    if (mode !== 'edit') return;
    const loadProject = async () => {
      setLoading(true);
      try {
        const project = await projectApi.getProject(projectId);
        setLoadedProject(project);
        form.setFieldsValue(fromProject(project));
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [form, mode, projectId]);

  const generateAiSuggestion = async (values) => {
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const suggestion = await aiApi.suggestProjectBrief({
        rawIdea: values.rawIdea,
        businessField: values.businessField || null,
        targetAudience: values.targetAudience || null,
        preferredStyle: values.preferredStyle || null,
        budgetAmount: values.budgetAmount ? Number(values.budgetAmount) : null,
        totalDeadline: values.totalDeadline ? normalizeDateInput(values.totalDeadline) : null
      });
      setAiSuggestion(suggestion);
      message.success('ÄÃ£ táº¡o gá»£i Ã½ AI. Vui lÃ²ng xem láº¡i trÆ°á»›c khi Ã¡p dá»¥ng vÃ o form.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'KhÃ´ng thá»ƒ gá»i AI assistant.'));
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestionToForm = () => {
    if (!aiSuggestion) return;

    const matchedCategoryId = findCategoryIdFromSuggestion(categories, aiSuggestion.suggestedCategoryHint);
    form.setFieldsValue({
      designCategoryId: matchedCategoryId,
      title: aiSuggestion.suggestedTitle,
      brief: buildBriefWithDeliverables(aiSuggestion),
      usagePurpose: aiSuggestion.suggestedUsagePurpose,
      sketchDeadlineAt: toDateTimeLocalValue(aiSuggestion.suggestedSketchDeadline),
      finalDeadlineAt: toDateTimeLocalValue(aiSuggestion.suggestedFinalDeadline)
    });

    if (!matchedCategoryId) {
      message.warning('AI chÆ°a tá»± khá»›p Ä‘Æ°á»£c danh má»¥c thiáº¿t káº¿. Vui lÃ²ng chá»n danh má»¥c trÆ°á»›c khi lÆ°u.');
      return;
    }

    message.success('ÄÃ£ Ã¡p dá»¥ng gá»£i Ã½ AI vÃ o form. SME cáº§n review trÆ°á»›c khi lÆ°u hoáº·c publish.');
  };

  const saveProject = async (values) => {
    setSaving(true);
    try {
      const deadlineOnly = mode === 'edit' && loadedProject?.status !== 'DRAFT';
      const payload = deadlineOnly
        ? {
            sketchDeadlineAt: normalizeDateInput(values.sketchDeadlineAt),
            finalDeadlineAt: normalizeDateInput(values.finalDeadlineAt),
            totalDeadlineAt: normalizeDateInput(values.totalDeadlineAt)
          }
        : toPayload(values);
      const saved = mode === 'edit'
        ? deadlineOnly
          ? await projectApi.updateDeadlines(projectId, payload)
          : await projectApi.updateDraft(projectId, payload)
        : await projectApi.createDraft(payload);
      message.success(deadlineOnly ? 'ÄÃ£ cáº­p nháº­t deadline dá»± Ã¡n.' : mode === 'edit' ? 'ÄÃ£ cáº­p nháº­t dá»± Ã¡n.' : 'ÄÃ£ táº¡o draft dá»± Ã¡n.');
      navigate(`/sme/projects/${saved.id}`);
    } catch (requestError) {
      if (isPlanLimitError(requestError)) {
        modal.error({
          centered: true,
          title: '\u0056\u01b0\u1ee3t gi\u1edbi h\u1ea1n g\u00f3i hi\u1ec7n t\u1ea1i',
          content: getPlanLimitErrorMessage(requestError),
          okText: '\u0110\u00e3 hi\u1ec3u',
        });
      } else {
        message.error(getApiErrorMessage(requestError, 'Kh\u00f4ng th\u1ec3 l\u01b0u d\u1ef1 \u00e1n.'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} />;
  const deadlineOnly = mode === 'edit' && loadedProject?.status !== 'DRAFT';
  const deadlineLocked = deadlineOnly &&
    !['OPEN', 'PRIVATE_INVITED', 'OFFER_SELECTED'].includes(loadedProject?.status);

  const deadlineForm = (
    <Form
      form={form}
      layout="vertical"
      onFinish={saveProject}
      requiredMark={false}
      validateTrigger={['onChange', 'onBlur']}
      className="space-y-6"
    >
      {!deadlineOnly ? (
        <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-d4u-text-1">ThÃ´ng tin cÆ¡ báº£n</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              GiÃºp Student hiá»ƒu nhanh loáº¡i dá»± Ã¡n, pháº¡m vi vÃ  má»©c ngÃ¢n sÃ¡ch báº¡n dá»± kiáº¿n.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item
              name="designCategoryId"
              label="Danh má»¥c thiáº¿t káº¿"
              rules={[{ required: true, message: 'Vui lÃ²ng chá»n danh má»¥c thiáº¿t káº¿.' }]}
            >
              <Select
                size="large"
                disabled={deadlineOnly}
                loading={loadingCategories}
                options={categoryOptions}
                optionRender={renderCategoryOption}
                popupMatchSelectWidth={false}
                virtual={false}
                listHeight={320}
                classNames={{
                  popup: {
                    root: 'w-[min(520px,calc(100vw-2rem))] max-w-[min(520px,calc(100vw-2rem))] rounded-card border border-d4u-border bg-white shadow-soft'
                  }
                }}
                placeholder="Chá»n danh má»¥c phÃ¹ há»£p"
                notFoundContent={loadingCategories ? 'Äang táº£i...' : 'ChÆ°a cÃ³ danh má»¥c kháº£ dá»¥ng'}
              />
            </Form.Item>
            <Form.Item name="projectType" label="Loáº¡i dá»± Ã¡n" rules={[{ required: true, message: 'Vui lÃ²ng chá»n loáº¡i dá»± Ã¡n.' }]}>
              <Select
                size="large"
                disabled={deadlineOnly}
                options={[
                  { value: 'OPEN', label: 'CÃ´ng khai - nháº­n á»©ng tuyá»ƒn' },
                  { value: 'PRIVATE', label: 'RiÃªng tÆ° - má»i sinh viÃªn' }
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="title" label="TiÃªu Ä‘á» dá»± Ã¡n" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p tiÃªu Ä‘á».' }]}>
            <Input size="large" disabled={deadlineOnly} placeholder="VÃ­ dá»¥: Thiáº¿t káº¿ bá»™ nháº­n diá»‡n cho quÃ¡n cÃ  phÃª take-away" />
          </Form.Item>
        </section>
      ) : null}

      {!deadlineOnly ? (
        <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-d4u-text-1">Brief & má»¥c tiÃªu</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              NÃªu bá»‘i cáº£nh, Ä‘áº§u ra vÃ  má»¥c Ä‘Ã­ch sá»­ dá»¥ng Ä‘á»ƒ Student hiá»ƒu Ä‘Ãºng hÆ°á»›ng thiáº¿t káº¿.
            </p>
          </div>

          <Form.Item
            name="brief"
            label="MÃ´ táº£ yÃªu cáº§u / Brief dá»± Ã¡n"
            rules={[
              { required: true, message: 'Vui lÃ²ng nháº­p brief dá»± Ã¡n.' },
              { min: 20, message: 'Brief tá»‘i thiá»ƒu 20 kÃ½ tá»±.' }
            ]}
          >
            <Input.TextArea rows={8} disabled={deadlineOnly} placeholder="MÃ´ táº£ bá»‘i cáº£nh thÆ°Æ¡ng hiá»‡u, thÃ´ng Ä‘iá»‡p chÃ­nh, deliverables vÃ  tiÃªu chÃ­ nghiá»‡m thu." />
          </Form.Item>
          <Form.Item name="usagePurpose" label="Má»¥c Ä‘Ã­ch sá»­ dá»¥ng">
            <Input.TextArea rows={4} disabled={deadlineOnly} placeholder="VÃ­ dá»¥: dÃ¹ng cho social media, menu in áº¥n, landing page, poster sá»± kiá»‡n..." />
          </Form.Item>
        </section>
      ) : null}

      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-d4u-text-1">
            {deadlineOnly ? 'Cáº­p nháº­t deadline & review' : 'NgÃ¢n sÃ¡ch & deadline'}
          </h2>
          <p className="text-sm leading-6 text-d4u-text-2">
            {deadlineOnly
              ? 'Äiá»u chá»‰nh 3 má»‘c chÃ­nh báº±ng validator realtime Ä‘á»ƒ timeline luÃ´n há»£p lá»‡ trÆ°á»›c khi lÆ°u.'
              : 'Thiáº¿t láº­p ngÃ¢n sÃ¡ch vÃ  cÃ¡c má»‘c Sketch, Final, review Ä‘á»ƒ workflow váº­n hÃ nh rÃµ rÃ ng.'}
          </p>
        </div>

        {deadlineOnly ? (
          <Alert
            className="mb-5"
            type={deadlineLocked ? 'error' : 'warning'}
            showIcon
            message={deadlineLocked
              ? 'Deadline cá»§a dá»± Ã¡n nÃ y Ä‘Ã£ bá»‹ khÃ³a.'
              : 'Ná»™i dung, loáº¡i dá»± Ã¡n vÃ  ngÃ¢n sÃ¡ch Ä‘Ã£ Ä‘Æ°á»£c khÃ³a. Báº¡n chá»‰ cÃ²n chá»‰nh 3 má»‘c thá»i gian trÆ°á»›c khi offer Ä‘Æ°á»£c cháº¥p nháº­n.'}
          />
        ) : null}

        {!deadlineOnly ? (
          <Form.Item name="budgetAmount" label="NgÃ¢n sÃ¡ch" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p ngÃ¢n sÃ¡ch.' }]}>
            <InputNumber className="full-width" size="large" min={1} addonAfter="VND" disabled={deadlineOnly} />
          </Form.Item>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Form.Item
            name="sketchDeadlineAt"
            label="Háº¡n ná»™p Sketch"
            extra="Má»‘c Student gá»­i phiÃªn báº£n Sketch Ä‘áº§u tiÃªn. Cáº§n cÃ¡ch thá»i Ä‘iá»ƒm hiá»‡n táº¡i Ã­t nháº¥t 2 ngÃ y."
            rules={[{ validator: buildDeadlineValidator('sketchDeadlineAt', getDeadlineValues) }]}
          >
            <Input size="large" type="datetime-local" disabled={deadlineLocked} />
          </Form.Item>
          <Form.Item
            name="finalDeadlineAt"
            label="Háº¡n ná»™p Final"
            extra="Má»‘c ná»™p phiÃªn báº£n Final sau khi Ä‘Ã£ xá»­ lÃ½ feedback."
            dependencies={['sketchDeadlineAt']}
            rules={[{ validator: buildDeadlineValidator('finalDeadlineAt', getDeadlineValues) }]}
          >
            <Input size="large" type="datetime-local" disabled={deadlineLocked} />
          </Form.Item>
        </div>

        <Form.Item
          name="totalDeadlineAt"
          label="Háº¡n hoÃ n táº¥t review dá»± Ã¡n"
          extra="ÄÃ¢y lÃ  thá»i Ä‘iá»ƒm SME cáº§n hoÃ n táº¥t review Final, khÃ´ng pháº£i má»™t lÆ°á»£t ná»™p bÃ i riÃªng."
          dependencies={['finalDeadlineAt']}
          rules={[{ validator: buildDeadlineValidator('totalDeadlineAt', getDeadlineValues) }]}
        >
          <Input size="large" type="datetime-local" disabled={deadlineLocked} />
        </Form.Item>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button size="large" onClick={() => navigate('/sme/projects')}>Há»§y</Button>
          <Button type="primary" size="large" htmlType="submit" loading={saving} disabled={deadlineLocked}>
            {deadlineOnly ? 'LÆ°u deadline' : mode === 'edit' ? 'Cáº­p nháº­t dá»± Ã¡n' : 'LÆ°u nhÃ¡p'}
          </Button>
        </div>
      </section>
    </Form>
  );

  if (deadlineOnly) {
    return (
      <div className="space-y-6">
        <CreateProjectHeader deadlineOnly mode={mode} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">{deadlineForm}</div>
          <aside className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <DeadlineSummaryCard
              deadlineLocked={deadlineLocked}
              values={{
                sketchDeadlineAt: watchedSketchDeadline,
                finalDeadlineAt: watchedFinalDeadline,
                totalDeadlineAt: watchedTotalDeadline
              }}
            />
            <DeadlineRuleNote />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreateProjectHeader deadlineOnly={false} mode={mode} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">{deadlineForm}</div>

        <section className="rounded-panel border border-d4u-border bg-d4u-surface p-6 shadow-soft">
          <div className="inline-flex items-center gap-2 text-base font-semibold text-d4u-text-1">
            <RobotOutlined />
            <span>Trá»£ lÃ½ AI viáº¿t brief</span>
          </div>
          <div className="mb-4 rounded-2xl border border-d4u-border bg-d4u-soft/60 p-4">
            <strong className="block text-sm font-semibold text-d4u-text-1">AI há»— trá»£ lÃªn brief báº±ng tiáº¿ng Viá»‡t</strong>
            <span className="mt-1 block text-sm leading-6 text-d4u-text-2">
              Nháº­p Ã½ tÆ°á»Ÿng thÃ´, ngÃ nh hÃ ng vÃ  má»‘c mong muá»‘n. AI sáº½ táº¡o má»™t báº£n nhÃ¡p Ä‘á»ƒ báº¡n chá»‰nh sá»­a trÆ°á»›c khi lÆ°u.
            </span>
          </div>
          <Alert
            className="mb-5"
            type="info"
            showIcon
            message="AI chá»‰ gá»£i Ã½ ná»™i dung. SME váº«n quyáº¿t Ä‘á»‹nh brief, ngÃ¢n sÃ¡ch, deadline vÃ  tráº¡ng thÃ¡i publish cuá»‘i cÃ¹ng."
          />

          <Form form={aiForm} layout="vertical" onFinish={generateAiSuggestion} requiredMark={false}>
            <Form.Item
              name="rawIdea"
              label="Ã tÆ°á»Ÿng thÃ´"
              rules={[
                { required: true, message: 'Vui lÃ²ng nháº­p Ã½ tÆ°á»Ÿng.' },
                { min: 20, message: 'Tá»‘i thiá»ƒu 20 kÃ½ tá»±.' }
              ]}
            >
              <Input.TextArea rows={6} maxLength={3000} showCount placeholder="VÃ­ dá»¥: TÃ´i cáº§n bá»™ nháº­n diá»‡n cho quÃ¡n cÃ  phÃª take-away dÃ nh cho sinh viÃªn, phong cÃ¡ch tráº» trung vÃ  dá»… nhá»›." />
            </Form.Item>
            <Form.Item name="businessField" label="NgÃ nh / lÄ©nh vá»±c">
              <Input placeholder="VÃ­ dá»¥: F&B, giÃ¡o dá»¥c, má»¹ pháº©m, thá»i trang..." />
            </Form.Item>
            <Form.Item name="targetAudience" label="KhÃ¡ch hÃ ng má»¥c tiÃªu">
              <Input placeholder="VÃ­ dá»¥: sinh viÃªn 18-24 tuá»•i, nhÃ¢n viÃªn vÄƒn phÃ²ng, phá»¥ huynh..." />
            </Form.Item>
            <Form.Item name="preferredStyle" label="Phong cÃ¡ch mong muá»‘n">
              <Input placeholder="VÃ­ dá»¥: tá»‘i giáº£n, tráº» trung, cao cáº¥p, vui tÆ°Æ¡i..." />
            </Form.Item>

            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item name="budgetAmount" label="NgÃ¢n sÃ¡ch tham kháº£o">
                <InputNumber className="full-width" min={1} addonAfter="VND" />
              </Form.Item>
              <Form.Item name="totalDeadline" label="Háº¡n hoÃ n táº¥t mong muá»‘n">
                <Input type="datetime-local" />
              </Form.Item>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="primary" size="large" htmlType="submit" loading={aiLoading} icon={<BulbOutlined />}>
                Gá»£i Ã½ báº±ng AI
              </Button>
              <div className="inline-flex items-start gap-2 rounded-2xl border border-d4u-border bg-d4u-soft/55 px-4 py-3 text-sm leading-6 text-d4u-text-2">
                <InfoCircleOutlined className="mt-1 text-d4u-teal-deep" />
                <span>AI sáº½ táº¡o báº£n nhÃ¡p brief, báº¡n váº«n cÃ³ thá»ƒ chá»‰nh sá»­a trÆ°á»›c khi lÆ°u.</span>
              </div>
            </div>
          </Form>

          {aiSuggestion ? (
            <div className="mt-6">
              <Divider />
              <Space direction="vertical" size={12} className="full-width">
                <Space wrap>
                  <Tag color={aiSuggestion.provider === 'OpenAI' ? 'cyan' : 'gold'}>
                    {aiSuggestion.provider === 'OpenAI' ? 'OpenAI' : 'Fallback tiáº¿ng Viá»‡t'}
                  </Tag>
                  <Tag>{aiSuggestion.suggestedCategoryHint}</Tag>
                </Space>
                <Title level={5}>{aiSuggestion.suggestedTitle}</Title>
                <Paragraph className="preserve-lines">{aiSuggestion.suggestedBrief}</Paragraph>
                <div>
                  <Text strong>Sáº£n pháº©m bÃ n giao</Text>
                  <List
                    size="small"
                    dataSource={aiSuggestion.suggestedDeliverables}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
                <div>
                  <Text strong>Má»¥c Ä‘Ã­ch sá»­ dá»¥ng</Text>
                  <Paragraph>{aiSuggestion.suggestedUsagePurpose}</Paragraph>
                </div>
                {aiSuggestion.deadlineNotes?.length ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="LÆ°u Ã½ deadline"
                    description={aiSuggestion.deadlineNotes.join(' ')}
                  />
                ) : null}
                {aiSuggestion.warnings?.length ? (
                  <Alert
                    type="info"
                    showIcon
                    message="ThÃ´ng tin cáº§n SME kiá»ƒm tra"
                    description={aiSuggestion.warnings.join(' ')}
                  />
                ) : null}
                <Button type="primary" onClick={applyAiSuggestionToForm}>
                  Ãp dá»¥ng vÃ o form
                </Button>
              </Space>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
