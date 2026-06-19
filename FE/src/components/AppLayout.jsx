import {
  BankOutlined,
  BookOutlined,
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
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { D4ULogo } from './D4ULogo.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { PageShell } from './PageShell.jsx';
import { UserMenu } from './UserMenu.jsx';

const menuByRole = {
  STUDENT: [
    {
      type: 'group',
      label: 'Tổng quan',
      children: [
        { key: '/student/dashboard', icon: <DashboardOutlined />, label: <Link to="/student/dashboard">Dashboard</Link> },
        { key: '/student/projects', icon: <FolderOpenOutlined />, label: <Link to="/student/projects">Dự án đang mở</Link> },
      ],
    },
    {
      type: 'group',
      label: 'Công việc',
      children: [
        { key: '/student/applications', icon: <FileDoneOutlined />, label: <Link to="/student/applications">Ứng tuyển</Link> },
        { key: '/student/offers', icon: <MessageOutlined />, label: <Link to="/student/offers">Đề nghị</Link> },
        { key: '/student/my-projects', icon: <BookOutlined />, label: <Link to="/student/my-projects">Dự án của tôi</Link> },
      ],
    },
    {
      type: 'group',
      label: 'Hồ sơ',
      children: [
        { key: '/student/portfolio', icon: <StarOutlined />, label: <Link to="/student/portfolio">Portfolio</Link> },
        { key: '/student/billing', icon: <CreditCardOutlined />, label: <Link to="/student/billing">Gói AI</Link> },
        { key: '/student/wallet', icon: <WalletOutlined />, label: <Link to="/student/wallet">Ví D4U</Link> },
        { key: '/student/profile', icon: <UserOutlined />, label: <Link to="/student/profile">Hồ sơ sinh viên</Link> },
        { key: '/student/verification', icon: <SafetyCertificateOutlined />, label: <Link to="/student/verification">Xác thực</Link> },
        { key: '/student/ratings', icon: <StarOutlined />, label: <Link to="/student/ratings">Đánh giá</Link> },
      ],
    },
  ],
  SME: [
    {
      type: 'group',
      label: 'Tổng quan',
      children: [
        { key: '/sme/dashboard', icon: <DashboardOutlined />, label: <Link to="/sme/dashboard">Dashboard</Link> },
        { key: '/sme/projects', icon: <FolderOpenOutlined />, label: <Link to="/sme/projects">Dự án của tôi</Link> },
        { key: '/sme/projects/new', icon: <PlusCircleOutlined />, label: <Link to="/sme/projects/new">Tạo dự án</Link> },
      ],
    },
    {
      type: 'group',
      label: 'Tuyển chọn',
      children: [
        { key: '/sme/applications', icon: <FileSearchOutlined />, label: <Link to="/sme/applications">Ứng tuyển</Link> },
        { key: '/sme/offers', icon: <MessageOutlined />, label: <Link to="/sme/offers">Đề nghị</Link> },
      ],
    },
    {
      type: 'group',
      label: 'Tài khoản',
      children: [
        { key: '/sme/billing', icon: <CreditCardOutlined />, label: <Link to="/sme/billing">Gói & thanh toán</Link> },
        { key: '/sme/profile', icon: <BankOutlined />, label: <Link to="/sme/profile">Hồ sơ doanh nghiệp</Link> },
        { key: '/sme/ratings', icon: <StarOutlined />, label: <Link to="/sme/ratings">Đánh giá</Link> },
      ],
    },
  ],
  ADMIN: [
    {
      type: 'group',
      label: 'Vận hành',
      children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Dashboard</Link> },
        { key: '/admin/verifications', icon: <FileSearchOutlined />, label: <Link to="/admin/verifications">Duyệt xác thực</Link> },
        { key: '/admin/projects', icon: <FolderOpenOutlined />, label: <Link to="/admin/projects">Dự án</Link> },
        { key: '/admin/package-support', icon: <CreditCardOutlined />, label: <Link to="/admin/package-support">Package support</Link> },
        { key: '/admin/withdrawals', icon: <WalletOutlined />, label: <Link to="/admin/withdrawals">Rút tiền</Link> },
        { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Người dùng</Link> },
      ],
    },
  ],
};

