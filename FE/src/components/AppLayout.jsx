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
import { Button, Drawer, Menu, Tag } from 'antd';
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
      label: 'T\u1ed5ng quan',
      children: [
        { key: '/student/dashboard', icon: <DashboardOutlined />, label: <Link to="/student/dashboard">Dashboard</Link> },
        { key: '/student/projects', icon: <FolderOpenOutlined />, label: <Link to="/student/projects">D\u1ef1 \u00e1n \u0111ang m\u1edf</Link> }
      ]
    },
    {
      type: 'group',
      label: 'C\u00f4ng vi\u1ec7c',
      children: [
        { key: '/student/applications', icon: <FileDoneOutlined />, label: <Link to="/student/applications">\u1ee8ng tuy\u1ec3n</Link> },
        { key: '/student/offers', icon: <MessageOutlined />, label: <Link to="/student/offers">\u0110\u1ec1 ngh\u1ecb</Link> },
        { key: '/student/my-projects', icon: <BookOutlined />, label: <Link to="/student/my-projects">D\u1ef1 \u00e1n c\u1ee7a t\u00f4i</Link> }
      ]
    },
    {
      type: 'group',
      label: 'H\u1ed3 s\u01a1',
      children: [
        { key: '/student/portfolio', icon: <StarOutlined />, label: <Link to="/student/portfolio">Portfolio</Link> },
        { key: '/student/wallet', icon: <WalletOutlined />, label: <Link to="/student/wallet">V\u00ed D4U</Link> },
        { key: '/student/profile', icon: <UserOutlined />, label: <Link to="/student/profile">H\u1ed3 s\u01a1 sinh vi\u00ean</Link> },
        { key: '/student/verification', icon: <SafetyCertificateOutlined />, label: <Link to="/student/verification">X\u00e1c th\u1ef1c</Link> },
        { key: '/student/ratings', icon: <StarOutlined />, label: <Link to="/student/ratings">\u0110\u00e1nh gi\u00e1</Link> }
      ]
    }
  ],
  SME: [
    {
      type: 'group',
      label: 'T\u1ed5ng quan',
      children: [
        { key: '/sme/dashboard', icon: <DashboardOutlined />, label: <Link to="/sme/dashboard">Dashboard</Link> },
        { key: '/sme/projects', icon: <FolderOpenOutlined />, label: <Link to="/sme/projects">D\u1ef1 \u00e1n c\u1ee7a t\u00f4i</Link> },
        { key: '/sme/projects/new', icon: <PlusCircleOutlined />, label: <Link to="/sme/projects/new">T\u1ea1o d\u1ef1 \u00e1n</Link> }
      ]
    },
    {
      type: 'group',
      label: 'Tuy\u1ec3n ch\u1ecdn',
      children: [
        { key: '/sme/applications', icon: <FileSearchOutlined />, label: <Link to="/sme/applications">\u1ee8ng tuy\u1ec3n</Link> },
        { key: '/sme/offers', icon: <MessageOutlined />, label: <Link to="/sme/offers">\u0110\u1ec1 ngh\u1ecb</Link> },
        { key: '/sme/ai-brief', icon: <BulbOutlined />, label: <Link to="/sme/ai-brief">AI Brief</Link> },
        { key: '/sme/ai-matching', icon: <TeamOutlined />, label: <Link to="/sme/ai-matching">AI Matching</Link> }
      ]
    },
    {
      type: 'group',
      label: 'T\u00e0i kho\u1ea3n',
      children: [
        { key: '/sme/billing', icon: <CreditCardOutlined />, label: <Link to="/sme/billing">G\u00f3i & thanh to\u00e1n</Link> },
        { key: '/sme/profile', icon: <BankOutlined />, label: <Link to="/sme/profile">H\u1ed3 s\u01a1 doanh nghi\u1ec7p</Link> },
        { key: '/sme/ratings', icon: <StarOutlined />, label: <Link to="/sme/ratings">\u0110\u00e1nh gi\u00e1</Link> }
      ]
    }
  ],
  ADMIN: [
    {
      type: 'group',
      label: 'V\u1eadn h\u00e0nh',
      children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Dashboard</Link> },
        { key: '/admin/verifications', icon: <FileSearchOutlined />, label: <Link to="/admin/verifications">Duy\u1ec7t x\u00e1c th\u1ef1c</Link> },
        { key: '/admin/portfolio', icon: <StarOutlined />, label: <Link to="/admin/portfolio">Portfolio</Link> },
        { key: '/admin/withdrawals', icon: <WalletOutlined />, label: <Link to="/admin/withdrawals">R\u00fat ti\u1ec1n</Link> },
        { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Ng\u01b0\u1eddi d\u00f9ng</Link> },
        { key: '/admin/audit-logs', icon: <AuditOutlined />, label: <Link to="/admin/audit-logs">Audit logs</Link> }
      ]
    }
  ]
};

