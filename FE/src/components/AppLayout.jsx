import {
  AuditOutlined,
  BankOutlined,
  BookOutlined,
  BuildOutlined,
  BulbOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  MenuOutlined,
  MessageOutlined,
  PlusCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, Tag } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { D4ULogo } from './D4ULogo.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { UserMenu } from './UserMenu.jsx';

const { Header, Sider, Content } = Layout;

const menuByRole = {
  STUDENT: [
    {
      type: 'group',
      label: 'Tổng quan',
      children: [
        { key: '/student/dashboard', icon: <DashboardOutlined />, label: <Link to="/student/dashboard">Dashboard</Link> },
        { key: '/student/projects', icon: <FolderOpenOutlined />, label: <Link to="/student/projects">Dự án đang mở</Link> }
      ]
    },
    {
      type: 'group',
      label: 'Công việc',
      children: [
        { key: '/student/applications', icon: <FileDoneOutlined />, label: <Link to="/student/applications">Ứng tuyển</Link> },
        { key: '/student/offers', icon: <MessageOutlined />, label: <Link to="/student/offers">Đề nghị</Link> },
        { key: '/student/my-projects', icon: <BookOutlined />, label: <Link to="/student/my-projects">Dự án của tôi</Link> }
      ]
    },
    {
      type: 'group',
      label: 'Hồ sơ',
      children: [
        { key: '/student/portfolio', icon: <StarOutlined />, label: <Link to="/student/portfolio">Portfolio</Link> },
        { key: '/student/wallet', icon: <WalletOutlined />, label: <Link to="/student/wallet">Ví D4U</Link> },
        { key: '/student/profile', icon: <UserOutlined />, label: <Link to="/student/profile">Hồ sơ sinh viên</Link> },
        { key: '/student/verification', icon: <SafetyCertificateOutlined />, label: <Link to="/student/verification">Xác thực</Link> },
        { key: '/student/ratings', icon: <StarOutlined />, label: <Link to="/student/ratings">Đánh giá</Link> }
      ]
    }
  ],
  SME: [
    {
      type: 'group',
      label: 'Tổng quan',
      children: [
        { key: '/sme/dashboard', icon: <DashboardOutlined />, label: <Link to="/sme/dashboard">Dashboard</Link> },
        { key: '/sme/projects', icon: <FolderOpenOutlined />, label: <Link to="/sme/projects">Dự án của tôi</Link> },
        { key: '/sme/projects/new', icon: <PlusCircleOutlined />, label: <Link to="/sme/projects/new">Tạo dự án</Link> }
      ]
    },
    {
      type: 'group',
      label: 'Tuyển chọn',
      children: [
        { key: '/sme/applications', icon: <FileSearchOutlined />, label: <Link to="/sme/applications">Ứng tuyển</Link> },
        { key: '/sme/offers', icon: <MessageOutlined />, label: <Link to="/sme/offers">Đề nghị</Link> },
        { key: '/sme/ai-brief', icon: <BulbOutlined />, label: <Link to="/sme/ai-brief">AI Brief</Link> },
        { key: '/sme/ai-matching', icon: <TeamOutlined />, label: <Link to="/sme/ai-matching">AI Matching</Link> }
      ]
    },
    {
      type: 'group',
      label: 'Tài khoản',
      children: [
        { key: '/sme/billing', icon: <CreditCardOutlined />, label: <Link to="/sme/billing">Gói & thanh toán</Link> },
        { key: '/sme/profile', icon: <BankOutlined />, label: <Link to="/sme/profile">Hồ sơ doanh nghiệp</Link> },
        { key: '/sme/ratings', icon: <StarOutlined />, label: <Link to="/sme/ratings">Đánh giá</Link> }
      ]
    }
  ],
  ADMIN: [
    {
      type: 'group',
      label: 'Vận hành',
      children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Dashboard</Link> },
        { key: '/admin/verifications', icon: <FileSearchOutlined />, label: <Link to="/admin/verifications">Duyệt xác thực</Link> },
        { key: '/admin/portfolio', icon: <StarOutlined />, label: <Link to="/admin/portfolio">Portfolio</Link> },
        { key: '/admin/withdrawals', icon: <WalletOutlined />, label: <Link to="/admin/withdrawals">Rút tiền</Link> },
        { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Người dùng</Link> },
        { key: '/admin/audit-logs', icon: <AuditOutlined />, label: <Link to="/admin/audit-logs">Audit logs</Link> }
      ]
    }
  ]
};

