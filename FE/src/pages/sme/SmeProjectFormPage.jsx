import { BulbOutlined, InfoCircleOutlined, ProjectOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Divider, Form, Input, InputNumber, List, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { aiApi } from '../../services/aiApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
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

function CreateProjectHeader({ deadlineOnly, mode }) {
  const title = deadlineOnly ? 'Điều chỉnh deadline dự án' : mode === 'edit' ? 'Cập nhật dự án' : 'Tạo dự án mới';
  const subtitle = deadlineOnly
    ? 'Chỉnh các mốc Sketch, Final và review trước khi dự án đi vào giai đoạn bị khóa deadline.'
    : 'Nhập thông tin cơ bản, dùng AI để gợi ý brief tiếng Việt, sau đó review trước khi lưu nháp hoặc publish.';
  const steps = deadlineOnly
    ? ['Bước 1 · Kiểm tra timeline hiện tại', 'Bước 2 · Cập nhật deadline', 'Bước 3 · Lưu & thông báo']
    : ['Bước 1 · Thông tin dự án', 'Bước 2 · AI gợi ý brief', 'Bước 3 · Review & lưu'];

  return (
    <section className="project-hero-card create-project-hero">
      <div className="project-hero-main">
        <div className="project-hero-copy">
          <span className="project-hero-eyebrow">{deadlineOnly ? 'Project timeline' : 'Create project'}</span>
          <div className="project-hero-heading-row">
            <h1>{title}</h1>
          </div>
          <p className="project-hero-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="project-step-strip">
        {steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
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

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      value: category.id,
      label: category.description ? `${category.name} - ${category.description}` : category.name
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

  return (
    <>
      <CreateProjectHeader deadlineOnly={deadlineOnly} mode={mode} />

      <div className={`project-form-layout ${deadlineOnly ? 'deadline-only' : ''}`}>
        <Card className="form-panel create-project-form-card" title={<span className="panel-title-with-icon"><ProjectOutlined /> Thông tin dự án</span>}>
          <div className="form-section-intro">
            <strong>{deadlineOnly ? 'Mốc thời gian thực hiện' : 'Form chính để tạo dự án'}</strong>
            <span>{deadlineOnly
              ? 'Student đang chờ xác nhận offer sẽ nhận thông báo khi deadline thay đổi.'
              : 'Điền thông tin cốt lõi trước, sau đó dùng AI để gợi ý brief tiếng Việt rồi review lại trước khi lưu nháp hoặc publish.'}</span>
          </div>
          {deadlineOnly ? (
            <Alert
              className="page-alert"
              type="warning"
              showIcon
              message={deadlineLocked
                ? 'Deadline của dự án này đã bị khóa.'
                : 'Nội dung, loại dự án và ngân sách đã được khóa. Deadline sẽ bị khóa ngay khi Student chấp nhận offer.'}
            />
          ) : null}

          <Form className="project-editor-form" form={form} layout="vertical" onFinish={saveProject} requiredMark={false}>
            {!deadlineOnly ? (
              <section className="project-form-section">
                <div className="project-form-section-head">
                  <div>
                    <h3>Thông tin cơ bản</h3>
                    <p>Giúp Student hiểu nhanh loại dự án, phạm vi và mức ngân sách bạn dự kiến.</p>
                  </div>
                </div>
                <div className="form-two-cols">
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
                          root: 'w-[min(520px,calc(100vw-2rem))] max-w-[min(520px,calc(100vw-2rem))]'
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
              <section className="project-form-section">
                <div className="project-form-section-head">
                  <div>
                    <h3>Brief & mục tiêu</h3>
                    <p>Nêu bối cảnh, đầu ra và mục đích sử dụng để Student hiểu đúng hướng thiết kế.</p>
                  </div>
                </div>
                <Form.Item name="brief" label="Mô tả yêu cầu / Brief dự án" rules={[{ required: true }, { min: 20, message: 'Brief tối thiểu 20 ký tự.' }]}>
                  <Input.TextArea rows={8} disabled={deadlineOnly} placeholder="Mô tả bối cảnh thương hiệu, thông điệp chính, deliverables và tiêu chí nghiệm thu." />
                </Form.Item>
                <Form.Item name="usagePurpose" label="Mục đích sử dụng">
                  <Input.TextArea rows={4} disabled={deadlineOnly} placeholder="Ví dụ: dùng cho social media, menu in ấn, landing page, poster sự kiện..." />
                </Form.Item>
              </section>
            ) : null}

            <section className="project-form-section">
              <div className="project-form-section-head">
                <div>
                  <h3>{deadlineOnly ? 'Timeline & review' : 'Ngân sách & deadline'}</h3>
                  <p>{deadlineOnly
                    ? 'Điều chỉnh các mốc thời gian còn mở trước khi dự án chuyển sang giai đoạn bị khóa deadline.'
                    : 'Thiết lập mức ngân sách và các mốc Sketch, Final, review để workflow vận hành rõ ràng.'}</p>
                </div>
              </div>
              {!deadlineOnly ? (
                <Form.Item name="budgetAmount" label="Ngân sách" rules={[{ required: true }]}>
                  <InputNumber className="full-width" size="large" min={1} addonAfter="VND" disabled={deadlineOnly} />
                </Form.Item>
              ) : null}
              <div className="form-two-cols">
                <Form.Item
                  name="sketchDeadlineAt"
                  label={'H?n n?p Sketch'}
                  extra={'M?c Student g?i phi?n b?n Sketch ??u ti?n.'}
                  rules={[{ validator: buildDeadlineValidator('sketchDeadlineAt', getDeadlineValues) }]}
                  validateTrigger={['onChange', 'onBlur']}
                >
                  <Input size="large" type="datetime-local" disabled={deadlineLocked} />
                </Form.Item>
                <Form.Item
                  name="finalDeadlineAt"
                  label={'H?n n?p Final'}
                  extra={'M?c n?p phi?n b?n Final sau khi x? l? feedback.'}
                  dependencies={['sketchDeadlineAt']}
                  rules={[{ validator: buildDeadlineValidator('finalDeadlineAt', getDeadlineValues) }]}
                  validateTrigger={['onChange', 'onBlur']}
                >
                  <Input size="large" type="datetime-local" disabled={deadlineLocked} />
                </Form.Item>
              </div>
              <Form.Item
                name="totalDeadlineAt"
                label={'H?n ho?n t?t review d? ?n'}
                extra={'??y l? th?i ?i?m SME c?n ho?n t?t review Final, kh?ng ph?i m?t l??t n?p b?i ri?ng.'}
                dependencies={['finalDeadlineAt']}
                rules={[{ validator: buildDeadlineValidator('totalDeadlineAt', getDeadlineValues) }]}
                validateTrigger={['onChange', 'onBlur']}
              >
                <Input size="large" type="datetime-local" disabled={deadlineLocked} />
              </Form.Item>
            </section>

            <div className="project-form-footer">
              <Space wrap>
                <Button type="primary" size="large" htmlType="submit" loading={saving} disabled={deadlineLocked}>
                  {deadlineOnly ? 'Lưu deadline' : mode === 'edit' ? 'Cập nhật dự án' : 'Lưu nháp'}
                </Button>
                <Button size="large" onClick={() => navigate('/sme/projects')}>Hủy</Button>
              </Space>
            </div>
          </Form>
        </Card>

        {!deadlineOnly ? (
          <Card className="ai-panel create-project-ai-card" title={<span className="panel-title-with-icon"><RobotOutlined /> Trợ lý AI viết brief</span>}>
            <div className="form-section-intro compact">
              <strong>AI hỗ trợ lên brief bằng tiếng Việt</strong>
              <span>Nhập ý tưởng thô, ngành hàng và mốc mong muốn. AI sẽ tạo một bản nháp để bạn chỉnh sửa trước khi lưu.</span>
            </div>
            <Alert
              className="page-alert ai-panel-alert"
              type="info"
              showIcon
              message="AI chỉ gợi ý nội dung. SME vẫn quyết định brief, ngân sách, deadline và trạng thái publish cuối cùng."
            />

            <Form className="project-ai-form" form={aiForm} layout="vertical" onFinish={generateAiSuggestion} requiredMark={false}>
              <section className="project-form-section compact">
                <div className="project-form-section-head compact">
                  <div>
                    <h3>Ý tưởng đầu vào</h3>
                    <p>Nêu bối cảnh và đầu ra mong muốn để AI dựng brief sát nhu cầu thực tế hơn.</p>
                  </div>
                </div>
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
              </section>

              <section className="project-form-section compact">
                <div className="project-form-section-head compact">
                  <div>
                    <h3>Ngân sách & hạn mong muốn</h3>
                    <p>AI dùng thông tin này để gợi ý brief phù hợp phạm vi và deadline bạn mong đợi.</p>
                  </div>
                </div>
                <div className="form-two-cols">
                  <Form.Item name="budgetAmount" label="Ngân sách tham khảo">
                    <InputNumber className="full-width" min={1} addonAfter="VND" />
                  </Form.Item>
                  <Form.Item name="totalDeadline" label="Hạn hoàn tất mong muốn">
                    <Input type="datetime-local" />
                  </Form.Item>
                </div>
              </section>

              <div className="ai-panel-actions">
                <Button type="primary" size="large" htmlType="submit" loading={aiLoading} icon={<BulbOutlined />}>
                  Gợi ý bằng AI
                </Button>
              </div>
              <div className="ai-assistant-hint">
                <InfoCircleOutlined />
                <span>AI sẽ tạo bản nháp brief, bạn vẫn có thể chỉnh sửa trước khi lưu.</span>
              </div>
            </Form>

            {aiSuggestion ? (
              <div className="ai-suggestion-preview">
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
                  <Button className="ai-apply-button" type="primary" onClick={applyAiSuggestionToForm}>
                    Áp dụng vào form
                  </Button>
                </Space>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </>
  );
}
