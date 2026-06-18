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
      onClick: onLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button className="group inline-flex min-h-[40px] max-w-[230px] items-center gap-2.5 rounded-[10px] border border-d4u-border/90 bg-white px-2.5 py-1.5 text-d4u-text-1 shadow-none transition-all duration-150 hover:!border-d4u-cyan/45 hover:!bg-white hover:shadow-sm focus-visible:!border-d4u-cyan focus-visible:!outline-none focus-visible:shadow-focus sm:max-w-[260px]">
        <Avatar
          className="shrink-0 !bg-d4u-cyan font-black !text-d4u-surface shadow-none transition-transform duration-150 group-hover:scale-[1.02]"
          size={34}
          icon={!user?.fullName && <UserOutlined />}
        >
          {user?.fullName ? getInitials(user.fullName) : null}
        </Avatar>
        <span className="hidden min-w-0 flex-1 text-left sm:grid sm:gap-[1px]">
          <Text strong className="truncate text-[13px] font-semibold leading-[1.15] text-d4u-text-1">
            {user?.fullName || 'D4U User'}
          </Text>
          <Text className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] leading-[1.15] !text-d4u-text-3">
            {roleLabels[user?.role] || user?.role}
          </Text>
        </span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-d4u-teal-deep transition-all duration-150 group-hover:text-d4u-cyan">
          <DownOutlined className="text-[11px]" />
        </span>
      </Button>
    </Dropdown>
  );
}
