import { BulbOutlined, CalendarOutlined, InfoCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, App, Button, Divider, Form, Input, InputNumber, List, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { minimumSketchLeadTimeDays } from '../../constants/offerTiming.js';
import { aiApi } from '../../services/aiApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
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

  return `${suggestion.suggestedBrief}\n\nSản phẩm bàn giao:\n${deliverables}`;
}

function formatDeadlineSummary(value) {
  if (!value) return 'Chưa chọn';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Ngày giờ chưa hợp lệ';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed).replace(',', ' ·');
}

function CreateProjectHeader({ deadlineOnly, mode }) {
  const title = deadlineOnly ? 'Điều chỉnh deadline dự án' : mode === 'edit' ? 'Cập nhật dự án' : 'Tạo dự án mới';
  const subtitle = deadlineOnly
    ? 'Điều chỉnh các mốc Sketch, Final và review để timeline vẫn đủ an toàn trước khi offer được gửi hoặc khóa.'
    : 'Thiết lập brief, danh mục, ngân sách và timeline rõ ràng để Student đọc hiểu nhanh ngay từ đầu.';
  const steps = deadlineOnly
    ? ['Kiểm tra timeline', 'Cập nhật deadline', 'Lưu thay đổi']
    : ['Thông tin dự án', 'AI gợi ý brief', 'Review & lưu'];

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
    { label: 'Hạn Sketch', value: formatDeadlineSummary(values.sketchDeadlineAt) },
    { label: 'Hạn Final', value: formatDeadlineSummary(values.finalDeadlineAt) },
    { label: 'Hạn hoàn tất review', value: formatDeadlineSummary(values.totalDeadlineAt) }
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
            Kiểm tra nhanh 3 mốc chính trước khi lưu thay đổi.
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
          message="Deadline của dự án này đã bị khóa vì đã có offer hoặc project đã vượt qua giai đoạn cho phép chỉnh sửa."
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
          <h2 className="text-base font-semibold text-d4u-text-1">Quy tắc deadline</h2>
          <p className="text-sm leading-6 text-d4u-text-2">
            Các mốc cần đủ xa để offer và thanh toán vẫn còn cửa sổ xử lý an toàn.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm leading-6 text-d4u-text-2">
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Hạn Sketch phải sau thời điểm hiện tại ít nhất <strong>{minimumSketchLeadTimeDays} ngày</strong>.
        </li>
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Hạn Final phải sau hạn Sketch.
        </li>
        <li className="rounded-2xl border border-d4u-border/80 bg-d4u-soft/55 px-4 py-3">
          Hạn hoàn tất review phải sau hạn Final.
        </li>
      </ul>
    </section>
  );
}

