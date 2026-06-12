import { DeleteOutlined, EditOutlined, IdcardOutlined, PlusOutlined, SafetyCertificateOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Statistic, Switch, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState, LoadingState } from '../../components/StateViews.jsx';
import { profileApi } from '../../services/profileApi.js';
import { studentCapabilityApi } from '../../services/studentCapabilityApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export function StudentProfilePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [skillForm] = Form.useForm();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [error, setError] = useState(null);

  const loadSkills = async () => {
    try {
      setSkills(await studentCapabilityApi.getMySkills());
    } catch (requestError) {
      if (requestError?.response?.status === 401 || requestError?.response?.status === 403) {
        setSkills([]);
        return;
      }

      message.error(getApiErrorMessage(requestError, 'Không thể tải skills của bạn.'));
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileApi.getStudentProfile();
      setProfile(data);
      form.setFieldsValue(data);
      if (data?.verificationStatus === 'APPROVED') {
        await loadSkills();
      } else {
        setSkills([]);
      }
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setProfile(null);
        form.resetFields();
        setSkills([]);
      } else {
        setError(getApiErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const saved = await profileApi.saveStudentProfile(values);
      setProfile(saved);
      form.setFieldsValue(saved);
      message.success('Đã lưu hồ sơ sinh viên.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu hồ sơ.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkill = async (values) => {
    setSavingSkill(true);
    try {
      if (editingSkill) {
        await studentCapabilityApi.updateSkill(editingSkill.id, values);
        message.success('Đã cập nhật skill.');
      } else {
        await studentCapabilityApi.createSkill(values);
        message.success('Đã thêm skill.');
      }
      closeSkillModal();
      await loadSkills();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu skill.'));
    } finally {
      setSavingSkill(false);
    }
  };

  const openCreateSkillModal = () => {
    setEditingSkill(null);
    skillForm.resetFields();
    skillForm.setFieldsValue({
      level: 'INTERMEDIATE',
      isHighlighted: false
    });
    setSkillModalOpen(true);
  };

  const openEditSkillModal = (skill) => {
    setEditingSkill(skill);
    skillForm.setFieldsValue({
      skillName: skill.skillName,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
      experienceNote: skill.experienceNote,
      isHighlighted: skill.isHighlighted
    });
    setSkillModalOpen(true);
  };

  const closeSkillModal = () => {
    setEditingSkill(null);
    setSkillModalOpen(false);
    skillForm.resetFields();
  };

  const deleteSkill = async (skillId) => {
    setDeletingSkillId(skillId);
    try {
      await studentCapabilityApi.deleteSkill(skillId);
      message.success('Đã xóa skill.');
      await loadSkills();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa skill.'));
    } finally {
      setDeletingSkillId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={loadProfile} />;

  const skillsEnabled = profile?.verificationStatus === 'APPROVED';
  const skillColumns = [
    {
      title: 'Skill',
      dataIndex: 'skillName',
      render: (value, row) => (
        <div className="table-title-cell">
          <strong>{value}</strong>
          <div className="table-subtext">
            {row.yearsOfExperience != null ? `${row.yearsOfExperience} năm kinh nghiệm` : 'Chưa khai báo số năm'}
          </div>
        </div>
      )
    },
    {
      title: 'Level',
      dataIndex: 'level',
      align: 'center',
      render: (value) => <Tag color="blue">{value}</Tag>
    },
    {
      title: 'Ghi chú',
      dataIndex: 'experienceNote',
      render: (value) => value || <span className="table-subtext">Chưa có</span>
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isHighlighted',
      align: 'center',
      render: (value) => value ? <Tag color="gold">Nổi bật</Tag> : <Tag>Thường</Tag>
    },
    {
      title: 'Hành động',
      width: 180,
      align: 'right',
      render: (_, row) => (
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => openEditSkillModal(row)}>Sửa</Button>
          <Popconfirm
            title="Xóa skill?"
            description="Skill này sẽ bị gỡ khỏi hồ sơ của bạn."
            onConfirm={() => deleteSkill(row.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} loading={deletingSkillId === row.id}>Xóa</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        icon={<IdcardOutlined />}
        title="Hồ sơ sinh viên"
        description="Hoàn thiện thông tin học tập để xác thực và ứng tuyển dự án thiết kế."
      />

      {!profile && (
        <Alert
          className="page-alert"
          type="info"
          showIcon
          message="Bạn chưa có hồ sơ sinh viên"
          description="Lưu hồ sơ trước khi gửi xác thực hoặc ứng tuyển dự án."
        />
      )}

      <div className="profile-layout">
        <aside className="profile-summary">
          <Card className="summary-card visual-card">
            <div className="profile-cover" />
            <div className="summary-icon"><SafetyCertificateOutlined /></div>
            <Statistic title="Trạng thái hồ sơ" value={profile ? 'Đã cập nhật' : 'Chưa tạo'} />
            <div className="status-row">
              <span>Xác thực</span>
              <StatusBadge status={profile?.verificationStatus || 'NOT_SUBMITTED'} />
            </div>
            <div className="metric-strip">
              <TrophyOutlined />
              <div>
                <span>Dự án hoàn thành</span>
                <strong>{profile?.completedProjectsCount ?? 0}</strong>
              </div>
            </div>
          </Card>
        </aside>

        <Card className="form-panel" title="Thông tin học tập">
          <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
            <div className="form-two-cols">
              <Form.Item name="school" label="Trường học" rules={[{ required: true, message: 'Vui lòng nhập trường học.' }]}>
                <Input size="large" placeholder="Nhập tên trường học" />
              </Form.Item>
              <Form.Item name="major" label="Chuyên ngành" rules={[{ required: true, message: 'Vui lòng nhập chuyên ngành.' }]}>
                <Input size="large" placeholder="Nhập chuyên ngành" />
              </Form.Item>
            </div>
            <Form.Item name="studyStartYear" label="Năm bắt đầu học" rules={[{ required: true, message: 'Vui lòng nhập năm bắt đầu học.' }]}>
              <InputNumber className="full-width" size="large" min={2000} max={new Date().getFullYear() + 1} placeholder="Nhập năm bắt đầu" />
            </Form.Item>
            <Form.Item name="bio" label="Giới thiệu bản thân">
              <Input.TextArea rows={5} maxLength={1000} showCount placeholder="Nhập giới thiệu ngắn về bản thân" />
            </Form.Item>
            <Button type="primary" size="large" htmlType="submit" loading={saving}>Lưu hồ sơ</Button>
          </Form>
        </Card>
      </div>

      <Card
        className="table-card"
        title="Skills của bạn"
        extra={(
          <Button type="primary" icon={<PlusOutlined />} disabled={!skillsEnabled} onClick={openCreateSkillModal}>
            Thêm skill
          </Button>
        )}
      >
        {!profile ? (
          <Alert
            type="info"
            showIcon
            className="form-alert"
            message="Tạo hồ sơ sinh viên trước khi khai báo skills."
          />
        ) : null}
        {profile && !skillsEnabled ? (
          <Alert
            type="warning"
            showIcon
            className="form-alert"
            message="Skills sẽ mở sau khi hồ sơ sinh viên được xác thực."
            description="Khi trạng thái chuyển sang đã xác thực, bạn có thể thêm kỹ năng nổi bật để SME và AI nhìn thấy rõ năng lực."
          />
        ) : null}
        {skillsEnabled ? (
          <Table
            className="dashboard-data-table"
            rowKey="id"
            columns={skillColumns}
            dataSource={skills}
            pagination={{ pageSize: 6 }}
            locale={{ emptyText: 'Bạn chưa khai báo skill nào.' }}
          />
        ) : null}
      </Card>

      <Modal
        open={skillModalOpen}
        title={editingSkill ? 'Cập nhật skill' : 'Thêm skill'}
        onCancel={closeSkillModal}
        onOk={() => skillForm.submit()}
        okText={editingSkill ? 'Lưu thay đổi' : 'Thêm skill'}
        confirmLoading={savingSkill}
        destroyOnHidden
      >
        <Form form={skillForm} layout="vertical" onFinish={handleSaveSkill} preserve={false}>
          <Form.Item name="skillName" label="Tên skill" rules={[{ required: true, message: 'Nhập tên skill.' }]}>
            <Input maxLength={150} />
          </Form.Item>
          <div className="form-two-cols">
            <Form.Item name="level" label="Level" rules={[{ required: true, message: 'Chọn level.' }]}>
              <Select
                options={[
                  { value: 'BEGINNER', label: 'Beginner' },
                  { value: 'INTERMEDIATE', label: 'Intermediate' },
                  { value: 'ADVANCED', label: 'Advanced' }
                ]}
              />
            </Form.Item>
            <Form.Item name="yearsOfExperience" label="Số năm kinh nghiệm">
              <InputNumber className="full-width" min={0} max={60} />
            </Form.Item>
          </div>
          <Form.Item name="experienceNote" label="Ghi chú kinh nghiệm">
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="isHighlighted" label="Đánh dấu nổi bật" valuePropName="checked">
            <Switch checkedChildren="Nổi bật" unCheckedChildren="Thường" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