const pageTitleByPath = {
  '/student/dashboard': 'Student dashboard',
  '/student/projects': 'Marketplace dự án',
  '/student/applications': 'Ứng tuyển của tôi',
  '/student/offers': 'Đề nghị',
  '/student/my-projects': 'Dự án của tôi',
  '/student/portfolio': 'Portfolio',
  '/student/wallet': 'Ví D4U',
  '/student/profile': 'Hồ sơ sinh viên',
  '/student/verification': 'Xác thực sinh viên',
  '/student/ratings': 'Đánh giá',
  '/sme/dashboard': 'SME dashboard',
  '/sme/projects': 'Quản lý dự án',
  '/sme/projects/new': 'Tạo dự án',
  '/sme/applications': 'Ứng tuyển',
  '/sme/offers': 'Đề nghị',
  '/sme/ai-brief': 'AI Brief Assistant',
  '/sme/ai-matching': 'AI Matching',
  '/sme/billing': 'Gói & thanh toán',
  '/sme/profile': 'Hồ sơ doanh nghiệp',
  '/sme/ratings': 'Đánh giá',
  '/admin/dashboard': 'Admin dashboard',
  '/admin/verifications': 'Duyệt xác thực',
  '/admin/portfolio': 'Duyệt portfolio',
  '/admin/withdrawals': 'Xử lý rút tiền',
  '/admin/users': 'Người dùng',
  '/admin/audit-logs': 'Audit logs'
};

function flattenMenu(items) {
  return items.flatMap((item) => item.children || item);
}

function AppMenu({ items, selectedKey, onClick }) {
  return <Menu mode="inline" selectedKeys={[selectedKey]} items={items} onClick={onClick} />;
}

function getSelectedKey(flatItems, pathname) {
  return [...flatItems]
    .sort((a, b) => b.key.length - a.key.length)
    .find((item) => pathname.startsWith(item.key))?.key || flatItems[0]?.key;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const items = menuByRole[user?.role] || [];
  const flatItems = flattenMenu(items);
  const selectedKey = getSelectedKey(flatItems, location.pathname);
  const title = pageTitleByPath[selectedKey] || 'D4U';
  const roleText = user?.role === 'STUDENT'
    ? 'Student workspace'
    : user?.role === 'SME'
      ? 'SME workspace'
      : 'Admin console';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout className="app-layout">
      <Sider className="app-sider" width={268} breakpoint="lg" collapsedWidth="0">
        <div className="sider-brand">
          <D4ULogo />
          <Tag className="role-pill">{roleText}</Tag>
        </div>
        <AppMenu items={items} selectedKey={selectedKey} />
      </Sider>

      <Drawer
        className="mobile-nav"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={304}
        title={<D4ULogo />}
      >
        <Tag className="role-pill mobile-role-pill">{roleText}</Tag>
        <AppMenu items={items} selectedKey={selectedKey} onClick={() => setDrawerOpen(false)} />
      </Drawer>

      <Layout>
        <Header className="app-header">
          <Button className="mobile-menu-button" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
          <div className="header-context">
            <span>D4U</span>
            <strong>{title}</strong>
          </div>
          <Tag className="header-chip" icon={<BuildOutlined />}>MVP workspace</Tag>
          <NotificationBell />
          <UserMenu user={user} onLogout={handleLogout} />
        </Header>

        <Content className="app-content">
          <div className="content-shell">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