export function SmeProjectFormPage({ mode }) {
  const { message } = App.useApp();
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
        message.error(getApiErrorMessage(requestError, 'Không thể tải danh mục thiết kế.'));
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
      message.success('Đã tạo gợi ý AI. Vui lòng xem lại trước khi áp dụng vào form.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gọi AI assistant.'));
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
      message.warning('AI chưa tự khớp được danh mục thiết kế. Vui lòng chọn danh mục trước khi lưu.');
      return;
    }

    message.success('Đã áp dụng gợi ý AI vào form. SME cần review trước khi lưu hoặc publish.');
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
      message.success(deadlineOnly ? 'Đã cập nhật deadline dự án.' : mode === 'edit' ? 'Đã cập nhật dự án.' : 'Đã tạo draft dự án.');
      navigate(`/sme/projects/${saved.id}`);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu dự án.'));
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
            <h2 className="text-lg font-semibold text-d4u-text-1">Thông tin cơ bản</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              Giúp Student hiểu nhanh loại dự án, phạm vi và mức ngân sách bạn dự kiến.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item
              name="designCategoryId"
              label="Danh mục thiết kế"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục thiết kế.' }]}
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
                placeholder="Chọn danh mục phù hợp"
                notFoundContent={loadingCategories ? 'Đang tải...' : 'Chưa có danh mục khả dụng'}
              />
            </Form.Item>
            <Form.Item name="projectType" label="Loại dự án" rules={[{ required: true, message: 'Vui lòng chọn loại dự án.' }]}>
              <Select
                size="large"
                disabled={deadlineOnly}
                options={[
                  { value: 'OPEN', label: 'Công khai - nhận ứng tuyển' },
                  { value: 'PRIVATE', label: 'Riêng tư - mời sinh viên' }
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="title" label="Tiêu đề dự án" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề.' }]}>
            <Input size="large" disabled={deadlineOnly} placeholder="Ví dụ: Thiết kế bộ nhận diện cho quán cà phê take-away" />
          </Form.Item>
        </section>
      ) : null}

      {!deadlineOnly ? (
        <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-d4u-text-1">Brief & mục tiêu</h2>
            <p className="mt-1 text-sm leading-6 text-d4u-text-2">
              Nêu bối cảnh, đầu ra và mục đích sử dụng để Student hiểu đúng hướng thiết kế.
            </p>
          </div>

          <Form.Item
            name="brief"
            label="Mô tả yêu cầu / Brief dự án"
            rules={[
              { required: true, message: 'Vui lòng nhập brief dự án.' },
              { min: 20, message: 'Brief tối thiểu 20 ký tự.' }
            ]}
          >
            <Input.TextArea rows={8} disabled={deadlineOnly} placeholder="Mô tả bối cảnh thương hiệu, thông điệp chính, deliverables và tiêu chí nghiệm thu." />
          </Form.Item>
          <Form.Item name="usagePurpose" label="Mục đích sử dụng">
            <Input.TextArea rows={4} disabled={deadlineOnly} placeholder="Ví dụ: dùng cho social media, menu in ấn, landing page, poster sự kiện..." />
          </Form.Item>
        </section>
      ) : null}

      <section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
        <div className="mb-5 flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-d4u-text-1">
            {deadlineOnly ? 'Cập nhật deadline & review' : 'Ngân sách & deadline'}
          </h2>
          <p className="text-sm leading-6 text-d4u-text-2">
            {deadlineOnly
              ? 'Điều chỉnh 3 mốc chính bằng validator realtime để timeline luôn hợp lệ trước khi lưu.'
              : 'Thiết lập ngân sách và các mốc Sketch, Final, review để workflow vận hành rõ ràng.'}
          </p>
        </div>

        {deadlineOnly ? (
          <Alert
            className="mb-5"
            type={deadlineLocked ? 'error' : 'warning'}
            showIcon
            message={deadlineLocked
              ? 'Deadline của dự án này đã bị khóa.'
              : 'Nội dung, loại dự án và ngân sách đã được khóa. Bạn chỉ còn chỉnh 3 mốc thời gian trước khi offer được chấp nhận.'}
          />
        ) : null}

        {!deadlineOnly ? (
          <Form.Item name="budgetAmount" label="Ngân sách" rules={[{ required: true, message: 'Vui lòng nhập ngân sách.' }]}>
            <InputNumber className="full-width" size="large" min={1} addonAfter="VND" disabled={deadlineOnly} />
          </Form.Item>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Form.Item
            name="sketchDeadlineAt"
            label="Hạn nộp Sketch"
            extra="Mốc Student gửi phiên bản Sketch đầu tiên. Cần cách thời điểm hiện tại ít nhất 2 ngày."
            rules={[{ validator: buildDeadlineValidator('sketchDeadlineAt', getDeadlineValues) }]}
          >
            <Input size="large" type="datetime-local" disabled={deadlineLocked} />
          </Form.Item>
          <Form.Item
            name="finalDeadlineAt"
            label="Hạn nộp Final"
            extra="Mốc nộp phiên bản Final sau khi đã xử lý feedback."
            dependencies={['sketchDeadlineAt']}
            rules={[{ validator: buildDeadlineValidator('finalDeadlineAt', getDeadlineValues) }]}
          >
            <Input size="large" type="datetime-local" disabled={deadlineLocked} />
          </Form.Item>
        </div>

        <Form.Item
          name="totalDeadlineAt"
          label="Hạn hoàn tất review dự án"
          extra="Đây là thời điểm SME cần hoàn tất review Final, không phải một lượt nộp bài riêng."
          dependencies={['finalDeadlineAt']}
          rules={[{ validator: buildDeadlineValidator('totalDeadlineAt', getDeadlineValues) }]}
        >
          <Input size="large" type="datetime-local" disabled={deadlineLocked} />
        </Form.Item>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button size="large" onClick={() => navigate('/sme/projects')}>Hủy</Button>
          <Button type="primary" size="large" htmlType="submit" loading={saving} disabled={deadlineLocked}>
            {deadlineOnly ? 'Lưu deadline' : mode === 'edit' ? 'Cập nhật dự án' : 'Lưu nháp'}
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
            <span>Trợ lý AI viết brief</span>
          </div>
          <div className="mb-4 rounded-2xl border border-d4u-border bg-d4u-soft/60 p-4">
            <strong className="block text-sm font-semibold text-d4u-text-1">AI hỗ trợ lên brief bằng tiếng Việt</strong>
            <span className="mt-1 block text-sm leading-6 text-d4u-text-2">
              Nhập ý tưởng thô, ngành hàng và mốc mong muốn. AI sẽ tạo một bản nháp để bạn chỉnh sửa trước khi lưu.
            </span>
          </div>
          <Alert
            className="mb-5"
            type="info"
            showIcon
            message="AI chỉ gợi ý nội dung. SME vẫn quyết định brief, ngân sách, deadline và trạng thái publish cuối cùng."
          />

          <Form form={aiForm} layout="vertical" onFinish={generateAiSuggestion} requiredMark={false}>
            <Form.Item
              name="rawIdea"
              label="Ý tưởng thô"
              rules={[
                { required: true, message: 'Vui lòng nhập ý tưởng.' },
                { min: 20, message: 'Tối thiểu 20 ký tự.' }
              ]}
            >
              <Input.TextArea rows={6} maxLength={3000} showCount placeholder="Ví dụ: Tôi cần bộ nhận diện cho quán cà phê take-away dành cho sinh viên, phong cách trẻ trung và dễ nhớ." />
            </Form.Item>
            <Form.Item name="businessField" label="Ngành / lĩnh vực">
              <Input placeholder="Ví dụ: F&B, giáo dục, mỹ phẩm, thời trang..." />
            </Form.Item>
            <Form.Item name="targetAudience" label="Khách hàng mục tiêu">
              <Input placeholder="Ví dụ: sinh viên 18-24 tuổi, nhân viên văn phòng, phụ huynh..." />
            </Form.Item>
            <Form.Item name="preferredStyle" label="Phong cách mong muốn">
              <Input placeholder="Ví dụ: tối giản, trẻ trung, cao cấp, vui tươi..." />
            </Form.Item>

            <div className="grid gap-4 md:grid-cols-2">
              <Form.Item name="budgetAmount" label="Ngân sách tham khảo">
                <InputNumber className="full-width" min={1} addonAfter="VND" />
              </Form.Item>
              <Form.Item name="totalDeadline" label="Hạn hoàn tất mong muốn">
                <Input type="datetime-local" />
              </Form.Item>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="primary" size="large" htmlType="submit" loading={aiLoading} icon={<BulbOutlined />}>
                Gợi ý bằng AI
              </Button>
              <div className="inline-flex items-start gap-2 rounded-2xl border border-d4u-border bg-d4u-soft/55 px-4 py-3 text-sm leading-6 text-d4u-text-2">
                <InfoCircleOutlined className="mt-1 text-d4u-teal-deep" />
                <span>AI sẽ tạo bản nháp brief, bạn vẫn có thể chỉnh sửa trước khi lưu.</span>
              </div>
            </div>
          </Form>

          {aiSuggestion ? (
            <div className="mt-6">
              <Divider />
              <Space direction="vertical" size={12} className="full-width">
                <Space wrap>
                  <Tag color={aiSuggestion.provider === 'OpenAI' ? 'cyan' : 'gold'}>
                    {aiSuggestion.provider === 'OpenAI' ? 'OpenAI' : 'Fallback tiếng Việt'}
                  </Tag>
                  <Tag>{aiSuggestion.suggestedCategoryHint}</Tag>
                </Space>
                <Title level={5}>{aiSuggestion.suggestedTitle}</Title>
                <Paragraph className="preserve-lines">{aiSuggestion.suggestedBrief}</Paragraph>
                <div>
                  <Text strong>Sản phẩm bàn giao</Text>
                  <List
                    size="small"
                    dataSource={aiSuggestion.suggestedDeliverables}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
                <div>
                  <Text strong>Mục đích sử dụng</Text>
                  <Paragraph>{aiSuggestion.suggestedUsagePurpose}</Paragraph>
                </div>
                {aiSuggestion.deadlineNotes?.length ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="Lưu ý deadline"
                    description={aiSuggestion.deadlineNotes.join(' ')}
                  />
                ) : null}
                {aiSuggestion.warnings?.length ? (
                  <Alert
                    type="info"
                    showIcon
                    message="Thông tin cần SME kiểm tra"
                    description={aiSuggestion.warnings.join(' ')}
                  />
                ) : null}
                <Button type="primary" onClick={applyAiSuggestionToForm}>
                  Áp dụng vào form
                </Button>
              </Space>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
