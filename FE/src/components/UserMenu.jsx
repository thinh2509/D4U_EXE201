import { DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Typography } from 'antd';
import { roleLabels } from '../constants/status';

const { Text } = Typography;

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'D4';
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
}

export function UserMenu({ user, onLogout }) {
  const items = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất khỏi D4U',
      onClick: onLogout
    }
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button className="group inline-flex min-h-[44px] max-w-[220px] items-center gap-2 rounded-full border border-d4u-border/80 bg-white/95 py-1.5 pl-1.5 pr-3 text-d4u-text-1 shadow-sm backdrop-blur transition-all duration-150 hover:!border-d4u-cyan hover:!bg-d4u-soft-2 hover:shadow-soft focus-visible:!border-d4u-cyan focus-visible:!outline-none focus-visible:shadow-focus sm:max-w-[260px]">
        <Avatar
          className="shrink-0 border border-white/70 !bg-d4u-cyan font-black !text-d4u-surface shadow-sm transition-transform duration-150 group-hover:scale-[1.02]"
          size={36}
          icon={!user?.fullName && <UserOutlined />}
        >
          {user?.fullName ? getInitials(user.fullName) : null}
        </Avatar>
        <span className="hidden min-w-0 flex-1 text-left sm:grid sm:gap-0.5">
          <Text strong className="truncate text-sm font-semibold leading-[1.15] text-d4u-text-1">
            {user?.fullName || 'D4U User'}
          </Text>
          <Text className="truncate text-[11px] font-medium uppercase tracking-[0.04em] leading-[1.15] !text-d4u-text-2">
            {roleLabels[user?.role] || user?.role}
          </Text>
        </span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-d4u-soft text-d4u-text-3 transition-all duration-150 group-hover:bg-white group-hover:text-d4u-teal-deep">
          <DownOutlined className="text-[11px]" />
        </span>
      </Button>
    </Dropdown>
  );
}
