import { CalendarOutlined, SendOutlined, WalletOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Form, Input, InputNumber, Modal, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatCurrency, formatDate } from '../../utils/format.js';

export function StudentProjectDetailPage() {
  const { message } = App.useApp();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      setProject(await projectApi.getProject(projectId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const submitApplication = async (values) => {
    setApplying(true);
    try {
      await projectApi.submitApplication(projectId, values);
      message.success('Đã gửi ứng tuyển.');
      setApplyOpen(false);
      await loadProject();
    } catch (requestError) {
      const errorMessage = getApiErrorMessage(requestError, 'Không thể gửi ứng tuyển.');
      message.error(errorMessage.toLowerCase().includes('already applied')
        ? 'Bạn đã ứng tuyển dự án này rồi.'
        : errorMessage);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;

  const hasApplied = Boolean(project.hasApplied);
  const canApply = project.status === 'OPEN' && !hasApplied;
  const applyButtonLabel = hasApplied ? 'Đã ứng tuyển' : 'Gửi ứng tuyển';

  return (
    <>
      <PageHeader
        title={project.title}
        description={project.designCategoryName}
        extra={<Button type="primary" icon={<SendOutlined />} disabled={!canApply} onClick={() => setApplyOpen(true)}>{applyButtonLabel}</Button>}
      />

      <div className="project-detail-layout">
        <div className="project-detail-main">
          <Card title="Brief dự án">
            <div className="rich-text-block">{project.brief}</div>
          </Card>

          <Card title="Thông tin thực hiện">
            <Descriptions column={{ xs: 1, md: 2 }} bordered>
              <Descriptions.Item label="Trạng thái"><StatusBadge status={project.status} /></Descriptions.Item>
              <Descriptions.Item label="Loại dự án">{project.projectType}</Descriptions.Item>
              <Descriptions.Item label="Mục đích sử dụng" span={2}>{project.usagePurpose || 'Chưa có'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        <aside className="project-side-panel">
          <Card>
            <Space direction="vertical" size={18} className="full-width">
              <div className="side-metric">
                <WalletOutlined />
                <div>
                  <span>Ngân sách</span>
                  <strong>{formatCurrency(project.budgetAmount, project.currency)}</strong>
                </div>
              </div>

              <div className="side-metric">
                <CalendarOutlined />
                <div>
                  <span>Deadline tổng</span>
                  <strong>{formatDate(project.totalDeadlineAt)}</strong>
                </div>
              </div>

              <div className="deadline-list">
                <div><span>Sketch</span><strong>{formatDate(project.sketchDeadlineAt)}</strong></div>
                <div><span>Final</span><strong>{formatDate(project.finalDeadlineAt)}</strong></div>
              </div>

              <Button type="primary" size="large" block icon={<SendOutlined />} disabled={!canApply} onClick={() => setApplyOpen(true)}>
                {applyButtonLabel}
              </Button>
            </Space>
          </Card>
        </aside>
      </div>

      <Modal title="Gửi ứng tuyển" open={applyOpen} footer={null} onCancel={() => setApplyOpen(false)}>
        <Form layout="vertical" onFinish={submitApplication} requiredMark={false}>
          <Form.Item name="proposedPrice" label="Giá đề xuất" rules={[{ required: true, message: 'Vui lòng nhập giá.' }]}>
            <InputNumber className="full-width" min={1} addonAfter="VND" />
          </Form.Item>
          <Form.Item name="estimatedDurationDays" label="Số ngày dự kiến">
            <InputNumber className="full-width" min={1} max={365} addonAfter="ngày" />
          </Form.Item>
          <Form.Item name="coverLetter" label="Thư ứng tuyển" rules={[{ required: true, message: 'Vui lòng nhập thư ứng tuyển.' }, { min: 20, message: 'Tối thiểu 20 ký tự.' }]}>
            <Input.TextArea rows={5} maxLength={3000} showCount />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={applying}>Gửi ứng tuyển</Button>
        </Form>
      </Modal>
    </>
  );
}
