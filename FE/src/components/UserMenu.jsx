import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
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
      <Button className="user-menu-button">
        <Avatar className="user-avatar" size={36} icon={!user?.fullName && <UserOutlined />}>
          {user?.fullName ? getInitials(user.fullName) : null}
        </Avatar>
        <span className="user-menu-text">
          <Text strong>{user?.fullName || 'D4U User'}</Text>
          <Text type="secondary">{roleLabels[user?.role] || user?.role}</Text>
        </span>
      </Button>
    </Dropdown>
  );
}
