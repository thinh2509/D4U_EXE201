import { BulbOutlined, ProjectOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, InputNumber, Select, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { aiApi } from '../../services/aiApi.js';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { normalizeDateInput, toDateTimeLocalValue } from '../../utils/format.js';

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

  const applyAiSuggestion = async (values) => {
    setAiLoading(true);
    try {
      const suggestion = await aiApi.suggestProjectBrief({
        rawIdea: values.rawIdea,
        businessField: values.businessField || null,
        targetAudience: values.targetAudience || null,
        preferredStyle: values.preferredStyle || null,
        budgetAmount: values.budgetAmount ? Number(values.budgetAmount) : null,
        totalDeadline: values.totalDeadline ? normalizeDateInput(values.totalDeadline) : null
      });
      form.setFieldsValue({
        title: suggestion.suggestedTitle,
        brief: `${suggestion.suggestedBrief}\n\nDeliverables:\n${suggestion.suggestedDeliverables.map((item) => `- ${item}`).join('\n')}`,
        usagePurpose: suggestion.suggestedUsagePurpose,
        sketchDeadlineAt: toDateTimeLocalValue(suggestion.suggestedSketchDeadline),
        finalDeadlineAt: toDateTimeLocalValue(suggestion.suggestedFinalDeadline)
      });
      message.success('Đã áp dụng gợi ý AI vào form. Vui lòng review trước khi lưu.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gọi AI assistant.'));
    } finally {
      setAiLoading(false);
    }
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
          : 'Dùng AI để khởi tạo brief nhanh, sau đó SME review trước khi lưu hoặc publish.'}
      />

      <div className={`project-form-layout ${deadlineOnly ? 'deadline-only' : ''}`}>
        {!deadlineOnly ? <Card className="ai-panel" title={<span><BulbOutlined /> Trợ lý AI viết brief</span>}>
          <Alert className="page-alert" type="info" showIcon message="AI chỉ hỗ trợ prefill nội dung. SME vẫn quyết định brief, ngân sách và deadline cuối cùng." />
          <Form form={aiForm} layout="vertical" onFinish={applyAiSuggestion} requiredMark={false}>
            <Form.Item name="rawIdea" label="Ý tưởng thô" rules={[{ required: true, message: 'Vui lòng nhập ý tưởng.' }, { min: 20, message: 'Tối thiểu 20 ký tự.' }]}>
              <Input.TextArea rows={5} maxLength={3000} showCount placeholder="Nhập ý tưởng dự án cần AI hỗ trợ" />
            </Form.Item>
            <Form.Item name="businessField" label="Lĩnh vực">
              <Input placeholder="Nhập lĩnh vực kinh doanh" />
            </Form.Item>
            <Form.Item name="targetAudience" label="Khách hàng mục tiêu">
              <Input placeholder="Nhập nhóm khách hàng mục tiêu" />
            </Form.Item>
            <Form.Item name="preferredStyle" label="Phong cách mong muốn">
              <Input placeholder="Nhập phong cách mong muốn" />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit" loading={aiLoading} block>Gợi ý bằng AI</Button>
          </Form>
        </Card> : null}

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
              <Input.TextArea rows={7} disabled={deadlineOnly} />
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