const pageTitleByPath = {
  '/student/dashboard': 'Student dashboard',
  '/student/projects': 'Marketplace d\u1ef1 \u00e1n',
  '/student/applications': '\u1ee8ng tuy\u1ec3n c\u1ee7a t\u00f4i',
  '/student/offers': '\u0110\u1ec1 ngh\u1ecb',
  '/student/my-projects': 'D\u1ef1 \u00e1n c\u1ee7a t\u00f4i',
  '/student/portfolio': 'Portfolio',
  '/student/wallet': 'V\u00ed D4U',
  '/student/profile': 'H\u1ed3 s\u01a1 sinh vi\u00ean',
  '/student/verification': 'X\u00e1c th\u1ef1c sinh vi\u00ean',
  '/student/ratings': '\u0110\u00e1nh gi\u00e1',
  '/sme/dashboard': 'SME dashboard',
  '/sme/projects': 'Qu\u1ea3n l\u00fd d\u1ef1 \u00e1n',
  '/sme/projects/new': 'T\u1ea1o d\u1ef1 \u00e1n',
  '/sme/applications': '\u1ee8ng tuy\u1ec3n',
  '/sme/offers': '\u0110\u1ec1 ngh\u1ecb',
  '/sme/ai-brief': 'AI Brief Assistant',
  '/sme/ai-matching': 'AI Matching',
  '/sme/billing': 'G\u00f3i & thanh to\u00e1n',
  '/sme/profile': 'H\u1ed3 s\u01a1 doanh nghi\u1ec7p',
  '/sme/ratings': '\u0110\u00e1nh gi\u00e1',
  '/admin/dashboard': 'Admin dashboard',
  '/admin/verifications': 'Duy\u1ec7t x\u00e1c th\u1ef1c',
  '/admin/portfolio': 'Duy\u1ec7t portfolio',
  '/admin/withdrawals': 'X\u1eed l\u00fd r\u00fat ti\u1ec1n',
  '/admin/users': 'Ng\u01b0\u1eddi d\u00f9ng',
  '/admin/audit-logs': 'Audit logs'
};

function flattenMenu(items) {
  return items.flatMap((item) => item.children || item);
}

function AppMenu({ items, selectedKey, onClick }) {
  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={items}
      onClick={onClick}
      className="!border-none !bg-transparent"
    />
  );
}

function getSelectedKey(flatItems, pathname) {
  return [...flatItems]
    .sort((a, b) => b.key.length - a.key.length)
    .find((item) => pathname.startsWith(item.key))?.key || flatItems[0]?.key;
}

function getRoleText(role) {
  if (role === 'STUDENT') return 'Student workspace';
  if (role === 'SME') return 'SME workspace';
  return 'Admin console';
}

function getRoleCaption(role) {
  if (role === 'STUDENT') return 'T\u00ecm d\u1ef1 \u00e1n, n\u1ed9p b\u00e0i, qu\u1ea3n l\u00fd v\u00ed';
  if (role === 'SME') return '\u0110\u0103ng brief, ch\u1ecdn Student, theo d\u00f5i escrow';
  return 'V\u1eadn h\u00e0nh x\u00e1c th\u1ef1c, v\u00ed v\u00e0 audit';
}

function SiderBrand({ roleText, roleCaption }) {
  return (
    <div className="grid gap-4 border-b border-white/50 px-4 py-5">
      <div className="rounded-card border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur">
        <D4ULogo />
      </div>
      <div className="rounded-card border border-d4u-cyan/15 bg-white/65 p-3 shadow-sm backdrop-blur">
        <Tag className="role-pill">{roleText}</Tag>
        <p className="mt-2 text-sm leading-5 text-d4u-text-2">{roleCaption}</p>
      </div>
    </div>
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
  const roleText = getRoleText(user?.role);
  const roleCaption = getRoleCaption(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-layout min-h-screen bg-d4u-bg lg:flex">
      <aside className="app-sider hidden lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-d4u-border/80">
        <SiderBrand roleText={roleText} roleCaption={roleCaption} />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <AppMenu items={items} selectedKey={selectedKey} />
        </div>
      </aside>

      <Drawer
        className="mobile-nav"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={256}
        title={<D4ULogo />}
      >
        <div className="rounded-card border border-d4u-cyan/15 bg-white/80 p-3 shadow-sm">
          <Tag className="role-pill mobile-role-pill">{roleText}</Tag>
          <p className="mt-2 text-sm leading-5 text-d4u-text-2">{roleCaption}</p>
        </div>
        <div className="pt-4">
          <AppMenu items={items} selectedKey={selectedKey} onClick={() => setDrawerOpen(false)} />
        </div>
      </Drawer>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-d4u-border/80 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Button
            className="mobile-menu-button inline-flex lg:!hidden"
            aria-label="M\u1edf menu"
            icon={<MenuOutlined />}
            onClick={() => setDrawerOpen(true)}
          />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-d4u-text-3">D4U Outcome 1</span>
            <strong className="truncate text-base font-semibold text-d4u-text-1 sm:text-lg">{title}</strong>
          </div>
          <div className="flex-1" />
          <Tag className="header-chip hidden sm:inline-flex" icon={<BuildOutlined />}>Public demo</Tag>
          <NotificationBell />
          <UserMenu user={user} onLogout={handleLogout} />
        </header>

        <main className="min-w-0">
          <PageShell>
            <Outlet />
          </PageShell>
        </main>
      </div>
    </div>
  );
}
