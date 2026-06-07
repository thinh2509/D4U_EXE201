import { BulbOutlined, ProjectOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Divider, Form, Input, InputNumber, List, Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { aiApi } from '../../services/aiApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { normalizeDateInput, toDateTimeLocalValue } from '../../utils/format.js';

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
      <PageHeader
        icon={<RobotOutlined />}
        title={deadlineOnly ? 'Điều chỉnh deadline' : mode === 'edit' ? 'Sửa dự án' : 'Tạo dự án'}
        description={deadlineOnly
          ? deadlineLocked
            ? 'Deadline đã bị khóa vì offer đã được chấp nhận hoặc dự án đã bắt đầu.'
            : 'Deadline chỉ có thể thay đổi trước khi Student chấp nhận offer.'
          : 'Dùng AI để khởi tạo brief tiếng Việt rõ ràng, sau đó SME review trước khi lưu hoặc publish.'}
      />

      <div className={`project-form-layout ${deadlineOnly ? 'deadline-only' : ''}`}>
        {!deadlineOnly ? (
          <Card className="ai-panel" title={<span><BulbOutlined /> Trợ lý AI viết brief</span>}>
            <Alert
              className="page-alert"
              type="info"
              showIcon
              message="AI chỉ hỗ trợ gợi ý nội dung. SME vẫn quyết định brief, ngân sách, deadline và trạng thái publish cuối cùng."
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
                <Input.TextArea rows={5} maxLength={3000} showCount placeholder="Ví dụ: Tôi cần bộ nhận diện cho quán cà phê take-away dành cho sinh viên, phong cách trẻ trung và dễ nhớ." />
              </Form.Item>
              <Form.Item name="businessField" label="Lĩnh vực">
                <Input placeholder="Ví dụ: F&B, giáo dục, mỹ phẩm, thời trang..." />
              </Form.Item>
              <Form.Item name="targetAudience" label="Khách hàng mục tiêu">
                <Input placeholder="Ví dụ: sinh viên 18-24 tuổi, nhân viên văn phòng, phụ huynh..." />
              </Form.Item>
              <Form.Item name="preferredStyle" label="Phong cách mong muốn">
                <Input placeholder="Ví dụ: tối giản, trẻ trung, cao cấp, vui tươi..." />
              </Form.Item>
              <div className="form-two-cols">
                <Form.Item name="budgetAmount" label="Ngân sách tham khảo">
                  <InputNumber className="full-width" min={1} addonAfter="VND" />
                </Form.Item>
                <Form.Item name="totalDeadline" label="Hạn hoàn tất mong muốn">
                  <Input type="datetime-local" />
                </Form.Item>
              </div>
              <Button type="primary" size="large" htmlType="submit" loading={aiLoading} block>
                Gợi ý bằng AI
              </Button>
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
                  <Button type="primary" onClick={applyAiSuggestionToForm}>
                    Áp dụng vào form
                  </Button>
                </Space>
              </div>
            ) : null}
          </Card>
        ) : null}

        <Card className="form-panel" title={<span><ProjectOutlined /> Thông tin dự án</span>}>
          <div className="form-section-intro">
            <strong>{deadlineOnly ? 'Mốc thời gian thực hiện' : 'Thông tin cơ bản'}</strong>
            <span>{deadlineOnly
              ? 'Student đang chờ xác nhận offer sẽ nhận thông báo khi deadline thay đổi.'
              : 'Hoàn thiện brief, ngân sách và deadline để tạo draft có thể publish.'}</span>
          </div>
          {deadlineOnly ? (
            <Alert
              className="page-alert"
              type="warning"
              showIcon
              message={deadlineLocked
                ? 'Deadline của dự án này đã bị khóa.'
                : 'Nội dung, loại dự án và ngân sách đã được khóa. Deadline cũng sẽ bị khóa ngay khi Student chấp nhận offer.'}
            />
          ) : null}
          <Form form={form} layout="vertical" onFinish={saveProject} requiredMark={false}>
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
                placeholder="Chọn danh mục thiết kế"
                notFoundContent={loadingCategories ? 'Đang tải...' : 'Chưa có danh mục khả dụng'}
              />
            </Form.Item>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề.' }]}>
              <Input size="large" disabled={deadlineOnly} />
            </Form.Item>
            <Form.Item name="brief" label="Mô tả yêu cầu / Brief dự án" rules={[{ required: true }, { min: 20, message: 'Brief tối thiểu 20 ký tự.' }]}>
              <Input.TextArea rows={10} disabled={deadlineOnly} />
            </Form.Item>
            <Form.Item name="usagePurpose" label="Mục đích sử dụng">
              <Input.TextArea rows={3} disabled={deadlineOnly} />
            </Form.Item>
            <div className="form-two-cols">
              <Form.Item name="projectType" label="Loại dự án" rules={[{ required: true, message: 'Vui lòng chọn loại dự án.' }]}>
                <Select size="large" disabled={deadlineOnly} options={[
                  { value: 'OPEN', label: 'Công khai - nhận ứng tuyển' },
                  { value: 'PRIVATE', label: 'Riêng tư - mời sinh viên' }
                ]} />
              </Form.Item>
              <Form.Item name="budgetAmount" label="Ngân sách" rules={[{ required: true }]}>
                <InputNumber className="full-width" size="large" min={1} addonAfter="VND" disabled={deadlineOnly} />
              </Form.Item>
            </div>
            <div className="form-two-cols">
              <Form.Item name="sketchDeadlineAt" label="Hạn nộp Sketch" rules={[{ required: true }]}>
                <Input size="large" type="datetime-local" disabled={deadlineLocked} />
              </Form.Item>
              <Form.Item name="finalDeadlineAt" label="Hạn nộp Final" rules={[{ required: true }]}>
                <Input size="large" type="datetime-local" disabled={deadlineLocked} />
              </Form.Item>
            </div>
            <Form.Item
              name="totalDeadlineAt"
              label="Hạn hoàn tất review dự án"
              extra="Đây là hạn SME hoàn tất review Final, không phải một bản nộp riêng."
              rules={[{ required: true }]}
            >
              <Input size="large" type="datetime-local" disabled={deadlineLocked} />
            </Form.Item>
            <Space wrap>
              <Button type="primary" size="large" htmlType="submit" loading={saving} disabled={deadlineLocked}>
                {deadlineOnly ? 'Lưu deadline' : mode === 'edit' ? 'Cập nhật' : 'Lưu nháp'}
              </Button>
              <Button size="large" onClick={() => navigate('/sme/projects')}>Hủy</Button>
            </Space>
          </Form>
        </Card>
      </div>
    </>
  );
}
