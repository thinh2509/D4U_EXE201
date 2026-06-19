import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StudentReadinessGate } from '../../components/StudentReadinessGate.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { projectApi } from '../../services/projectApi.js';
import { studentCapabilityApi } from '../../services/studentCapabilityApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

function toDateInputValue(value) {
  if (!value) return undefined;
  return new Date(value).toISOString().slice(0, 10);
}

function toIsoDate(value) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function renderExternalLink(url, label) {
  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <LinkOutlined /> {label}
    </a>
  );
}

function PortfolioMetricCard({ icon, label, value, helper }) {
  return (
    <Card className="rounded-panel border border-d4u-border/70 shadow-soft">
      <div className="flex items-start gap-4 rounded-card border border-d4u-border/60 bg-d4u-soft/40 px-4 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg text-d4u-primary shadow-soft">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-d4u-text-3">{label}</div>
          <div className="mt-1 text-4xl font-bold leading-none text-d4u-text-1">{value}</div>
          <div className="mt-1 text-sm text-d4u-text-3">{helper}</div>
        </div>
      </div>
    </Card>
  );
}

function PortfolioThumbnail({ item }) {
  if (item.thumbnailUrl) {
    return (
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="h-16 w-16 rounded-2xl border border-d4u-border/60 object-cover shadow-soft"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-d4u-border/60 bg-d4u-soft/50 text-lg text-d4u-primary shadow-soft">
      <LinkOutlined />
    </div>
  );
}

const portfolioStatusDescriptions = {
  PUBLIC: 'Hiển thị với SME và được dùng cho hồ sơ công khai.',
  PRIVATE: 'Chỉ bạn nhìn thấy trong khu vực quản lý nội bộ.',
  DRAFT: 'Bản nháp chưa công khai cho SME.',
  HIDDEN: 'Đã bị ẩn khỏi hồ sơ công khai.'
};

const descriptionClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

export function StudentPortfolioPage() {
  return (
    <StudentReadinessGate
      requireApproved
      approvedTitle="Cần xác thực trước khi quản lý portfolio"
      approvedDescription="Skills và portfolio chỉ mở khi hồ sơ sinh viên đã được xác thực để SME và AI có thể dùng dữ liệu này một cách đáng tin cậy."
    >
      <StudentPortfolioPageContent />
    </StudentReadinessGate>
  );
}

function StudentPortfolioPageContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolioResult, skillResult, categoryResult] = await Promise.all([
        studentCapabilityApi.getMyPortfolio(),
        studentCapabilityApi.getMySkills(),
        projectApi.listDesignCategories()
      ]);

      setItems(portfolioResult);
      setSkills(skillResult);
      setCategories(categoryResult);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải portfolio của bạn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories]
  );

  const skillOptions = useMemo(
    () => skills.map((skill) => ({
      value: skill.id,
      label: `${skill.skillName}${skill.isHighlighted ? ' • Nổi bật' : ''}`
    })),
    [skills]
  );

  const publicCount = useMemo(() => items.filter((item) => item.isPublic).length, [items]);
  const featuredCount = useMemo(() => items.filter((item) => item.isFeatured).length, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      title: '',
      projectUrl: '',
      description: '',
      designCategoryId: undefined,
      completedAt: undefined,
      studentSkillIds: [],
      thumbnailUrl: '',
      isFeatured: false
    });
    setPortfolioModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      projectUrl: item.projectUrl || '',
      description: item.description || '',
      designCategoryId: item.designCategoryId || undefined,
      completedAt: toDateInputValue(item.completedAt),
      studentSkillIds: item.skillsUsed.map((skill) => skill.id),
      thumbnailUrl: item.thumbnailUrl || '',
      isFeatured: item.isFeatured
    });
    setPortfolioModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setPortfolioModalOpen(false);
    form.resetFields();
  };

  const submitForm = async (values) => {
    setSaving(true);

    const payload = {
      sourceProjectId: editingItem?.sourceProjectId || null,
      designCategoryId: values.designCategoryId || null,
      title: values.title.trim(),
      description: values.description?.trim() || '',
      thumbnailUrl: values.thumbnailUrl?.trim() || null,
      projectUrl: values.projectUrl.trim(),
      fileUrl: editingItem?.fileUrl || null,
      completedAt: toIsoDate(values.completedAt),
      studentSkillIds: values.studentSkillIds || [],
      isFeatured: values.isFeatured || false
    };

    try {
      if (editingItem) {
        await studentCapabilityApi.updatePortfolioItem(editingItem.id, payload);
        message.success('Đã cập nhật portfolio item.');
      } else {
        await studentCapabilityApi.createPortfolioItem(payload);
        message.success('Đã tạo portfolio item.');
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu portfolio item.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId) => {
    setActingId(itemId);
    try {
      await studentCapabilityApi.deletePortfolioItem(itemId);
      message.success('Đã xóa portfolio item.');
      await loadData();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa portfolio item.'));
    } finally {
      setActingId(null);
    }
  };

  const togglePublish = async (item) => {
    setActingId(item.id);
    try {
      if (item.isPublic) {
        await studentCapabilityApi.unpublishPortfolioItem(item.id);
        message.success('Đã chuyển portfolio item về riêng tư.');
      } else {
        await studentCapabilityApi.publishPortfolioItem(item.id);
        message.success('Đã công khai portfolio item.');
      }
      await loadData();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể đổi trạng thái portfolio item.'));
    } finally {
      setActingId(null);
    }
  };

  if (error) return <ErrorState description={error} onRetry={loadData} />;

  const columns = [
    {
      title: 'Portfolio',
      dataIndex: 'title',
      render: (value, row) => (
        <div className="flex min-w-0 items-start gap-4 py-1">
          <PortfolioThumbnail item={row} />
          <div className="min-w-0 space-y-2">
            <div className="table-title-cell">
              <strong className="text-[1.04rem] font-semibold text-d4u-text-1">{value}</strong>
              <div className="table-subtext">
                {row.designCategoryName || 'Chưa gắn danh mục'}
                {row.isFeatured ? ' • Nổi bật' : ''}
              </div>
            </div>
            <div className="max-w-[520px] text-sm leading-6 text-d4u-text-2" style={descriptionClampStyle}>
              {row.description || 'Portfolio này đang để tối giản với link dự án là trọng tâm.'}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Liên kết',
      dataIndex: 'projectUrl',
      width: 180,
      render: (value, row) => (
        <Space direction="vertical" size={6}>
          {value ? (
            <Button
              type="link"
              icon={<LinkOutlined />}
              href={value}
              target="_blank"
              rel="noreferrer"
              className="h-auto px-0 text-sm font-semibold"
            >
              Xem portfolio
            </Button>
          ) : (
            <span className="table-subtext">Chưa có link dự án</span>
          )}
          {!value && row.fileUrl ? renderExternalLink(row.fileUrl, 'Mở file đính kèm') : null}
        </Space>
      )
    },
    {
      title: 'Skills dùng',
      dataIndex: 'skillsUsed',
      width: 170,
      render: (value) => (
        value?.length ? (
          <Space wrap size={[6, 6]}>
            {value.map((skill) => (
              <Tag key={skill.id} color={skill.isHighlighted ? 'gold' : 'default'}>
                {skill.skillName}
              </Tag>
            ))}
          </Space>
        ) : <span className="table-subtext">Chưa gắn skills</span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      align: 'center',
      className: 'table-cell-status',
      width: 140,
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completedAt',
      className: 'table-cell-date',
      width: 140,
      render: (value) => formatDate(value)
    },
    {
      title: 'Hành động',
      width: 190,
      align: 'right',
      render: (_, row) => (
        <div className="flex flex-col items-end gap-2">
          <Button className="min-w-[132px]" icon={<EditOutlined />} onClick={() => openEditModal(row)}>
            Sửa
          </Button>
          <Button
            className="min-w-[132px]"
            icon={row.isPublic ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            loading={actingId === row.id}
            onClick={() => togglePublish(row)}
            disabled={row.status === 'HIDDEN'}
          >
            {row.isPublic ? 'Ẩn khỏi SME' : 'Công khai'}
          </Button>
          <Popconfirm
            title="Xóa portfolio item?"
            description="Thao tác này không thể hoàn tác."
            onConfirm={() => deleteItem(row.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger className="min-w-[132px]" icon={<DeleteOutlined />} loading={actingId === row.id}>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<StarOutlined />}
        title="Portfolio của tôi"
        description="Quản lý các link portfolio để SME xem nhanh năng lực của bạn, đồng thời giúp AI có thêm ngữ cảnh khi matching và gợi ý proposal."
        extra={(
          <Space wrap>
            <Button onClick={loadData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Thêm link portfolio
            </Button>
          </Space>
        )}
      />

      <Alert
        type="info"
        showIcon
        className="form-alert !mb-5 rounded-panel border border-d4u-primary/20 !bg-d4u-soft/45"
        message="Ưu tiên thêm link portfolio thật dễ mở và dễ xem."
        description="Bạn chỉ cần tiêu đề và Project URL để tạo item. Nếu muốn SME và AI hiểu ngữ cảnh tốt hơn, hãy bổ sung mô tả ngắn, danh mục hoặc skills đã dùng."
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <PortfolioMetricCard icon={<EyeOutlined />} label="Đang công khai" value={publicCount} helper="SME đang xem được" />
        <PortfolioMetricCard icon={<StarFilled />} label="Nổi bật" value={featuredCount} helper="Item được ghim ưu tiên" />
        <PortfolioMetricCard icon={<CheckCircleOutlined />} label="Tổng item" value={items.length} helper="Tất cả portfolio đã tạo" />
      </div>

      <Card className="table-card" loading={loading}>
        <Table
          className="dashboard-data-table"
          rowKey="id"
          columns={columns}
          dataSource={items}
          scroll={{ x: 1120 }}
          pagination={items.length > 10 ? { pageSize: 10, hideOnSinglePage: true } : false}
          expandable={{
            expandedRowRender: (row) => (
              <div className="space-y-4">
                {row.thumbnailUrl ? (
                  <div className="overflow-hidden rounded-card border border-d4u-border/70 bg-d4u-soft/40 p-3">
                    <img
                      src={row.thumbnailUrl}
                      alt={row.title}
                      className="h-44 w-full rounded-xl object-cover"
                    />
                  </div>
                ) : null}
                <div className="expanded-copy">
                  <p>{row.description || 'Chưa có mô tả bổ sung cho portfolio này.'}</p>
                </div>
                <Space wrap size="middle">
                  {renderExternalLink(row.projectUrl, 'Xem portfolio')}
                  {!row.projectUrl && row.fileUrl ? renderExternalLink(row.fileUrl, 'Mở file đính kèm') : null}
                  <span>{portfolioStatusDescriptions[row.status] || 'Không có mô tả trạng thái.'}</span>
                </Space>
              </div>
            )
          }}
          locale={{
            emptyText: (
              <Empty
                description="Bạn chưa có portfolio item nào. Hãy thêm link portfolio đầu tiên để SME xem nhanh năng lực của bạn."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      <Modal
        open={portfolioModalOpen}
        title={editingItem ? 'Cập nhật portfolio item' : 'Thêm link portfolio'}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingItem ? 'Lưu thay đổi' : 'Tạo item'}
        confirmLoading={saving}
        width={760}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submitForm} preserve={false}>
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="Link-first: chỉ cần tiêu đề và Project URL là đủ để tạo portfolio."
            description="Project URL có thể là Behance, Dribbble, Figma, Google Drive hoặc landing page demo. Phần còn lại chỉ là bổ sung để SME và AI hiểu rõ hơn về dự án."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: 'Nhập tiêu đề portfolio item.' }]}
            >
              <Input maxLength={255} placeholder="Ví dụ: Branding cho quán cà phê take-away" />
            </Form.Item>
            <Form.Item
              name="projectUrl"
              label="Project URL"
              rules={[
                { required: true, message: 'Nhập Project URL.' },
                { type: 'url', message: 'Project URL phải là một liên kết hợp lệ.' }
              ]}
            >
              <Input placeholder="https://behance.net/..., https://figma.com/..." />
            </Form.Item>
          </div>

          <Collapse
            bordered={false}
            className="rounded-card border border-d4u-border/70 bg-d4u-soft/30"
            items={[
              {
                key: 'advanced',
                label: 'Thông tin bổ sung',
                children: (
                  <div className="space-y-4 pt-2">
                    <Form.Item
                      name="description"
                      label="Mô tả ngắn"
                      extra="Không bắt buộc. Một đến hai câu ngắn sẽ giúp SME và AI hiểu ngữ cảnh chính xác hơn."
                    >
                      <Input.TextArea
                        rows={4}
                        maxLength={4000}
                        showCount
                        placeholder="Mô tả mục tiêu, phong cách, output chính hoặc vai trò của bạn trong dự án."
                      />
                    </Form.Item>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Form.Item name="designCategoryId" label="Danh mục thiết kế">
                        <Select allowClear options={categoryOptions} placeholder="Chọn danh mục nếu có" />
                      </Form.Item>
                      <Form.Item name="completedAt" label="Ngày hoàn thành">
                        <Input type="date" />
                      </Form.Item>
                    </div>
                    <Form.Item name="studentSkillIds" label="Skills đã dùng">
                      <Select mode="multiple" allowClear options={skillOptions} placeholder="Gắn skills liên quan" />
                    </Form.Item>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Form.Item
                        name="thumbnailUrl"
                        label="Thumbnail URL"
                        rules={[{ type: 'url', message: 'Thumbnail URL phải là một liên kết hợp lệ.' }]}
                      >
                        <Input placeholder="https://..." />
                      </Form.Item>
                      <Form.Item name="isFeatured" label="Đánh dấu nổi bật" valuePropName="checked">
                        <Switch checkedChildren="Nổi bật" unCheckedChildren="Thường" />
                      </Form.Item>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Form>
      </Modal>
    </>
  );
}
