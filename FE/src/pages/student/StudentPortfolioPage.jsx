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

const portfolioStatusDescriptions = {
  PUBLIC: 'Hiển thị với SME và dùng được cho public profile.',
  PRIVATE: 'Chỉ bạn thấy trong khu quản lý nội bộ.',
  DRAFT: 'Bản nháp chưa công khai.',
  HIDDEN: 'Đã bị ẩn khỏi public profile.'
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

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isFeatured: false,
      studentSkillIds: []
    });
    setPortfolioModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      sourceProjectId: item.sourceProjectId || undefined,
      designCategoryId: item.designCategoryId || undefined,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl || undefined,
      projectUrl: item.projectUrl || undefined,
      fileUrl: item.fileUrl || undefined,
      completedAt: toDateInputValue(item.completedAt),
      studentSkillIds: item.skillsUsed.map((skill) => skill.id),
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
      sourceProjectId: values.sourceProjectId || null,
      designCategoryId: values.designCategoryId || null,
      title: values.title,
      description: values.description,
      thumbnailUrl: values.thumbnailUrl || null,
      projectUrl: values.projectUrl || null,
      fileUrl: values.fileUrl || null,
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
      title: 'Portfolio item',
      dataIndex: 'title',
      render: (value, row) => (
        <div className="table-title-cell">
          <strong>{value}</strong>
          <div className="table-subtext">
            {row.designCategoryName || 'Chưa gắn danh mục'} • {row.isFeatured ? 'Nổi bật' : 'Thường'}
          </div>
        </div>
      )
    },
    {
      title: 'Skills dùng',
      dataIndex: 'skillsUsed',
      render: (value) => (
        value?.length ? (
          <Space wrap>
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
      render: (value) => <StatusBadge status={value} />
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completedAt',
      className: 'table-cell-date',
      render: (value) => formatDate(value)
    },
    {
      title: 'Hành động',
      width: 220,
      align: 'right',
      render: (_, row) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(row)}>
            Sửa
          </Button>
          <Button
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
            <Button danger icon={<DeleteOutlined />} loading={actingId === row.id}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<StarOutlined />}
        title="Portfolio của tôi"
        description="Quản lý sản phẩm mẫu để SME đánh giá năng lực và để AI dùng làm dữ liệu nền cho matching, proposal sau này."
        extra={(
          <Space wrap>
            <Button onClick={loadData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Thêm portfolio item
            </Button>
          </Space>
        )}
      />

      <Alert
        type="info"
        showIcon
        className="form-alert"
        message="Portfolio chỉ cho công khai khi dữ liệu đủ sạch để SME và AI hiểu đúng."
        description="Nếu portfolio item gắn với dự án D4U đã hoàn thành, hệ thống sẽ tiếp tục kiểm tra điều kiện bảo mật và quyền cho vào portfolio trước khi publish."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="summary-card visual-card">
          <div className="metric-strip">
            <EyeOutlined />
            <div>
              <span>Đang công khai</span>
              <strong>{items.filter((item) => item.isPublic).length}</strong>
            </div>
          </div>
        </Card>
        <Card className="summary-card visual-card">
          <div className="metric-strip">
            <StarFilled />
            <div>
              <span>Nổi bật</span>
              <strong>{items.filter((item) => item.isFeatured).length}</strong>
            </div>
          </div>
        </Card>
        <Card className="summary-card visual-card">
          <div className="metric-strip">
            <CheckCircleOutlined />
            <div>
              <span>Tổng item</span>
              <strong>{items.length}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card className="table-card" loading={loading}>
        <Table
          className="dashboard-data-table"
          rowKey="id"
          columns={columns}
          dataSource={items}
          scroll={{ x: 1020 }}
          expandable={{
            expandedRowRender: (row) => (
              <div className="expanded-copy">
                <p>{row.description}</p>
                <Space wrap size="middle">
                  {row.thumbnailUrl ? <a href={row.thumbnailUrl} target="_blank" rel="noreferrer"><LinkOutlined /> Thumbnail</a> : null}
                  {row.projectUrl ? <a href={row.projectUrl} target="_blank" rel="noreferrer"><LinkOutlined /> Project URL</a> : null}
                  {row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noreferrer"><LinkOutlined /> File URL</a> : null}
                  <span>{portfolioStatusDescriptions[row.status] || 'Không có mô tả trạng thái.'}</span>
                </Space>
              </div>
            )
          }}
          locale={{
            emptyText: (
              <Empty
                description="Bạn chưa có portfolio item nào."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      <Modal
        open={portfolioModalOpen}
        title={editingItem ? 'Cập nhật portfolio item' : 'Tạo portfolio item'}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingItem ? 'Lưu thay đổi' : 'Tạo item'}
        confirmLoading={saving}
        width={760}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={submitForm} preserve={false}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề portfolio item.' }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả portfolio item.' }]}>
            <Input.TextArea rows={5} maxLength={4000} showCount />
          </Form.Item>
          <div className="form-two-cols">
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
          <div className="form-two-cols">
            <Form.Item name="thumbnailUrl" label="Thumbnail URL">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="projectUrl" label="Project URL">
              <Input placeholder="https://..." />
            </Form.Item>
          </div>
          <div className="form-two-cols">
            <Form.Item name="fileUrl" label="File URL">
              <Input placeholder="https://..." />
            </Form.Item>
            <Form.Item name="sourceProjectId" label="D4U project ID">
              <Input placeholder="Gắn dự án D4U đã hoàn thành nếu có" />
            </Form.Item>
          </div>
          <Form.Item name="isFeatured" label="Đánh dấu nổi bật" valuePropName="checked">
            <Switch checkedChildren="Nổi bật" unCheckedChildren="Thường" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