const pageTitleByPath = {
  '/student/dashboard': 'Student dashboard',
  '/student/projects': 'Marketplace dự án',
  '/student/applications': 'Ứng tuyển của tôi',
  '/student/offers': 'Đề nghị',
  '/student/my-projects': 'Dự án của tôi',
  '/student/portfolio': 'Portfolio',
  '/student/billing': 'Gói AI',
  '/student/wallet': 'Ví D4U',
  '/student/profile': 'Hồ sơ sinh viên',
  '/student/verification': 'Xác thực sinh viên',
  '/student/ratings': 'Đánh giá',
  '/sme/dashboard': 'SME dashboard',
  '/sme/projects': 'Quản lý dự án',
  '/sme/projects/new': 'Tạo dự án',
  '/sme/applications': 'Ứng tuyển',
  '/sme/students': 'Hồ sơ Student',
  '/sme/offers': 'Đề nghị',
  '/sme/ai-brief': 'Trợ lý AI Brief',
  '/sme/ai-matching': 'Gợi ý AI',
  '/sme/billing': 'Gói & thanh toán',
  '/sme/profile': 'Hồ sơ doanh nghiệp',
  '/sme/ratings': 'Đánh giá',
  '/admin/dashboard': 'Admin dashboard',
  '/admin/verifications': 'Duyệt xác thực',
  '/admin/projects': 'Quản lý dự án',
  '/admin/portfolio': 'Duyệt portfolio',
  '/admin/package-support': 'Package support',
  '/admin/withdrawals': 'Xử lý rút tiền',
  '/admin/users': 'Người dùng',
  '/admin/audit-logs': 'Audit logs',
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
          <h2 className="px-3 text-[11px] font-black uppercase tracking-[0.16em] text-d4u-teal-deep/60">
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
                    'group flex min-h-[48px] items-center gap-3 rounded-btn border border-transparent px-3.5 py-2.5 text-sm font-semibold transition-all duration-150',
                    active
                      ? 'border-d4u-cyan/60 bg-white/90 text-d4u-teal-deep shadow-soft ring-1 ring-d4u-cyan/15'
                      : 'text-d4u-text-2 hover:border-white/60 hover:bg-white/65 hover:text-d4u-teal-deep',
                  ].join(' ')}
                >
                  <span className={active ? 'text-d4u-cyan' : 'text-d4u-teal-deep/80 group-hover:text-d4u-teal-deep'}>
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
    <div className="flex h-full flex-col bg-gradient-to-b from-d4u-soft-2 via-white to-d4u-soft text-d4u-text-1">
      <div className="border-b border-d4u-cyan/15 px-5 py-5">
        <div className="rounded-card border border-white/70 bg-white/75 p-3 shadow-soft ring-1 ring-white/60 backdrop-blur-sm">
          <D4ULogo className="w-[186px]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="rounded-panel border border-white/55 bg-white/35 p-2.5 shadow-soft backdrop-blur-sm">
          <SidebarNav items={items} selectedKey={selectedKey} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-d4u-bg lg:flex lg:items-start">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-hidden border-r border-d4u-cyan/15 bg-d4u-soft-2 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      <Drawer
        className="[&_.ant-drawer-body]:!p-0 [&_.ant-drawer-content]:!bg-d4u-soft-2"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={256}
        closable={false}
        title={null}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-d4u-soft-2 via-white to-d4u-soft text-d4u-text-1">
          <div className="flex items-center justify-between border-b border-d4u-cyan/15 px-5 py-4">
            <div className="rounded-card border border-white/70 bg-white/75 p-3 shadow-soft ring-1 ring-white/60">
              <D4ULogo className="w-[170px]" />
            </div>
            <Button
              type="text"
              aria-label="Đóng menu"
              icon={<CloseOutlined />}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-d4u-teal-deep shadow-sm hover:!border-d4u-cyan hover:!bg-white hover:!text-d4u-cyan"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="rounded-panel border border-white/55 bg-white/35 p-2.5 shadow-soft backdrop-blur-sm">
              <SidebarNav items={items} selectedKey={selectedKey} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      </Drawer>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[70px] items-center gap-3 border-b border-d4u-border/80 bg-white/90 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:px-6">
          <Button
            aria-label="Mở menu"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-d4u-border/80 bg-white/90 text-d4u-teal-deep shadow-sm backdrop-blur hover:!border-d4u-cyan hover:!text-d4u-cyan focus-visible:!border-d4u-cyan focus-visible:!outline-none focus-visible:shadow-focus lg:!hidden"
          />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-d4u-text-3">D4U Outcome 1</span>
            <strong className="truncate text-[17px] font-semibold leading-tight text-d4u-text-1 sm:text-[18px]">{title}</strong>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5 sm:gap-3">
            <NotificationBell />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main className="relative min-w-0 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft/70 via-d4u-bg to-white" />
            <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-d4u-cyan/5 blur-[110px]" />
            <div className="absolute right-[-72px] top-12 h-72 w-72 rounded-full bg-d4u-soft-2/75 blur-[120px]" />
            <div className="absolute bottom-[-100px] left-1/4 h-56 w-56 rounded-full bg-d4u-cyan/5 blur-[110px]" />
          </div>

          <div className="relative rounded-[28px] border border-white/80 bg-white/42 p-3 shadow-soft sm:p-4 lg:p-5">
            <PageShell size="wide" density="standard">
              <Outlet />
            </PageShell>
          </div>
        </main>
      </div>
    </div>
  );
}

function getSelectedKey(flatItems, pathname) {
  if (pathname.startsWith('/sme/students/')) {
    return '/sme/students';
  }

  return [...flatItems]
    .sort((a, b) => b.key.length - a.key.length)
    .find((item) => pathname.startsWith(item.key))?.key || flatItems[0]?.key;
}
