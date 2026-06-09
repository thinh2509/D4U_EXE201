import {
  AuditOutlined,
  BankOutlined,
  BookOutlined,
  BulbOutlined,
  CloseOutlined,
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
import { Button, Drawer, Layout } from 'antd';
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

function getItemPath(item) {
  return item.label?.props?.to || item.key;
}

function getItemLabel(item) {
  return item.label?.props?.children || item.label;
}

function SidebarNav({ items, selectedKey, onNavigate }) {
  return (
    <nav className="flex flex-col gap-6">
      {items.map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="px-3 text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
            {group.label}
          </h2>
          <div className="flex flex-col gap-1">
            {group.children?.map((item) => {
              const href = getItemPath(item);
              const active = selectedKey === item.key;

              return (
                <Link
                  key={item.key}
                  to={href}
                  onClick={onNavigate}
                  className={[
                    'group flex min-h-[46px] items-center gap-3 rounded-btn border-l-2 px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                    active
                      ? 'border-d4u-cyan bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                      : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
                  ].join(' ')}
                >
                  <span className={active ? 'text-white' : 'text-white/70 group-hover:text-white'}>
                    {item.icon}
                  </span>
                  <span className="leading-5">{getItemLabel(item)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
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

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-d4u-teal-deep via-d4u-teal-deep to-d4u-nav-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="rounded-card border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
          <D4ULogo className="w-[186px]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <SidebarNav items={items} selectedKey={selectedKey} onNavigate={() => setDrawerOpen(false)} />
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-d4u-bg">
      <Sider
        width={280}
        breakpoint="lg"
        collapsedWidth="0"
        className="hidden !fixed !inset-y-0 !left-0 !z-40 !h-screen overflow-hidden border-r border-white/10 bg-d4u-teal-deep shadow-none lg:!block"
      >
        {sidebarContent}
      </Sider>

      <Drawer
        className="[&_.ant-drawer-body]:!p-0 [&_.ant-drawer-content]:!bg-d4u-nav-dark"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={316}
        closable={false}
        title={null}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-d4u-teal-deep via-d4u-teal-deep to-d4u-nav-dark text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="rounded-card border border-white/10 bg-white/10 p-3">
              <D4ULogo className="w-[170px]" />
            </div>
            <Button
              type="text"
              aria-label="Đóng menu"
              icon={<CloseOutlined />}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white hover:!bg-white/15 hover:!text-white"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <SidebarNav items={items} selectedKey={selectedKey} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      </Drawer>

      <Layout className="min-w-0 bg-transparent">
        <Header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-d4u-border bg-d4u-surface px-4 sm:px-6">
          <Button
            aria-label="Mở menu"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-d4u-border bg-white text-d4u-teal-deep shadow-sm hover:!border-d4u-cyan hover:!text-d4u-cyan lg:!hidden"
          />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-d4u-text-3">D4U Outcome 1</span>
            <strong className="truncate text-[18px] font-semibold leading-tight text-d4u-text-1">{title}</strong>
          </div>
          <div className="flex-1" />
          <NotificationBell />
          <UserMenu user={user} onLogout={handleLogout} />
        </Header>

        <Content className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
